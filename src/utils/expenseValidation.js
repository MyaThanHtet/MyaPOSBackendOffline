const { validate: isUuid } = require('uuid');
const { badRequest } = require('./errors');
const { parseNumber } = require('./validation');

const MAX_TITLE_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 80;
const MAX_NOTE_LENGTH = 2000;

const requireTrimmedString = (value, field, maxLength) => {
  const trimmed = value !== undefined && value !== null ? String(value).trim() : '';
  if (!trimmed) {
    throw badRequest(`${field} is required`);
  }
  if (trimmed.length > maxLength) {
    throw badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
};

const optionalTrimmedString = (value, field, maxLength) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length > maxLength) {
    throw badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
};

const requireEpochMs = (value, field) => {
  const parsed = parseNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${field} must be epoch milliseconds`);
  }
  return parsed;
};

const requireAmount = (value) => {
  const parsed = parseNumber(value);
  if (parsed === undefined) {
    throw badRequest('amount must be a number');
  }
  if (parsed < 0) {
    throw badRequest('amount must be greater than or equal to 0');
  }
  return parsed;
};

const normalizeExpensePayload = (payload = {}) => {
  const normalized = { ...payload };
  normalized.title = requireTrimmedString(payload.title, 'title', MAX_TITLE_LENGTH);
  normalized.category = requireTrimmedString(payload.category, 'category', MAX_CATEGORY_LENGTH);
  normalized.note = optionalTrimmedString(payload.note, 'note', MAX_NOTE_LENGTH);
  normalized.amount = requireAmount(payload.amount);
  normalized.spentAt = requireEpochMs(payload.spentAt, 'spentAt');
  normalized.updatedAt = requireEpochMs(payload.updatedAt, 'updatedAt');

  return normalized;
};

const normalizeExpenseId = (value, field = 'id') => {
  const id = value !== undefined && value !== null ? String(value).trim() : '';
  if (!id) {
    throw badRequest(`${field} is required`);
  }
  if (!isUuid(id)) {
    throw badRequest(`${field} must be a valid UUID`);
  }
  return id;
};

module.exports = {
  MAX_TITLE_LENGTH,
  MAX_CATEGORY_LENGTH,
  MAX_NOTE_LENGTH,
  normalizeExpensePayload,
  normalizeExpenseId,
  requireEpochMs
};
