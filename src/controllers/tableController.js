const { Bill, Table } = require('../models');
const resourceRepository = require('../repositories/resourceRepository');
const { badRequest, forbidden } = require('../utils/errors');
const { resolveOwnerScope } = require('../utils/ownerScope');

const assertScopedOwner = (scopedOwnerId, value, field) => {
  if (String(value) !== String(scopedOwnerId)) {
    throw forbidden(`${field}.ownerId does not match scope`);
  }
};

const moveTable = async (req, res, next) => {
  const { bill, source_table, target_table } = req.body || {};

  if (!bill || !source_table || !target_table) {
    return next(badRequest('bill, source_table, and target_table are required'));
  }

  if (!bill.ownerId || !source_table.ownerId || !target_table.ownerId) {
    return next(badRequest('ownerId is required for bill, source_table, and target_table'));
  }

  if (!bill.id || !source_table.id || !target_table.id) {
    return next(badRequest('id is required for bill, source_table, and target_table'));
  }

  try {
    const scopedOwnerId = resolveOwnerScope({ user: req.user, requestedOwnerId: bill.ownerId });
    assertScopedOwner(scopedOwnerId, source_table.ownerId, 'source_table');
    assertScopedOwner(scopedOwnerId, target_table.ownerId, 'target_table');

    const updatedBill = await resourceRepository.upsert(
      Bill,
      { id: bill.id, ownerId: scopedOwnerId },
      { ...bill, ownerId: scopedOwnerId }
    );

    const updatedSource = await resourceRepository.upsert(
      Table,
      { id: source_table.id, ownerId: scopedOwnerId },
      { ...source_table, ownerId: scopedOwnerId }
    );

    const updatedTarget = await resourceRepository.upsert(
      Table,
      { id: target_table.id, ownerId: scopedOwnerId },
      { ...target_table, ownerId: scopedOwnerId }
    );

    res.json({
      bill: updatedBill,
      source_table: updatedSource,
      target_table: updatedTarget
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  moveTable
};
