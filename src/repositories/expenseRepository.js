const { Expense } = require('../models');

const list = async (filter, options) => {
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Expense.find(filter).sort({ spentAt: -1, updatedAt: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filter)
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

const create = (data) => Expense.create(data);

const upsertByOwnerAndId = (ownerId, id, data) =>
  Expense.findOneAndUpdate(
    { ownerId, id },
    data,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

const softDeleteByOwnerAndId = (ownerId, id, updatedAt) =>
  Expense.findOneAndUpdate({ ownerId, id }, { isDeleted: true, updatedAt }, { new: true });

const summary = async (filter) => {
  const result = await Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalExpense: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalExpense: 0, count: 0 };
};

module.exports = {
  list,
  create,
  upsertByOwnerAndId,
  softDeleteByOwnerAndId,
  summary
};
