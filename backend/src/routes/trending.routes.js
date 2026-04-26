import express from "express";
import * as trendingController from "../controllers/trending.controller.js";

const router = express.Router();

router.get("/reddit", trendingController.getRedditTrends);
router.get("/news", trendingController.getGNewsTrends);
router.get("/all", trendingController.getCombinedTrends);
router.get("/dynamic", trendingController.getDynamicTrends);
router.get("/by-topic", trendingController.getTrendsByTopic);

export default router;
