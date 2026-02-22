const test = require('node:test');
const assert = require('node:assert/strict');
const { v4: uuidv4 } = require('uuid');

process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapos_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const expenseController = require('../../src/controllers/expenseController');
const expenseRepository = require('../../src/repositories/expenseRepository');

const originalRepository = {
  list: expenseRepository.list,
  create: expenseRepository.create,
  upsertByOwnerAndId: expenseRepository.upsertByOwnerAndId,
  softDeleteByOwnerAndId: expenseRepository.softDeleteByOwnerAndId,
  summary: expenseRepository.summary
};

const createInMemoryExpenseRepository = () => {
  const rows = [];

  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const matchesFilter = (row, filter = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$ne !== undefined) return row[key] !== value.$ne;
        if (value.$gte !== undefined && row[key] < value.$gte) return false;
        if (value.$lte !== undefined && row[key] > value.$lte) return false;
        return true;
      }
      return row[key] === value;
    });

  return {
    rows,
    list: async (filter, options = {}) => {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const filtered = rows
        .filter((row) => matchesFilter(row, filter))
        .sort((a, b) => (b.spentAt - a.spentAt) || (b.updatedAt - a.updatedAt));
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit).map(clone);
      return {
        items,
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      };
    },
    create: async (data) => {
      rows.push(clone(data));
      return clone(data);
    },
    upsertByOwnerAndId: async (ownerId, id, data) => {
      const index = rows.findIndex((row) => row.ownerId === ownerId && row.id === id);
      if (index >= 0) {
        rows[index] = { ...rows[index], ...clone(data) };
        return clone(rows[index]);
      }
      rows.push(clone(data));
      return clone(data);
    },
    softDeleteByOwnerAndId: async (ownerId, id, updatedAt) => {
      const index = rows.findIndex((row) => row.ownerId === ownerId && row.id === id);
      if (index < 0) {
        return null;
      }
      rows[index] = { ...rows[index], isDeleted: true, updatedAt };
      return clone(rows[index]);
    },
    summary: async (filter) => {
      const filtered = rows.filter((row) => matchesFilter(row, filter));
      return {
        totalExpense: filtered.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        count: filtered.length
      };
    }
  };
};

const createRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

const execute = async (handler, req) => {
  const res = createRes();
  return new Promise((resolve) => {
    const next = (err) => resolve({ err, res });
    Promise.resolve(handler(req, res, next))
      .then(() => resolve({ err: null, res }))
      .catch((err) => resolve({ err, res }));
  });
};

