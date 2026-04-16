import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    platforms: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0
      }
    },
    mediaUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
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
