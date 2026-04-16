import mongoose from "mongoose";

const scheduledPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    platform: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, default: "scheduled" }
  },
  { timestamps: true }
);

export const ScheduledPost = mongoose.model("ScheduledPost", scheduledPostSchema);
