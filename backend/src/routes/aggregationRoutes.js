import express from 'express';
import {
  getUsersByInterest,
  getUserPosts,
} from '../controllers/aggregationController.js';

const router = express.Router();

// Scenario 1: Group by Interests (exactly one collection.aggregate() call)
router.get('/users-by-interest', getUsersByInterest);

// Scenario 2: Retrieve all posts belonging to a particular user ($lookup pipeline)
router.get('/users/:userId/posts', getUserPosts);

export default router;