test('REST CRUD + summary for expenses', async () => {
  const memoryRepo = createInMemoryExpenseRepository();
  expenseRepository.list = memoryRepo.list;
  expenseRepository.create = memoryRepo.create;
  expenseRepository.upsertByOwnerAndId = memoryRepo.upsertByOwnerAndId;
  expenseRepository.softDeleteByOwnerAndId = memoryRepo.softDeleteByOwnerAndId;
  expenseRepository.summary = memoryRepo.summary;

  const ownerUser = { uid: 'owner_u1', role: 'owner', ownerId: 'owner_1' };
  const createdId = uuidv4();
  const secondId = uuidv4();

  const created = await execute(expenseController.createExpense, {
    user: ownerUser,
    query: {},
    body: {
      id: createdId,
      title: ' Coffee beans ',
      amount: 20.5,
      category: ' supplies ',
      note: ' weekly',
      spentAt: 1710000000000,
      updatedAt: 1710000000100
    }
  });
  assert.equal(created.err, null);
  assert.equal(created.res.statusCode, 201);
  assert.equal(created.res.body.id, createdId);
  assert.equal(created.res.body.ownerId, 'owner_1');
  assert.equal(created.res.body.title, 'Coffee beans');

  const second = await execute(expenseController.createExpense, {
    user: ownerUser,
    query: {},
    body: {
      id: secondId,
      title: 'Electric bill',
      amount: 50,
      category: 'utility',
      spentAt: 1710000000200,
      updatedAt: 1710000000300
    }
  });
  assert.equal(second.err, null);
  assert.equal(second.res.statusCode, 201);

  const listed = await execute(expenseController.listExpenses, {
    user: ownerUser,
    query: { page: '1', limit: '10', category: 'supplies' },
    body: {}
  });
  assert.equal(listed.err, null);
  assert.equal(listed.res.statusCode, 200);
  assert.equal(listed.res.body.total, 1);
  assert.equal(listed.res.body.items[0].id, createdId);

  const updated = await execute(expenseController.upsertExpense, {
    user: ownerUser,
    params: { id: createdId },
    query: {},
    body: {
      title: 'Coffee beans premium',
      amount: 25,
      category: 'supplies',
      note: 'restocked',
      spentAt: 1710000000000,
      updatedAt: 1710000000400
    }
  });
  assert.equal(updated.err, null);
  assert.equal(updated.res.statusCode, 200);
  assert.equal(updated.res.body.amount, 25);

  const deleted = await execute(expenseController.deleteExpense, {
    user: ownerUser,
    params: { id: secondId },
    query: {},
    body: {}
  });
  assert.equal(deleted.err, null);
  assert.equal(deleted.res.statusCode, 200);
  assert.equal(deleted.res.body.deleted, true);
  assert.equal(deleted.res.body.resource.isDeleted, true);

  const summary = await execute(expenseController.summary, {
    user: ownerUser,
    query: { from: '1710000000000', to: '1710000000600' },
    body: {}
  });
  assert.equal(summary.err, null);
  assert.equal(summary.res.statusCode, 200);
  assert.equal(summary.res.body.count, 1);
  assert.equal(summary.res.body.totalExpense, 25);
});

test('owner isolation and super admin scoped access for expenses', async () => {
  const memoryRepo = createInMemoryExpenseRepository();
  expenseRepository.list = memoryRepo.list;
  expenseRepository.create = memoryRepo.create;
  expenseRepository.upsertByOwnerAndId = memoryRepo.upsertByOwnerAndId;
  expenseRepository.softDeleteByOwnerAndId = memoryRepo.softDeleteByOwnerAndId;
  expenseRepository.summary = memoryRepo.summary;

  const ownerUser = { uid: 'owner_u1', role: 'owner', ownerId: 'owner_1' };
  const superUser = { uid: 'super_u1', role: 'super_admin', ownerId: 'super_owner' };
  const targetExpenseId = uuidv4();

  const denied = await execute(expenseController.listExpenses, {
    user: ownerUser,
    query: { ownerId: 'owner_2' },
    body: {}
  });
  assert.ok(denied.err);
  assert.equal(denied.err.status, 403);

  const scopedCreate = await execute(expenseController.createExpense, {
    user: superUser,
    query: {},
    body: {
      ownerId: 'owner_2',
      id: targetExpenseId,
      title: 'Marketing',
      amount: 100,
      category: 'ads',
      spentAt: 1710000000000,
      updatedAt: 1710000000100
    }
  });
  assert.equal(scopedCreate.err, null);
  assert.equal(scopedCreate.res.statusCode, 201);
  assert.equal(scopedCreate.res.body.ownerId, 'owner_2');

  const scopedList = await execute(expenseController.listExpenses, {
    user: superUser,
    query: { ownerId: 'owner_2' },
    body: {}
  });
  assert.equal(scopedList.err, null);
  assert.equal(scopedList.res.statusCode, 200);
  assert.equal(scopedList.res.body.total, 1);
  assert.equal(scopedList.res.body.items[0].id, targetExpenseId);
});

test.after(() => {
  expenseRepository.list = originalRepository.list;
  expenseRepository.create = originalRepository.create;
  expenseRepository.upsertByOwnerAndId = originalRepository.upsertByOwnerAndId;
  expenseRepository.softDeleteByOwnerAndId = originalRepository.softDeleteByOwnerAndId;
  expenseRepository.summary = originalRepository.summary;
});
