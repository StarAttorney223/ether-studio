import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import authRoutes from "./auth.routes.js";
import chatRoutes from "./chat.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import postRoutes from "./posts.routes.js";

const router = Router();

router.use(authRoutes);
router.use(chatRoutes);
router.use(aiRoutes);
router.use(scheduleRoutes);
router.use(analyticsRoutes);
router.use(postRoutes);

export default router;
