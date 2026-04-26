import * as trendingService from "../services/trending.service.js";

export const getRedditTrends = async (req, res) => {
  try {
    const raw = await trendingService.getRedditTrends();
    const data = raw.map(item => typeof item === 'string' ? item : item.title);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGNewsTrends = async (req, res) => {
  try {
    const raw = await trendingService.getGNewsTrends();
    const data = raw.map(item => typeof item === 'string' ? item : item.title);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCombinedTrends = async (req, res) => {
  try {
    const data = await trendingService.getCombinedTrends();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDynamicTrends = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }
    const data = await trendingService.getTrendingByIntent(prompt);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendsByTopic = async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) {
      return res.status(400).json({ success: false, message: "Topic is required" });
    }
    const data = await trendingService.getTrendsByTopic(topic);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
