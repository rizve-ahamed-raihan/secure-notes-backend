import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * @desc    Scenario 1: Specific view to see users grouped by interests
 * @route   GET /api/aggregations/users-by-interest
 * @access  Private / Public
 * @constraint EXACTLY ONE collection.aggregate() call. Do not use any other methods.
 * Supported by multikey index: { interests: 1 }
 */
export async function getUsersByInterest(req, res, next) {
  try {
    const groupedUsers = await User.aggregate([
      // Step 1: Deconstruct interests array so each interest is evaluated individually
      { $unwind: '$interests' },

      // Step 2: Group by interest name and accumulate member users
      {
        $group: {
          _id: '$interests',
          totalUsers: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role',
            },
          },
        },
      },

      // Step 3: Sort interests alphabetically
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: groupedUsers.length,
      data: groupedUsers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Scenario 2: Retrieve all posts belonging to a particular user
 * @route   GET /api/aggregations/users/:userId/posts
 * @access  Private / Public
 * @constraint Single aggregation pipeline with a $lookup stage.
 * Supported by index: Post { author: 1, createdAt: -1 } and User { _id: 1 }
 */
export async function getUserPosts(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline with a $lookup stage
    const results = await User.aggregate([
      // Step 1: Filter to target user using indexed _id
      { $match: { _id: targetUserId } },

      // Step 2: Relational join with posts collection on foreignField 'author'
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts',
        },
      },

      // Step 3: Project desired fields (exclude sensitive auth data)
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
    ]);

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const userData = results[0];

    res.status(200).json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        interests: userData.interests,
      },
      postCount: userData.posts.length,
      posts: userData.posts,
    });
  } catch (error) {
    next(error);
  }
}
