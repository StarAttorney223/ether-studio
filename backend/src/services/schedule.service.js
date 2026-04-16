import { ScheduledPost } from "../models/ScheduledPost.js";

export async function createScheduledPost(payload) {
  return ScheduledPost.create(payload);
}

export async function listUpcomingPosts(limit = 50) {
  return ScheduledPost.find({ status: "scheduled" }).sort({ scheduledAt: 1 }).limit(limit).lean();
}

export async function deleteScheduledPostById(id) {
  return ScheduledPost.findByIdAndDelete(id).lean();
}
