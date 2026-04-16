import { Post } from "../models/Post.js";

export async function getAnalyticsSnapshot() {
  const [totalPosts, scheduledPosts] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: "scheduled" })
  ]);

  const metrics = {
    totalPosts,
    scheduledPosts,
    engagementRate: 8.2,
    followers: 42.8
  };

  return {
    metrics,
    topPlatform: "Instagram",
    bestPostingWindow: "Tuesday 6:00 PM - 9:00 PM"
  };
}
