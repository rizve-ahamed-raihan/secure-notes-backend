import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';

test('Admin Management & MongoDB Aggregations Suite', async (t) => {
  await setupTestDB();

  t.after(async () => {
    await teardownTestDB();
  });

  t.beforeEach(async () => {
    await clearTestDB();
  });

  await t.test('1. Admin User Management CRUD', async () => {
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@system.io',
      password: 'password123',
      role: 'admin',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@system.io',
      password: 'password123',
    });
    const adminToken = loginRes.body.token;

    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Charlie Employee',
        email: 'charlie@system.io',
        password: 'password123',
        role: 'user',
        interests: ['hiking', 'photography'],
      });
    assert.strictEqual(createRes.status, 201);
    const charlieId = createRes.body.user._id;

    const updateRes = await request(app)
      .put(`/api/admin/users/${charlieId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.user.role, 'admin');

    const listRes = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.users.length, 2);
    assert.strictEqual(listRes.body.pagination.totalCount, 2);

    const deleteRes = await request(app)
      .delete(`/api/admin/users/${charlieId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(deleteRes.status, 200);

    const checkRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(checkRes.body.users.length, 1);
  });

  await t.test('2. Aggregation Scenario 1: Group Users by Interests (Single .aggregate() call)', async () => {
    await User.create([
      {
        name: 'User One',
        email: 'u1@test.com',
        password: 'password123',
        interests: ['chess', 'reading'],
      },
      {
        name: 'User Two',
        email: 'u2@test.com',
        password: 'password123',
        interests: ['reading', 'swimming'],
      },
      {
        name: 'User Three',
        email: 'u3@test.com',
        password: 'password123',
        interests: ['chess'],
      },
    ]);

    const res = await request(app).get('/api/aggregations/users-by-interest');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.count, 3);

    const interestMap = {};
    for (const group of res.body.data) {
      interestMap[group._id] = group.totalUsers;
    }

    assert.strictEqual(interestMap['chess'], 2, 'Chess should have 2 users');
    assert.strictEqual(interestMap['reading'], 2, 'Reading should have 2 users');
    assert.strictEqual(interestMap['swimming'], 1, 'Swimming should have 1 user');
  });

  await t.test('3. Aggregation Scenario 2: User Posts ($lookup Pipeline)', async () => {
    const author = await User.create({
      name: 'Post Author',
      email: 'author@test.com',
      password: 'password123',
      interests: ['writing'],
    });

    await Post.create([
      { title: 'First Post', content: 'Content 1', author: author._id },
      { title: 'Second Post', content: 'Content 2', author: author._id },
      { title: 'Third Post', content: 'Content 3', author: author._id },
    ]);

    const otherAuthor = await User.create({
      name: 'Other Author',
      email: 'other@test.com',
      password: 'password123',
    });
    await Post.create({
      title: "Other's Post",
      content: 'Other content',
      author: otherAuthor._id,
    });

    const res = await request(app).get(`/api/aggregations/users/${author._id}/posts`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user._id, author._id.toString());
    assert.strictEqual(res.body.postCount, 3);
    assert.strictEqual(res.body.posts.length, 3);

    const titles = res.body.posts.map((p) => p.title);
    assert.ok(titles.includes('First Post'));
    assert.ok(titles.includes('Second Post'));
    assert.ok(titles.includes('Third Post'));
    assert.ok(!titles.includes("Other's Post"));
  });
});
