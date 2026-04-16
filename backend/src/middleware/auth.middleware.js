import { findUserById, verifyAuthToken } from "../services/auth.service.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const payload = verifyAuthToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  req.user = user;
  next();
}
