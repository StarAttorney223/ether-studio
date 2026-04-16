import { Router } from "express";
import {
  chatController,
  generateCaptionAiController,
  generateContentController,
  generateImageController
} from "../controllers/ai.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/generate-content", asyncHandler(generateContentController));
router.post("/generate-image", asyncHandler(generateImageController));
router.post("/chat", asyncHandler(chatController));
router.post("/ai/generate-caption", asyncHandler(generateCaptionAiController));

export default router;
