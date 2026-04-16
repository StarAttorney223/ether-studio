import { Router } from "express";
import {
  deleteScheduledPostController,
  getScheduledPostsController,
  schedulePostController
} from "../controllers/schedule.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/schedule-post", asyncHandler(schedulePostController));
router.get("/scheduled-posts", asyncHandler(getScheduledPostsController));
router.delete("/schedule-post/:id", asyncHandler(deleteScheduledPostController));

export default router;
