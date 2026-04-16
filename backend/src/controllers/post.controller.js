import {
  createPostRecord,
  deletePostById,
  listDraftPosts,
  getPostById,
  listPosts,
  listScheduledPosts,
  updatePostById
} from "../services/post.service.js";

function toPostResponse(post) {
  return {
    id: post._id,
    content: post.content,
    platforms: post.platforms,
    mediaUrl: post.mediaUrl || "",
    status: post.status,
    scheduledTime: post.scheduledTime,
    createdAt: post.createdAt
  };
}

export async function createPostController(req, res) {
  const { content, platforms, mediaUrl = "", status, scheduledTime = null } = req.body;

  if (!content?.trim() || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({
      success: false,
      message: "content and at least one platform are required"
    });
  }

  if (!["draft", "scheduled", "published"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status must be one of draft, scheduled, published"
    });
  }

  if (status === "scheduled" && !scheduledTime) {
    return res.status(400).json({
      success: false,
      message: "scheduledTime is required for scheduled posts"
    });
  }

  const post = await createPostRecord({
    content: content.trim(),
    platforms,
    mediaUrl,
    status,
    scheduledTime: status === "scheduled" ? scheduledTime : null
  });

  return res.status(201).json({ success: true, data: toPostResponse(post) });
}

export async function getPostsController(req, res) {
  const posts = await listPosts(400);
  return res.status(200).json({
    success: true,
    data: posts.map(toPostResponse)
  });
}

export async function getScheduledPostsController(req, res) {
  const posts = await listScheduledPosts(400);
  return res.status(200).json({
    success: true,
    data: posts.map(toPostResponse)
  });
}

export async function getDraftPostsController(req, res) {
  const posts = await listDraftPosts(400);
  return res.status(200).json({
    success: true,
    data: posts.map(toPostResponse)
  });
}

export async function deletePostController(req, res) {
  const { id } = req.params;
  const deleted = await deletePostById(id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  return res.status(200).json({ success: true, message: "Post deleted" });
}

export async function getPostByIdController(req, res) {
  const { id } = req.params;
  const post = await getPostById(id);

  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  return res.status(200).json({ success: true, data: toPostResponse(post) });
}

export async function updatePostController(req, res) {
  const { id } = req.params;
  const { content, platforms, mediaUrl = "", status, scheduledTime = null } = req.body;

  if (!content?.trim() || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({
      success: false,
      message: "content and at least one platform are required"
    });
  }

  if (!["draft", "scheduled", "published"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status must be one of draft, scheduled, published"
    });
  }

  if (status === "scheduled" && !scheduledTime) {
    return res.status(400).json({
      success: false,
      message: "scheduledTime is required for scheduled posts"
    });
  }

  const updated = await updatePostById(id, {
    content: content.trim(),
    platforms,
    mediaUrl,
    status,
    scheduledTime: status === "scheduled" ? scheduledTime : null
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  return res.status(200).json({ success: true, data: toPostResponse(updated) });
}
