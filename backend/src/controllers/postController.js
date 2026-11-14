import Post from '../models/Post.js';

function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function createPost(req, res, next) {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both post title and content.',
      });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPosts(req, res, next) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [posts, totalCount] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
      Post.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      posts,
    });
  } catch (error) {
    next(error);
  }
}
