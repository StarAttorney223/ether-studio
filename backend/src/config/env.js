import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-content-studio",
  authSecret: process.env.AUTH_SECRET || "studio-dev-secret",
  aiProvider: process.env.AI_PROVIDER || "huggingface",
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
  huggingFaceTextModel: process.env.HUGGINGFACE_TEXT_MODEL || "HuggingFaceTB/SmolLM3-3B",
  huggingFaceImageModel: process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-dev",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free",
  cloudinaryName: process.env.CLOUDINARY_NAME || "",
  cloudinaryKey: process.env.CLOUDINARY_KEY || "",
  cloudinarySecret: process.env.CLOUDINARY_SECRET || "",
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID || "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  linkedinRedirectUri: process.env.LINKEDIN_REDIRECT_URI || "http://localhost:5000/api/auth/linkedin/callback",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  gnewsApiKey: process.env.GNEWS_API_KEY || ""
};
