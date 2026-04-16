import { GeneratedContent } from "../models/GeneratedContent.js";
import { generateCaption, chatWithAssistant, generateOpenRouterCaption } from "../services/ai.service.js";
import { generateImageFromPrompt } from "../services/image.service.js";
import { createGeneratedImageAtTop } from "../services/generated-image.service.js";

export async function generateContentController(req, res) {
  const { topic, platform, tone, optimize } = req.body;
  const uploadedImage = req.file
    ? {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        path: req.file.path,
        url: req.file.path,
        publicId: req.file.filename
      }
    : null;

  if (!topic || !platform || !tone) {
    return res.status(400).json({ success: false, message: "topic, platform and tone are required" });
  }

  const caption = await generateCaption({
    topic,
    platform,
    tone,
    optimize: Boolean(optimize),
    imageContext: uploadedImage
  });

  const saved = await GeneratedContent.create({ topic, platform, tone, caption });

  return res.status(200).json({
    success: true,
    data: {
      id: saved._id,
      caption,
      hashtags: (caption.match(/#[\w-]+/g) || []).slice(0, 5),
      imageContext: uploadedImage?.url || ""
    }
  });
}

export async function generateImageController(req, res) {
  const {
    prompt,
    aspectRatio = "16:9",
    style = "Photorealistic",
    lighting = "Golden Hour",
    mode = "image",
    type = "image",
    textOverlay = ""
  } = req.body;
  const isThumbnail = type === "thumbnail" || mode === "thumbnail";
  const resolvedAspectRatio = isThumbnail ? "16:9" : aspectRatio || "1:1";
  const resolvedType = isThumbnail ? "thumbnail" : "image";

  if (!prompt) {
    return res.status(400).json({ success: false, message: "prompt is required" });
  }

  const imageUrl = await generateImageFromPrompt({
    prompt,
    aspectRatio: resolvedAspectRatio,
    style,
    lighting,
    mode,
    type: resolvedType,
    textOverlay
  });

  const savedImage = await createGeneratedImageAtTop({
    imageUrl: imageUrl.url,
    imagePublicId: imageUrl.publicId,
    prompt,
    aspectRatio: resolvedAspectRatio,
    type: resolvedType,
    textOverlay
  });

  return res.status(200).json({
    success: true,
    data: {
      id: savedImage._id,
      imageUrl: savedImage.imageUrl,
      prompt,
      aspectRatio: resolvedAspectRatio,
      mode: resolvedType,
      textOverlay,
      type: savedImage.type,
      createdAt: savedImage.createdAt,
      isFavorite: savedImage.isFavorite,
      order: savedImage.order
    }
  });
}

export async function uploadImageController(req, res) {
  if (!req.file?.path) {
    return res.status(400).json({ success: false, message: "image is required" });
  }

  return res.status(200).json({
    success: true,
    data: {
      url: req.file.path,
      publicId: req.file.filename
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
      title: result.title || "",
      description: result.description || "",
      caption: result.caption,
      hashtags: result.hashtags
    }
  });
}
