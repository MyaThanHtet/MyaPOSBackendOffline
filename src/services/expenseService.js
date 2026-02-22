const { v4: uuidv4 } = require('uuid');
const expenseRepository = require('../repositories/expenseRepository');
const { badRequest, notFound } = require('../utils/errors');
const { parseBoolean, parseNumber } = require('../utils/validation');
const { normalizeExpensePayload, normalizeExpenseId, requireEpochMs } = require('../utils/expenseValidation');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const normalizePagination = (query) => {
  const page = query.page !== undefined ? parseNumber(query.page) : DEFAULT_PAGE;
  const limit = query.limit !== undefined ? parseNumber(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(page) || page < 1) {
    throw badRequest('page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw badRequest(`limit must be between 1 and ${MAX_LIMIT}`);
  }

  return { page, limit };
};

const buildDateRangeFilter = (fromValue, toValue, fieldName) => {
  const from = fromValue !== undefined ? requireEpochMs(fromValue, 'from') : undefined;
  const to = toValue !== undefined ? requireEpochMs(toValue, 'to') : undefined;

  if (from !== undefined && to !== undefined && from > to) {
    throw badRequest('from must be less than or equal to to');
  }

  if (from === undefined && to === undefined) {
    return undefined;
  }

  const range = {};
  if (from !== undefined) {
    range.$gte = from;
  }
  if (to !== undefined) {
    range.$lte = to;
  }
  return { [fieldName]: range };
};

const listExpenses = async (ownerId, query = {}) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }

  const filter = { ownerId };
  const includeDeleted = parseBoolean(query.includeDeleted ?? query.include_deleted);
  if (includeDeleted !== true) {
    filter.isDeleted = { $ne: true };
  }

  const spentAtRange = buildDateRangeFilter(query.from, query.to, 'spentAt');
  if (spentAtRange) {
    Object.assign(filter, spentAtRange);
  }

  if (query.category !== undefined) {
    const category = String(query.category).trim();
    if (!category) {
      throw badRequest('category must not be empty');
    }
    filter.category = category;
  }

  const pagination = normalizePagination(query);
  return expenseRepository.list(filter, pagination);
};

const createExpense = async (ownerId, body = {}) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }

  const payload = normalizeExpensePayload(body);
  const id = body.id !== undefined ? normalizeExpenseId(body.id) : uuidv4();

  return expenseRepository.create({
    ...payload,
    id,
    ownerId,
    isDeleted: false
  });
};

const upsertExpense = async (ownerId, expenseId, body = {}) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }

  const id = normalizeExpenseId(expenseId);
  const payload = normalizeExpensePayload(body);
  const data = {
    ...payload,
    id,
    ownerId
  };
  if (body.isDeleted !== undefined) {
    data.isDeleted = body.isDeleted === true;
  }

  return expenseRepository.upsertByOwnerAndId(ownerId, id, data);
};

const deleteExpense = async (ownerId, expenseId, updatedAtValue) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }
  const id = normalizeExpenseId(expenseId);
  const updatedAt = updatedAtValue !== undefined ? requireEpochMs(updatedAtValue, 'updatedAt') : Date.now();
  const doc = await expenseRepository.softDeleteByOwnerAndId(ownerId, id, updatedAt);
  if (!doc) {
    throw notFound('Expense not found');
  }
  return doc;
};

const getExpenseSummary = async (ownerId, query = {}) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }

  const filter = { ownerId, isDeleted: { $ne: true } };
  const spentAtRange = buildDateRangeFilter(query.from, query.to, 'spentAt');
  if (spentAtRange) {
    Object.assign(filter, spentAtRange);
  }

  const result = await expenseRepository.summary(filter);
  return {
    totalExpense: Number(result.totalExpense || 0),
    count: Number(result.count || 0)
  };
};

module.exports = {
  listExpenses,
  createExpense,
  upsertExpense,
  deleteExpense,
  getExpenseSummary
};
