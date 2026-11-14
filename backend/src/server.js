import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Note from './models/Note.js';
import Post from './models/Post.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function seedDemoData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('Seeding demo accounts and data...');

    // 1. Create Demo Standard User
    const user = await User.create({
      name: 'Alice User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
      interests: ['chess', 'reading', 'coding'],
    });

    // 2. Create Demo Admin User
    const admin = await User.create({
      name: 'Admin Boss',
      email: 'admin@example.com',
      password: 'adminpassword123',
      role: 'admin',
      interests: ['system-design', 'chess'],
    });

    // 3. Create Sample Notes for User
    await Note.create([
      {
        title: 'Project Architecture Review',
        content: 'Reviewing ESR indexing rules and single pipeline aggregations for the interview task.',
        user: user._id,
      },
      {
        title: 'Shopping List',
        content: 'Apples, milk, coffee beans, and green tea.',
        user: user._id,
      },
    ]);

    // 4. Create Sample Note for Admin
    await Note.create([
      {
        title: 'Admin Confidential Brief',
        content: 'Quarterly database optimization and serverless latency roadmap.',
        user: admin._id,
      },
    ]);

    // 5. Create Sample Public Posts
    await Post.create([
      {
        title: 'Welcome to Secure Notes!',
        content: 'This application demonstrates MongoDB compound indexing, ESR rule compliance, and $lookup aggregations.',
        author: admin._id,
      },
      {
        title: 'My First Post on Web Development',
        content: 'Exploring how Vercel serverless functions pair with MongoDB connection caching.',
        author: user._id,
      },
    ]);

    console.log('Demo data seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('DEMO CREDENTIALS:');
    console.log('  Standard User -> Email: user@example.com | Pass: password123');
    console.log('  Admin User    -> Email: admin@example.com | Pass: adminpassword123');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.warn('Notice: Demo seeding skipped or encountered issue:', err.message);
  }
}

async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri === 'memory') {
      console.log('No external MONGODB_URI provided in .env.');
      console.log('Starting built-in in-memory MongoDB engine for local preview...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log('In-memory MongoDB started at:', mongoUri);
    }

    await connectDB(mongoUri);
    console.log('MongoDB connection established successfully.');

    // Seed demo accounts if database is empty
    await seedDemoData();

    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`REST API URL: http://localhost:${PORT}/api`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
