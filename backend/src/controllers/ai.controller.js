import { GeneratedContent } from "../models/GeneratedContent.js";
import { generateCaption, chatWithAssistant, generateOpenRouterCaption } from "../services/ai.service.js";
import { generateImageFromPrompt } from "../services/image.service.js";

export async function generateContentController(req, res) {
  const { topic, platform, tone, optimize } = req.body;

  if (!topic || !platform || !tone) {
    return res.status(400).json({ success: false, message: "topic, platform and tone are required" });
  }

  const caption = await generateCaption({ topic, platform, tone, optimize: Boolean(optimize) });

  const saved = await GeneratedContent.create({ topic, platform, tone, caption });

  return res.status(200).json({
    success: true,
    data: {
      id: saved._id,
      caption,
      hashtags: ["#AIContent", "#SocialMedia", "#Growth"]
    }
  });
}

export async function generateImageController(req, res) {
  const { prompt, aspectRatio = "16:9", style = "Photorealistic", lighting = "Golden Hour" } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: "prompt is required" });
  }

  const imageUrl = await generateImageFromPrompt({ prompt, aspectRatio, style, lighting });

  return res.status(200).json({
    success: true,
    data: {
      imageUrl,
      prompt
    }
  });
}

export async function chatController(req, res) {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "message is required" });
  }

  const reply = await chatWithAssistant({ message, context });

  return res.status(200).json({
    success: true,
    data: {
      reply
    }
  });
}

export async function generateCaptionAiController(req, res) {
  const { topic, platform, tone } = req.body;

  if (!topic || !platform || !tone) {
    return res.status(400).json({ success: false, message: "topic, platform and tone are required" });
  }

  const result = await generateOpenRouterCaption({ topic, platform, tone });

  return res.status(200).json({
    success: true,
    data: {
      caption: result.caption,
      hashtags: result.hashtags
    }
  });
}
