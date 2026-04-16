import { Post } from "../models/Post.js";

export async function createPostRecord(payload) {
  return Post.create(payload);
}

export async function listPosts(limit = 200) {
  return Post.find().sort({ createdAt: -1 }).limit(limit).lean();
}

export async function listDraftPosts(limit = 200) {
  return Post.find({ status: "draft" }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function listScheduledPosts(limit = 200) {
  return Post.find({ status: "scheduled", scheduledTime: { $ne: null } })
    .sort({ scheduledTime: 1 })
    .limit(limit)
    .lean();
}

export async function deletePostById(id) {
  return Post.findByIdAndDelete(id).lean();
}

export async function getPostById(id) {
  return Post.findById(id).lean();
}

export async function updatePostById(id, payload) {
  return Post.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
}
