import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import authRoutes from "./auth.routes.js";
import chatRoutes from "./chat.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import postRoutes from "./posts.routes.js";
import imageRoutes from "./images.routes.js";
import linkedinRoutes from "./linkedin.routes.js";
import trendingRoutes from "./trending.routes.js";

const router = Router();

router.use(authRoutes);
router.use(chatRoutes);
router.use(aiRoutes);
router.use(scheduleRoutes);
router.use(analyticsRoutes);
router.use(postRoutes);
router.use(imageRoutes);
router.use(linkedinRoutes);
router.use("/trending", trendingRoutes);

export default router;
