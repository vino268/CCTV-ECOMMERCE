import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderLookupQuery, resolveOrderLookupValue } from '../lib/order-lookup.js';

test('resolveOrderLookupValue prefers the route id when a Mongo ObjectId is present', () => {
  const value = resolveOrderLookupValue({
    id: '507f1f77bcf86cd799439011',
    body: { orderId: 'ORDER-1001', id: 'fallback-id' },
  });

  assert.equal(value, '507f1f77bcf86cd799439011');
});

test('resolveOrderLookupValue falls back to the body order id when no route id exists', () => {
  const value = resolveOrderLookupValue({
    body: { orderId: 'ORDER-1001' },
  });

  assert.equal(value, 'ORDER-1001');
});

test('buildOrderLookupQuery treats missing isDeleted as active for old orders', () => {
  const query = buildOrderLookupQuery('ORDER-1001');

  assert.deepEqual(query.isDeleted, { $ne: true });
});
