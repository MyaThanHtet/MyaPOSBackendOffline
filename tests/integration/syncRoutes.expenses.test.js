const test = require('node:test');
const assert = require('node:assert/strict');
const { v4: uuidv4 } = require('uuid');

process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapos_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const syncController = require('../../src/controllers/syncController');
const resourceRepository = require('../../src/repositories/resourceRepository');

const originalRepository = {
  list: resourceRepository.list,
  upsert: resourceRepository.upsert,
  update: resourceRepository.update,
  remove: resourceRepository.remove
};

const createInMemoryResourceRepository = () => {
  const expenseRows = [];

  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const isExpenseModel = (Model) => Model?.modelName === 'Expense';
  const matchesFilter = (row, filter = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$ne !== undefined) return row[key] !== value.$ne;
        if (value.$gt !== undefined) return row[key] > value.$gt;
        return true;
      }
      return row[key] === value;
    });

  return {
    list: async (Model, filter = {}, sort) => {
      if (!isExpenseModel(Model)) {
        return [];
      }
      const items = expenseRows.filter((row) => matchesFilter(row, filter));
      if (sort) {
        const [field, direction] = Object.entries(sort)[0];
        items.sort((a, b) => (a[field] - b[field]) * direction);
      }
      return items.map(clone);
    },
    upsert: async (Model, filter, data) => {
      if (!isExpenseModel(Model)) {
        return clone(data);
      }
      const index = expenseRows.findIndex((row) => row.ownerId === filter.ownerId && row.id === filter.id);
      if (index >= 0) {
        expenseRows[index] = { ...expenseRows[index], ...clone(data) };
        return clone(expenseRows[index]);
      }
      expenseRows.push(clone(data));
      return clone(data);
    },
    update: async (Model, filter, data) => {
      if (!isExpenseModel(Model)) {
        return null;
      }
      const index = expenseRows.findIndex((row) => row.ownerId === filter.ownerId && row.id === filter.id);
      if (index < 0) {
        return null;
      }
      expenseRows[index] = { ...expenseRows[index], ...clone(data) };
      return clone(expenseRows[index]);
    },
    remove: async () => null,
    getRows: () => expenseRows.map(clone)
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

test('sync denies cross-owner scope for non-super-admin', async () => {
  const memoryRepo = createInMemoryResourceRepository();
  resourceRepository.list = memoryRepo.list;
  resourceRepository.upsert = memoryRepo.upsert;
  resourceRepository.update = memoryRepo.update;
  resourceRepository.remove = memoryRepo.remove;

  const response = await execute(syncController.push, {
    user: { uid: 'owner_u1', role: 'owner', ownerId: 'owner_1' },
    body: {
      ownerId: 'owner_2',
      entries: []
    }
  });

  assert.ok(response.err);
  assert.equal(response.err.status, 403);
});

test('sync supports super admin explicit owner scope for expenses', async () => {
  const memoryRepo = createInMemoryResourceRepository();
  resourceRepository.list = memoryRepo.list;
  resourceRepository.upsert = memoryRepo.upsert;
  resourceRepository.update = memoryRepo.update;
  resourceRepository.remove = memoryRepo.remove;

  const expenseId = uuidv4();

  const pushResponse = await execute(syncController.push, {
    user: { uid: 'super_u1', role: 'super_admin', ownerId: 'super_owner' },
    body: {
      ownerId: 'owner_2',
      entries: [
        {
          id: 'entry_1',
          entity: 'expenses',
          entity_id: expenseId,
          type: 'upsert',
          payload: {
            title: 'Utilities',
            amount: 30,
            category: 'utility',
            spentAt: 1710000000000,
            updatedAt: 1710000000100,
            ownerId: 'owner_999'
          }
        }
      ]
    }
  });

  assert.equal(pushResponse.err, null);
  assert.equal(pushResponse.res.statusCode, 200);
  assert.equal(pushResponse.res.body.applied.length, 1);
  assert.equal(pushResponse.res.body.rejected.length, 0);

  const rows = memoryRepo.getRows();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ownerId, 'owner_2');

  const pullResponse = await execute(syncController.pull, {
    user: { uid: 'super_u1', role: 'super_admin', ownerId: 'super_owner' },
    body: {
      ownerId: 'owner_2',
      since: {
        expenses: 0
      },
      include_deleted: true
    }
  });

  assert.equal(pullResponse.err, null);
  assert.equal(pullResponse.res.statusCode, 200);
  assert.ok(Array.isArray(pullResponse.res.body.changes.expenses));
  assert.equal(pullResponse.res.body.changes.expenses.length, 1);
  assert.equal(pullResponse.res.body.changes.expenses[0].id, expenseId);
});

test.after(() => {
  resourceRepository.list = originalRepository.list;
  resourceRepository.upsert = originalRepository.upsert;
  resourceRepository.update = originalRepository.update;
  resourceRepository.remove = originalRepository.remove;
});
