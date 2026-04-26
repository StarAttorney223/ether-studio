import crypto from "crypto";
import { env } from "../config/env.js";
import {
  getDecryptedSocialAccount,
  getSocialAccount,
  updateLinkedInMemberId,
  upsertSocialAccount
} from "../services/social-account.service.js";
import { getProfile, createPost } from "../services/linkedin.service.js";

const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"];
const DEFAULT_FRONTEND_URL = "http://localhost:5173";
// const DEFAULT_FRONTEND_URL = env.frontendUrl;
const DEFAULT_REDIRECT_PATH = "/create-post";

async function parseLinkedInResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function requireLinkedInConfig() {
  if (!env.linkedinClientId || !env.linkedinClientSecret || !env.linkedinRedirectUri) {
    const error = new Error("LinkedIn OAuth is not configured on the server");
    error.statusCode = 500;
    throw error;
  }
}

function signLinkedInState(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", env.authSecret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyLinkedInState(state) {
  const [encodedPayload, signature] = String(state || "").split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto.createHmac("sha256", env.authSecret).update(encodedPayload).digest("base64url");
  if (expectedSignature !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getFrontendRedirectUrl(origin, path = DEFAULT_REDIRECT_PATH, params = {}) {
  const safeOrigin = origin || env.frontendUrl || DEFAULT_FRONTEND_URL;
  const redirectUrl = new URL(path || DEFAULT_REDIRECT_PATH, safeOrigin);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      redirectUrl.searchParams.set(key, value);
    }
  });

  return redirectUrl.toString();
}



export async function getLinkedInAuthUrlController(req, res) {
  requireLinkedInConfig();

  const frontendOrigin = req.headers.origin || env.frontendUrl || DEFAULT_FRONTEND_URL;
  const redirectPath = typeof req.query.redirectPath === "string" ? req.query.redirectPath : DEFAULT_REDIRECT_PATH;
  const state = signLinkedInState({
    userId: String(req.user._id),
    frontendOrigin,
    redirectPath,
    issuedAt: Date.now()
  });

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.linkedinClientId);
  authUrl.searchParams.set("redirect_uri", env.linkedinRedirectUri);
  authUrl.searchParams.set("scope", LINKEDIN_SCOPES.join(" "));
  authUrl.searchParams.set("state", state);

  return res.status(200).json({
    success: true,
    data: {
      authUrl: authUrl.toString()
    }
  });
}

export async function linkedinCallbackController(req, res) {
  requireLinkedInConfig();

  const { code, state, error: oauthError, error_description: errorDescription } = req.query;
  const statePayload = verifyLinkedInState(state);

  if (!statePayload?.userId) {
    return res.redirect(
      getFrontendRedirectUrl(undefined, DEFAULT_REDIRECT_PATH, {
        linkedin: "error",
        message: "Invalid LinkedIn authorization state"
      })
    );
  }

  if (oauthError) {
    return res.redirect(
      getFrontendRedirectUrl(statePayload.frontendOrigin, statePayload.redirectPath, {
        linkedin: "error",
        message: errorDescription || oauthError
      })
    );
  }

  if (!code) {
    return res.redirect(
      getFrontendRedirectUrl(statePayload.frontendOrigin, statePayload.redirectPath, {
        linkedin: "error",
        message: "Missing LinkedIn authorization code"
      })
    );
  }

  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: env.linkedinRedirectUri,
        client_id: env.linkedinClientId,
        client_secret: env.linkedinClientSecret
      })
    });

    const tokenData = await parseLinkedInResponse(tokenResponse);
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.message || "Failed to exchange LinkedIn authorization code");
    }

    await upsertSocialAccount({
      userId: statePayload.userId,
      platform: "linkedin",
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 0
    });

    return res.redirect(
      getFrontendRedirectUrl(statePayload.frontendOrigin, statePayload.redirectPath, {
        linkedin: "connected"
      })
    );
  } catch (error) {
    return res.redirect(
      getFrontendRedirectUrl(statePayload.frontendOrigin, statePayload.redirectPath, {
        linkedin: "error",
        message: error.message || "LinkedIn connection failed"
      })
    );
  }
}

export async function getLinkedInStatusController(req, res) {
  const account = await getSocialAccount(req.user._id, "linkedin");

  return res.status(200).json({
    success: true,
    data: {
      connected: Boolean(account),
      createdAt: account?.createdAt || null,
      expiresAt: account?.tokenExpiresAt || null
    }
  });
}

export async function publishLinkedInPostController(req, res) {
  const { content, mediaUrl } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: "content is required" });
  }

  const socialAccount = await getDecryptedSocialAccount(req.user._id, "linkedin");
  if (!socialAccount?.accessToken) {
    return res.status(400).json({ success: false, message: "Connect your LinkedIn account first" });
  }

  try {
    const profile = await getProfile(socialAccount.accessToken);
    const author = `urn:li:person:${profile.sub}`;

    if (profile.sub && socialAccount.account.linkedinMemberId !== profile.sub) {
      await updateLinkedInMemberId(req.user._id, profile.sub);
    }

    const result = await createPost(socialAccount.accessToken, content, author, mediaUrl);

    return res.status(200).json({
      success: true,
      data: {
        author,
        linkedInPostId: result.id
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 502;
    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 401
          ? "LinkedIn session expired. Please reconnect your account."
          : error.message || "Unable to publish to LinkedIn"
    });
  }
}
