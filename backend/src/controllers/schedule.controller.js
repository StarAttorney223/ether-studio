import {
  createScheduledPost,
  deleteScheduledPostById,
  listUpcomingPosts
} from "../services/schedule.service.js";

export async function schedulePostController(req, res) {
  const { title, platform, scheduledAt } = req.body;

  if (!title || !platform || !scheduledAt) {
    return res.status(400).json({ success: false, message: "title, platform, and scheduledAt are required" });
  }

  const post = await createScheduledPost({ title, platform, scheduledAt });

  return res.status(201).json({
    success: true,
    data: {
      id: post._id,
      title: post.title,
      platform: post.platform,
      scheduledAt: post.scheduledAt,
      status: post.status
    }
  });
}

export async function getScheduledPostsController(req, res) {
  const posts = await listUpcomingPosts(200);

  return res.status(200).json({
    success: true,
    data: posts.map((post) => ({
      id: post._id,
      title: post.title,
      platform: post.platform,
      scheduledAt: post.scheduledAt,
      status: post.status
    }))
  });
}

export async function deleteScheduledPostController(req, res) {
  const { id } = req.params;

  const deleted = await deleteScheduledPostById(id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: "Scheduled post not found" });
  }

  return res.status(200).json({ success: true, message: "Scheduled post deleted" });
}
