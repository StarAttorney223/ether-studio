import { Router } from "express";
import {
  loginController,
  meController,
  registerController,
  updateProfileController
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/auth/register", asyncHandler(registerController));
router.post("/auth/login", asyncHandler(loginController));
router.get("/auth/me", asyncHandler(requireAuth), asyncHandler(meController));
router.put("/auth/profile", asyncHandler(requireAuth), asyncHandler(updateProfileController));

export default router;
