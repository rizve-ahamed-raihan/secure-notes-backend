import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import User from '../src/models/User.js';

test('Authentication and Notes RBAC Integration Suite', async (t) => {
  await setupTestDB();

  t.after(async () => {
    await teardownTestDB();
  });

  t.beforeEach(async () => {
    await clearTestDB();
  });

  let userToken, user2Token, adminToken;
  let user1Id;

  await t.test('1. User Registration & Password Hashing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice User',
        email: 'alice@example.com',
        password: 'password123',
        interests: ['chess', 'reading'],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'user');
    userToken = res.body.token;
    user1Id = res.body.user._id;

    const dbUser = await User.findById(user1Id).select('+password');
    assert.notStrictEqual(dbUser.password, 'password123');
    assert.ok(dbUser.password.startsWith('$2'));
  });

  await t.test('2. Rejects Duplicate Email Registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      });

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Alice',
        email: 'alice@example.com',
        password: 'differentpassword',
      });

    assert.strictEqual(duplicateRes.status, 409);
    assert.strictEqual(duplicateRes.body.success, false);
  });

  await t.test('3. User Login & JWT Issuance', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'mypassword',
      });

    const badRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'wrongpassword',
      });
    assert.strictEqual(badRes.status, 401);

    const validRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'mypassword',
      });

    assert.strictEqual(validRes.status, 200);
    assert.ok(validRes.body.token);
    assert.strictEqual(validRes.body.user.email, 'bob@example.com');
  });

  await t.test('4. Notes CRUD & Strict Role-Based Access Isolation', async () => {
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    userToken = res1.body.token;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    });
    user2Token = res2.body.token;

    const adminUser = await User.create({
      name: 'Admin Boss',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'adminpassword',
    });
    adminToken = adminLoginRes.body.token;

    const noteRes = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: "Alice's Secret Note",
        content: 'This note is confidential.',
      });
    assert.strictEqual(noteRes.status, 201);
    const noteId = noteRes.body.note._id;

    const getAliceNote = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(getAliceNote.status, 200);
    assert.strictEqual(getAliceNote.body.note.title, "Alice's Secret Note");

    const bobAccessRes = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    assert.strictEqual(bobAccessRes.status, 403);

    const bobUpdateRes = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked by Bob' });
    assert.strictEqual(bobUpdateRes.status, 403);

    const bobDeleteRes = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    assert.strictEqual(bobDeleteRes.status, 403);

    const adminGetNote = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminGetNote.status, 200);

    const adminAllNotes = await request(app)
      .get('/api/admin/notes')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminAllNotes.status, 200);
    assert.strictEqual(adminAllNotes.body.notes.length, 1);

    const bobAdminAccess = await request(app)
      .get('/api/admin/notes')
      .set('Authorization', `Bearer ${user2Token}`);
    assert.strictEqual(bobAdminAccess.status, 403);
  });
});
