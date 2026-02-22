const test = require('node:test');
const assert = require('node:assert/strict');

process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapos_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { entityConfigs } = require('../../src/config/entities');
const { listResources, upsertResource } = require('../../src/services/resourceService');
const syncService = require('../../src/services/syncService');
const resourceRepository = require('../../src/repositories/resourceRepository');

const pricingConfig = entityConfigs.pricing_settings;

const originalRepository = {
  list: resourceRepository.list,
  upsert: resourceRepository.upsert,
  update: resourceRepository.update,
  remove: resourceRepository.remove
};

const createPricingStore = () => {
  const rows = [];

  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const isPricingModel = (Model) => Model?.modelName === 'PricingSetting';
  const matchesFilter = (row, filter = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$gt !== undefined) {
          return row[key] > value.$gt;
        }
        if (value.$ne !== undefined) {
          return row[key] !== value.$ne;
        }
        return true;
      }
      return row[key] === value;
    });

  return {
    rows,
    list: async (Model, filter = {}, sort) => {
      if (!isPricingModel(Model)) {
        return [];
      }
      const items = rows.filter((row) => matchesFilter(row, filter));
      if (sort) {
        const [field, direction] = Object.entries(sort)[0];
        items.sort((a, b) => (a[field] - b[field]) * direction);
      }
      return items.map(clone);
    },
    upsert: async (Model, filter, data) => {
      if (!isPricingModel(Model)) {
        return clone(data);
      }
      const index = rows.findIndex((row) => row.ownerId === filter.ownerId && row.id === filter.id);
      if (index >= 0) {
        rows[index] = { ...rows[index], ...clone(data) };
        return clone(rows[index]);
      }
      rows.push(clone(data));
      return clone(data);
    },
    update: async () => null,
    remove: async () => null
  };
};

test.afterEach(() => {
  resourceRepository.list = originalRepository.list;
  resourceRepository.upsert = originalRepository.upsert;
  resourceRepository.update = originalRepository.update;
  resourceRepository.remove = originalRepository.remove;
});

test('pricing settings upsert/list normalizes new table service fields', async () => {
  const store = createPricingStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const updated = await upsertResource(pricingConfig, 'pricing_1', {
    ownerId: 'owner_1',
    tax_rate: 0.07,
    tax_type: 'inclusive',
    table_service_charge_enabled: 1,
    table_service_rate_per_hour: '1200.5',
    table_service_grace_period_minutes: '15',
    table_service_minimum_charge: 200,
    updated_at: 1710000000000
  });

  assert.equal(updated.table_service_charge_enabled, true);
  assert.equal(updated.table_service_rate_per_hour, 1200.5);
  assert.equal(updated.table_service_grace_period_minutes, 15);
  assert.equal(updated.table_service_minimum_charge, 200);

  const listed = await listResources(pricingConfig, { ownerId: 'owner_1' });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].table_service_charge_enabled, true);
});

test('pricing settings read path returns defaults for old records', async () => {
  const store = createPricingStore();
  store.rows.push({
    id: 'pricing_legacy',
    ownerId: 'owner_1',
    tax_rate: 0.05,
    tax_type: 'inclusive',
    updated_at: 1710000000000
  });
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const listed = await listResources(pricingConfig, { ownerId: 'owner_1' });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].table_service_charge_enabled, false);
  assert.equal(listed[0].table_service_rate_per_hour, 0);
  assert.equal(listed[0].table_service_grace_period_minutes, 0);
  assert.equal(listed[0].table_service_minimum_charge, 0);
});

test('pricing settings reject negative values and non-integer grace period', async () => {
  const store = createPricingStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  await assert.rejects(
    () =>
      upsertResource(pricingConfig, 'pricing_1', {
        ownerId: 'owner_1',
        updated_at: 1710000000000,
        table_service_rate_per_hour: -1
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'table_service_rate_per_hour must be greater than or equal to 0');
      return true;
    }
  );

  await assert.rejects(
    () =>
      upsertResource(pricingConfig, 'pricing_1', {
        ownerId: 'owner_1',
        updated_at: 1710000000000,
        table_service_grace_period_minutes: 10.5
      }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, 'table_service_grace_period_minutes must be an integer');
      return true;
    }
  );
});

test('sync push/pull/bootstrap carry pricing settings new fields', async () => {
  const store = createPricingStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const pushResult = await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_1',
        entity: 'pricing_settings',
        entity_id: 'pricing_1',
        type: 'upsert',
        payload: {
          tax_rate: 0.07,
          tax_type: 'inclusive',
          table_service_charge_enabled: '1',
          table_service_rate_per_hour: 1500,
          table_service_grace_period_minutes: 5,
          table_service_minimum_charge: 300,
          updated_at: 1710000000000
        }
      }
    ]
  });

  assert.equal(pushResult.applied.length, 1);
  assert.equal(pushResult.rejected.length, 0);

  store.rows.push({
    id: 'pricing_legacy',
    ownerId: 'owner_1',
    tax_rate: 0.05,
    tax_type: 'inclusive',
    updated_at: 1710000000100
  });

  const pullResult = await syncService.pull({
    ownerId: 'owner_1',
    since: { pricing_settings: 0 },
    include_deleted: true
  });
  assert.equal(pullResult.changes.pricing_settings.length, 2);
  assert.equal(pullResult.changes.pricing_settings[1].table_service_charge_enabled, false);
  assert.equal(pullResult.changes.pricing_settings[1].table_service_rate_per_hour, 0);

  const bootstrapResult = await syncService.bootstrap('owner_1');
  assert.equal(bootstrapResult.changes.pricing_settings.length, 2);
  assert.equal(bootstrapResult.changes.pricing_settings[1].table_service_grace_period_minutes, 0);
  assert.equal(bootstrapResult.changes.pricing_settings[1].table_service_minimum_charge, 0);
});

test('sync push rejects invalid pricing settings table service values', async () => {
  const store = createPricingStore();
  resourceRepository.list = store.list;
  resourceRepository.upsert = store.upsert;
  resourceRepository.update = store.update;
  resourceRepository.remove = store.remove;

  const result = await syncService.push({
    ownerId: 'owner_1',
    entries: [
      {
        id: 'entry_bad',
        entity: 'pricing_settings',
        entity_id: 'pricing_1',
        type: 'upsert',
        payload: {
          tax_rate: 0.1,
          tax_type: 'inclusive',
          table_service_minimum_charge: -2,
          updated_at: 1710000000000
        }
      }
    ]
  });

  assert.equal(result.applied.length, 0);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].reason, 'table_service_minimum_charge must be greater than or equal to 0');
});
