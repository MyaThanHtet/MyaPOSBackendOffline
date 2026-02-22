const test = require('node:test');
const assert = require('node:assert/strict');
const { v4: uuidv4 } = require('uuid');

process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapos_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const syncService = require('../../src/services/syncService');
const resourceRepository = require('../../src/repositories/resourceRepository');

const originalRepository = {
  list: resourceRepository.list,
  upsert: resourceRepository.upsert,
  update: resourceRepository.update,
  remove: resourceRepository.remove
};

const createExpenseStore = () => {
  const rows = [];

  const isExpenseModel = (Model) => Model?.modelName === 'Expense';
  const matchesFilter = (row, filter = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$gt !== undefined) {
          return row[key] > value.$gt;
        }
        if (value.$ne !== undefined) {
          return row[key] !== value.$ne;
        }
        return false;
      }
      return row[key] === value;
    });

  return {
    rows,
    list: async (Model, filter, sort) => {
      if (!isExpenseModel(Model)) {
        return [];
      }
      const items = rows.filter((row) => matchesFilter(row, filter));
      if (sort) {
        const [field, direction] = Object.entries(sort)[0];
        items.sort((a, b) => (a[field] - b[field]) * direction);
      }
      return items.map((item) => ({ ...item }));
    },
    upsert: async (Model, filter, data) => {
      if (!isExpenseModel(Model)) {
        return { ...data };
      }
      const idx = rows.findIndex((row) => row.id === filter.id && row.ownerId === filter.ownerId);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...data };
        return { ...rows[idx] };
      }
      rows.push({ ...data });
      return { ...data };
    },
    update: async (Model, filter, data) => {
      if (!isExpenseModel(Model)) {
        return null;
      }
      const idx = rows.findIndex((row) => row.id === filter.id && row.ownerId === filter.ownerId);
      if (idx < 0) {
        return null;
      }
      rows[idx] = { ...rows[idx], ...data };
      return { ...rows[idx] };
    },
    remove: async () => null
  };
};

test.afterEach(() => {
  resourceRepository.list = originalRepository.list;
  resourceRepository.upsert = originalRepository.upsert;
  resourceRepository.update = originalRepository.update;
  resourceRepository.remove = originalRepository.remove;
});

test('push upsert expense applies and normalizes payload', async () => {
  const store = createExpenseStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const expenseId = uuidv4();
  const result = await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_1',
        entity: 'expenses',
        entity_id: expenseId,
        type: 'upsert',
        payload: {
          title: '  Coffee beans  ',
          amount: '12.5',
          category: '  supplies ',
          note: '  restock  ',
          spentAt: 1710000000000,
          updatedAt: 1710000001000,
          ownerId: 'owner_2'
        }
      }
    ]
  });

  assert.equal(result.applied.length, 1);
  assert.equal(result.rejected.length, 0);
  assert.equal(store.rows.length, 1);
  assert.equal(store.rows[0].ownerId, 'owner_1');
  assert.equal(store.rows[0].title, 'Coffee beans');
  assert.equal(store.rows[0].category, 'supplies');
  assert.equal(store.rows[0].note, 'restock');
});

test('push delete expense soft deletes with updatedAt', async () => {
  const store = createExpenseStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const expenseId = uuidv4();
  await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_upsert',
        entity: 'expenses',
        entity_id: expenseId,
        type: 'upsert',
        payload: {
          title: 'Gas',
          amount: 20,
          category: 'transport',
          spentAt: 1710000000000,
          updatedAt: 1710000000000
        }
      }
    ]
  });

  const result = await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_delete',
        entity: 'expenses',
        entity_id: expenseId,
        type: 'delete'
      }
    ]
  });

  assert.equal(result.applied.length, 1);
  assert.equal(result.rejected.length, 0);
  assert.equal(store.rows[0].isDeleted, true);
  assert.ok(store.rows[0].updatedAt >= 1710000000000);
});

test('pull respects since.expenses incrementally', async () => {
  const store = createExpenseStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_1',
        entity: 'expenses',
        entity_id: uuidv4(),
        type: 'upsert',
        payload: {
          title: 'A',
          amount: 10,
          category: 'c1',
          spentAt: 1710000000000,
          updatedAt: 1710000000100
        }
      },
      {
        id: 'entry_2',
        entity: 'expenses',
        entity_id: uuidv4(),
        type: 'upsert',
        payload: {
          title: 'B',
          amount: 20,
          category: 'c2',
          spentAt: 1710000000200,
          updatedAt: 1710000000300
        }
      }
    ]
  });

  const result = await syncService.pull({
    ownerId: 'owner_1',
    since: {
      expenses: 1710000000200
    },
    include_deleted: true
  });

  assert.ok(Array.isArray(result.changes.expenses));
  assert.equal(result.changes.expenses.length, 1);
  assert.equal(result.changes.expenses[0].title, 'B');
});

test('bootstrap includes expenses in changes', async () => {
  const store = createExpenseStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_1',
        entity: 'expenses',
        entity_id: uuidv4(),
        type: 'upsert',
        payload: {
          title: 'Electricity',
          amount: 50,
          category: 'utility',
          spentAt: 1710000000000,
          updatedAt: 1710000000100
        }
      }
    ]
  });

  const result = await syncService.bootstrap('owner_1');
  assert.ok(Object.prototype.hasOwnProperty.call(result.changes, 'expenses'));
  assert.equal(result.changes.expenses.length, 1);
});
