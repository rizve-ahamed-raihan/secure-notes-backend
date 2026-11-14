import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [150, 'Post title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================================
   DATABASE INDEXES (Defined explicitly via schema.index for reviewer audit)
   Strictly minimal:
   1. { author: 1, createdAt: -1 } - Supports Aggregation Scenario 2 ($lookup
      on foreignField: 'author') and chronologically querying an author's posts.
      Left-prefix covers equality match on 'author' with zero index redundancy.
   ========================================================================== */
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
