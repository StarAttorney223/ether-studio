import { Router } from "express";
import {
  createPostController,
  deletePostController,
  getDraftPostsController,
  getPostByIdController,
  getPostsController,
  getScheduledPostsController,
  updatePostController
} from "../controllers/post.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/posts", asyncHandler(createPostController));
router.get("/posts", asyncHandler(getPostsController));
router.get("/posts/drafts", asyncHandler(getDraftPostsController));
router.get("/posts/scheduled", asyncHandler(getScheduledPostsController));
router.get("/posts/:id", asyncHandler(getPostByIdController));
router.put("/posts/:id", asyncHandler(updatePostController));
router.delete("/posts/:id", asyncHandler(deletePostController));

export default router;
