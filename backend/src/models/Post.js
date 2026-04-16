import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    platforms: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0
      }
    },
    mediaUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      required: true
    },
    scheduledTime: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Post = mongoose.model("Post", postSchema);
