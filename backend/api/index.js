import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

/**
 * Serverless function entrypoint for Vercel.
 * Connects to MongoDB with connection caching across lambda warm invocations.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Serverless DB Connection Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed in serverless function.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
