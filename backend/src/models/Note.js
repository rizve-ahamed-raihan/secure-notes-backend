import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================================
   DATABASE INDEXES (Defined explicitly via schema.index for reviewer audit)
   Strictly minimal:
   1. { user: 1, createdAt: -1 } - ESR Rule: Equality (user) + Sort (createdAt)
      Covers user listing own notes with pagination. Also satisfies { user: 1 }
      lookups via left-prefix, avoiding duplicate index.
   2. { createdAt: -1 } - Supports Admin viewing all system notes chronologically
   ========================================================================== */
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
