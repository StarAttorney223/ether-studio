import { getAnalyticsSnapshot } from "../services/analytics.service.js";

export async function analyticsController(req, res) {
  const snapshot = await getAnalyticsSnapshot();

  return res.status(200).json({
    success: true,
    data: snapshot
  });
}
