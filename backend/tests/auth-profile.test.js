/**
 * Basic smoke tests for auth/profile endpoints.
 * Purpose:
 * - CI validation
 * - Regression prevention
 * - Backend health check
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

test('POST /api/auth/login returns 400 when required fields are missing', async () => {
  const res = await request(app).post('/api/auth/login').send({});

  assert.equal(res.status, 400);
  assert.ok(typeof res.body.message === 'string' && res.body.message.length > 0);
});

test('GET /api/profile returns 401 when authorization token is missing', async () => {
  const res = await request(app).get('/api/profile');

  assert.equal(res.status, 401);
});
