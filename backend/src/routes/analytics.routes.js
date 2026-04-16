import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/analytics", asyncHandler(analyticsController));

export default router;
