const mongoose = require('mongoose');
const { Bill, Table } = require('../models');
const { badRequest, notFound } = require('../utils/errors');

const moveTable = async (req, res, next) => {
  const { bill, source_table, target_table } = req.body || {};

  if (!bill || !source_table || !target_table) {
    return next(badRequest('bill, source_table, and target_table are required'));
  }

  if (!bill.ownerId || !source_table.ownerId || !target_table.ownerId) {
    return next(badRequest('ownerId is required for bill, source_table, and target_table'));
  }

  const session = await mongoose.startSession();

  try {
    let updatedBill;
    let updatedSource;
    let updatedTarget;

    await session.withTransaction(async () => {
      updatedBill = await Bill.findOneAndUpdate({ id: bill.id, ownerId: bill.ownerId }, bill, {
        new: true,
        upsert: true,
        session
      });
      if (!updatedBill) {
        throw notFound('Bill not found');
      }

      updatedSource = await Table.findOneAndUpdate(
        { id: source_table.id, ownerId: source_table.ownerId },
        source_table,
        {
          new: true,
          upsert: true,
          session
        }
      );
      updatedTarget = await Table.findOneAndUpdate(
        { id: target_table.id, ownerId: target_table.ownerId },
        target_table,
        {
          new: true,
          upsert: true,
          session
        }
      );
    });

    res.json({
      bill: updatedBill,
      source_table: updatedSource,
      target_table: updatedTarget
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = {
  moveTable
};
