import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import postRoutes from './routes/postRoutes.js';
import aggregationRoutes from './routes/aggregationRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root API Welcome / Status
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure Notes REST API Service',
    version: '1.0.0',
    documentation: '/api',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      notes: {
        listOrFilter: 'GET /api/notes?page=1&limit=10',
        create: 'POST /api/notes',
        getById: 'GET /api/notes/:id',
        update: 'PUT /api/notes/:id',
        delete: 'DELETE /api/notes/:id',
      },
      posts: {
        listPublic: 'GET /api/posts?page=1&limit=10',
        create: 'POST /api/posts',
      },
      aggregations: {
        scenario1: 'GET /api/aggregations/users-by-interest',
        scenario2: 'GET /api/aggregations/users/:userId/posts',
      },
      admin: {
        users: 'GET /api/admin/users?page=1&limit=10',
        provisionUser: 'POST /api/admin/users',
        updateUser: 'PUT /api/admin/users/:id',
        deleteUser: 'DELETE /api/admin/users/:id',
        allNotes: 'GET /api/admin/notes?page=1&limit=10',
      },
    },
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/aggregations', aggregationRoutes);

// Catch-all 404 for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
