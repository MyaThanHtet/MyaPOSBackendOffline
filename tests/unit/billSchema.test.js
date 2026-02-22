const test = require('node:test');
const assert = require('node:assert/strict');

process.env.PORT = process.env.PORT || '3001';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapos_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { Bill } = require('../../src/models');

test('bill schema includes table service charge fields', () => {
  assert.ok(Bill.schema.path('table_service_charge'));
  assert.ok(Bill.schema.path('table_usage_duration'));
  assert.equal(Bill.schema.path('table_service_charge').instance, 'Number');
  assert.equal(Bill.schema.path('table_usage_duration').instance, 'String');
});
