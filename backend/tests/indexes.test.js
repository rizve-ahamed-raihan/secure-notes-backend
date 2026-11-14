import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/User.js';
import Note from '../src/models/Note.js';
import Post from '../src/models/Post.js';

test('Database Indexing Strategy Verification', async (t) => {
  await t.test('User Schema has exactly the required indexes and no redundant ones', () => {
    const indexes = User.schema.indexes();
    const indexKeys = indexes.map(([spec]) => JSON.stringify(spec));

    assert.ok(
      indexKeys.includes(JSON.stringify({ email: 1 })),
      'User schema must define { email: 1 } index'
    );

    assert.ok(
      indexKeys.includes(JSON.stringify({ interests: 1 })),
      'User schema must define { interests: 1 } index for Scenario 1'
    );

    assert.ok(
      indexKeys.includes(JSON.stringify({ createdAt: -1 })),
      'User schema must define { createdAt: -1 } index for admin pagination'
    );

    assert.strictEqual(
      indexes.length,
      3,
      `User schema has ${indexes.length} custom indexes; expected exactly 3 minimal indexes.`
    );
  });

  await t.test('Note Schema has ESR compound index and admin chronological index with zero redundancy', () => {
    const indexes = Note.schema.indexes();
    const indexKeys = indexes.map(([spec]) => JSON.stringify(spec));

    assert.ok(
      indexKeys.includes(JSON.stringify({ user: 1, createdAt: -1 })),
      'Note schema must define compound index { user: 1, createdAt: -1 }'
    );

    assert.ok(
      indexKeys.includes(JSON.stringify({ createdAt: -1 })),
      'Note schema must define { createdAt: -1 } index for admin all-notes listing'
    );

    assert.ok(
      !indexKeys.includes(JSON.stringify({ user: 1 })),
      'Note schema MUST NOT define redundant standalone { user: 1 } index (covered by compound prefix)'
    );

    assert.strictEqual(
      indexes.length,
      2,
      `Note schema has ${indexes.length} custom indexes; expected exactly 2 minimal indexes.`
    );
  });

  await t.test('Post Schema has { author: 1, createdAt: -1 } index and no redundant { author: 1 }', () => {
    const indexes = Post.schema.indexes();
    const indexKeys = indexes.map(([spec]) => JSON.stringify(spec));

    assert.ok(
      indexKeys.includes(JSON.stringify({ author: 1, createdAt: -1 })),
      'Post schema must define compound index { author: 1, createdAt: -1 } for Scenario 2 $lookup'
    );

    assert.ok(
      !indexKeys.includes(JSON.stringify({ author: 1 })),
      'Post schema MUST NOT define redundant standalone { author: 1 } index'
    );

    assert.strictEqual(
      indexes.length,
      1,
      `Post schema has ${indexes.length} custom indexes; expected exactly 1 minimal index.`
    );
  });
});
