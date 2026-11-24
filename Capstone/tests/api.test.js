const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');

process.env.JWT_ACCESS_SECRET ||= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret';

let server;
let baseUrl;

test.before(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_management');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

test('login succeeds for a seeded administrator', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campus.edu', password: 'Admin@123' })
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.user.role, 'admin');
  assert.ok(body.data.accessToken);
});

test('login rejects missing credentials', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400);
});

test('protected routes reject requests without a token', async () => {
  const response = await fetch(`${baseUrl}/api/users/me`);
  assert.equal(response.status, 401);
});

test('student cannot access administrator user management', async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sneha@campus.edu', password: 'Student@123' })
  });
  const loginBody = await login.json();
  const response = await fetch(`${baseUrl}/api/users`, {
    headers: { Authorization: `Bearer ${loginBody.data.accessToken}` }
  });
  assert.equal(response.status, 403);
});

test('unknown course returns 404', async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campus.edu', password: 'Admin@123' })
  });
  const loginBody = await login.json();
  const response = await fetch(`${baseUrl}/api/courses/507f1f77bcf86cd799439011`, {
    headers: { Authorization: `Bearer ${loginBody.data.accessToken}` }
  });
  assert.equal(response.status, 404);
});
