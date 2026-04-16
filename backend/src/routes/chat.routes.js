import { Router } from "express";
import {
  deleteAllChatsController,
  deleteChatController,
  getChatByIdController,
  listChatsController,
  saveChatController
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/chat", asyncHandler(requireAuth), asyncHandler(listChatsController));
router.get("/chat/:id", asyncHandler(requireAuth), asyncHandler(getChatByIdController));
router.post("/chat/save", asyncHandler(requireAuth), asyncHandler(saveChatController));
router.delete("/chat/user/:userId", asyncHandler(requireAuth), asyncHandler(deleteAllChatsController));
router.delete("/chat/:id", asyncHandler(requireAuth), asyncHandler(deleteChatController));

export default router;
