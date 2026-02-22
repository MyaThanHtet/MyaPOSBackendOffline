const expenseService = require('../services/expenseService');
const { resolveOwnerScope } = require('../utils/ownerScope');

const resolveFromRequest = (req) =>
  resolveOwnerScope({
    user: req.user,
    requestedOwnerId: req.query.ownerId ?? req.body?.ownerId
  });

const listExpenses = async (req, res, next) => {
  try {
    const ownerId = resolveFromRequest(req);
    const result = await expenseService.listExpenses(ownerId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const ownerId = resolveFromRequest(req);
    const result = await expenseService.createExpense(ownerId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const upsertExpense = async (req, res, next) => {
  try {
    const ownerId = resolveFromRequest(req);
    const result = await expenseService.upsertExpense(ownerId, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const ownerId = resolveFromRequest(req);
    const resource = await expenseService.deleteExpense(ownerId, req.params.id, req.body?.updatedAt);
    res.json({ id: req.params.id, deleted: true, resource });
  } catch (err) {
    next(err);
  }
};

const summary = async (req, res, next) => {
  try {
    const ownerId = resolveFromRequest(req);
    const result = await expenseService.getExpenseSummary(ownerId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listExpenses,
  createExpense,
  upsertExpense,
  deleteExpense,
  summary
};
