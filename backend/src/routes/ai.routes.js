import { Router } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import {
  chatController,
  generateCaptionAiController,
  generateContentController,
  generateImageController,
  uploadImageController,
  getTrendsController
} from "../controllers/ai.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "studio-images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  })
});

const upload = multer({ storage });

router.post("/generate-content", upload.single("image"), asyncHandler(generateContentController));
router.post("/generate-image", asyncHandler(generateImageController));
router.post("/upload-image", upload.single("image"), asyncHandler(uploadImageController));
router.post("/chat", asyncHandler(chatController));
router.post("/ai/generate-caption", asyncHandler(generateCaptionAiController));
router.get("/trends", asyncHandler(getTrendsController));

export default router;
