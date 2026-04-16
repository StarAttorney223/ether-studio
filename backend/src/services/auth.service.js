import crypto from "crypto";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenPayload(payload) {
  return crypto.createHmac("sha256", env.authSecret).update(payload).digest("base64url");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = String(storedPassword || "").split(":");
  if (!salt || !storedHash) return false;

  const incomingHash = crypto.scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");

  if (incomingHash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(incomingHash, expectedHash);
}

export function createAuthToken(userId) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS
    })
  );
  const signature = signTokenPayload(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token) {
  const [header, payload, signature] = String(token || "").split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = signTokenPayload(`${header}.${payload}`);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload));
    if (!parsed?.sub || !parsed?.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function createUser(payload) {
  return User.create(payload);
}

export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserById(id) {
  return User.findById(id);
}

export async function updateUserProfile(userId, payload) {
  return User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
}
