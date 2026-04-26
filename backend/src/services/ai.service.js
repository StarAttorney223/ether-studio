import { env } from "../config/env.js";
import * as trendingService from "./trending.service.js";

const HF_API_URL = "https://router.huggingface.co/hf-inference/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const CONTENT_REQUEST_PATTERN =
  /\b(generate|write|create|draft|caption|post|script|carousel|thread|copy|content|linkedin post|instagram caption|youtube script|youtube description|ad copy|metadata|description)\b/i;
const DETAILED_REQUEST_PATTERN =
  /\b(detailed|detail|longer|in-depth|comprehensive|step by step|full version|deep dive|lengthy|long)\b/i;
const TREND_INTENT_PATTERN =
  /\b(latest news|trending|viral|what should i post|whats hot|latest trends)\b/i;

function wantsDetailedResponse(text = "") {
  return DETAILED_REQUEST_PATTERN.test(String(text));
}

function detectResponseMode(message = "") {
  return CONTENT_REQUEST_PATTERN.test(String(message)) ? "content" : "chat";
}

function detectContentType(topic = "") {
  const norm = String(topic).toLowerCase();
  
  if (norm.includes("youtube") || norm.includes("description") || norm.includes("metadata")) {
    return "youtube_description";
  }

  if (norm.includes("script")) {
    if (norm.includes("reel") || norm.includes("short") || norm.includes("tiktok") || norm.includes("insta")) {
      return "short_video_script";
    }
    return "script";
  }

  if (norm.includes("linkedin") || norm.includes("professional post")) {
    return "linkedin_post";
  }

  if (norm.includes("carousel") || norm.includes("slides")) {
    return "carousel";
  }

  return "caption";
}

function normalizeHashtags(rawHashtags = []) {
  return (rawHashtags || [])
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 5);
}

function isYouTubePlatform(platform = "") {
  return String(platform).toLowerCase().includes("youtube");
}

function extractHashtags(content = "") {
  return normalizeHashtags(content.match(/#[\w-]+/g) || []);
}

function stripHashtags(content = "") {
  return String(content).replace(/#[\w-]+/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function describeUploadedImage(imageContext) {
  if (!imageContext?.url) {
    return "";
  }

  if (!env.openAiApiKey) {
    return `User uploaded an image named "${imageContext.originalName || "reference image"}". Use it as visual context for the response.`;
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.openAiModel || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Describe the uploaded image in 2 short sentences for a social media content assistant. Focus on subject, mood, composition, and any text visible."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for content generation context." },
              { type: "image_url", image_url: { url: imageContext.url } }
            ]
          }
        ],
        max_tokens: 160
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI image analysis failed");
    }

    return data?.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return `User uploaded an image named "${imageContext.originalName || "reference image"}". Incorporate its visible content into the response when possible.`;
  }
}

function buildContentPrompt({ topic, platform, tone, optimize, format, detailed, imageSummary }) {
  const formatRules = {
    youtube_description: `
Write a detailed, discovery-friendly YouTube description (150–300 words).
Structure:
- Hook: High-energy opening sentence.
- Summary: 2 insightful paragraphs about the value provided.
- SEO Keywords: Top 5 keywords integrated naturally.
- Call to Action: Clear instruction for viewers.`,
    
    short_video_script: `
Write a high-retention script for a 60-second video (Reel/Short/TikTok).
Structure:
- Hook (0-3 sec): Pattern interrupt or bold claim.
- Main Body: 3-4 punchy, value-dense bullet points.
- Ending CTA: Fast and clear.`,

    script: `
Write a professional long-form script.
Structure:
- Opening: Set the stage.
- Main Content: In-depth exploration with headings.
- Conclusion: Summary and CTA.`,

    linkedin_post: `
Write a professional, high-authority LinkedIn post.
Structure:
- Strong Opening: 1-2 powerful lines.
- Insightful Body: Use bullet points for readability.
- Reflection: A closing thought on the topic.
- CTA: Encourage comments or shares.`,

    carousel: `
Write content for a 5-10 slide educational carousel.
Structure:
- Slide 1: Catchy Title.
- Slides 2-N: One key insight per slide.
- Final Slide: Summary and CTA.`,

    caption: `
Write a high-converting social media caption.
Structure:
- Hook: Grab attention.
- Body: 2-4 lines of engaging context.
- CTA: Direct the audience.`
  };

  return [
    `ACT AS AN EXPERT COPYWRITER. Create the following: ${format.replace(/_/g, " ")}.`,
    `Platform: ${platform}.`,
    `Primary Topic: ${topic}.`,
    `Target Tone: ${tone}.`,
    optimize ? "Focus on high engagement metrics and visual readability." : "",
    imageSummary ? `Reference Image Context: ${imageSummary}` : "",
    "\nSTRICT FORMATTING RULES:",
    "- Use clean line breaks between every section.",
    "- Output must be professional and scan-friendly.",
    "- No placeholder text like [Insert Name].",
    "- No multiple options.",
    "- Maximize the context provided in the topic.",
    "\nSPECIFIC STRUCTURE REQUIREMENTS:",
    formatRules[format] || formatRules.caption
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChatPrompt({ message, context, detailed }) {
  return [
    context ? `Context: ${context}.` : "",
    `User message: ${message}.`,
    "Respond like a real human conversation. Keep it natural and simple.",
    "Use short paragraphs with clean spacing.",
    "Do not structure the reply like a post.",
    "Do not use hashtags.",
    "Do not give multiple options or label things as Option 1 or Option 2.",
    "Do not overuse formatting symbols, markdown headings, separators like ---, or emojis.",
    detailed
      ? "The user asked for more detail, so you may expand naturally while staying conversational."
      : "Keep responses concise unless the user explicitly asks for detailed output."
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOpenRouterMessages(payload) {
  if (payload.mode === "chat") {
    return [
      {
        role: "system",
        content:
          "You are a warm, natural conversational assistant. Reply like a real person. Keep spacing clean and avoid post-style formatting, hashtags, multiple options, and heavy structure."
      },
      {
        role: "user",
        content: buildChatPrompt(payload)
      }
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are an expert social media copywriter. Produce concise, readable output with clean spacing. Never return multiple options. Avoid heavy markdown, large text blocks, and unnecessary symbols."
    },
    {
      role: "user",
      content: buildContentPrompt(payload)
    }
  ];
}

function buildHuggingFacePrompt(payload) {
  if (payload.mode === "chat") {
    return buildChatPrompt(payload);
  }

  return buildContentPrompt(payload);
}

async function generateWithHuggingFace(payload) {
  if (!env.huggingFaceApiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY in backend environment.");
  }

  const prompt = buildHuggingFacePrompt(payload);
  const candidateModels = [
    env.huggingFaceTextModel,
    "HuggingFaceTB/SmolLM3-3B",
    "Qwen/Qwen2.5-7B-Instruct"
  ].filter(Boolean);

  let lastError = "Hugging Face text generation failed";

  for (const model of candidateModels) {
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.huggingFaceApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 800, temperature: payload.mode === "chat" ? 0.8 : 0.7, return_full_text: false }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text.trim();
      }

      return data.generated_text?.trim() || "Unable to generate content right now.";
    }

    lastError = data?.error || lastError;
  }

  throw new Error(lastError);
}

async function generateWithOpenRouter(payload) {
  if (!env.openRouterApiKey || env.openRouterApiKey === "or_xxx") {
    throw new Error("Missing OPENROUTER_API_KEY in backend environment.");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openRouterModel,
      temperature: payload.mode === "chat" ? 0.85 : 0.7,
      max_tokens: 1000,
      messages: buildOpenRouterMessages(payload)
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenRouter generation failed");
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Unable to generate content right now.";
}

async function generateText(payload) {
  if (env.aiProvider === "openrouter") {
    return generateWithOpenRouter(payload);
  }

  try {
    return await generateWithHuggingFace(payload);
  } catch (error) {
    const isDeprecated = String(error.message).toLowerCase().includes("deprecated");

    if (isDeprecated && env.openRouterApiKey && env.openRouterApiKey !== "or_xxx") {
      return generateWithOpenRouter(payload);
    }

    throw error;
  }
}

export async function generateCaption({ topic, platform, tone, optimize, imageContext = null }) {
  const format = detectContentType(topic);
  const imageSummary = await describeUploadedImage(imageContext);

  return generateText({
    mode: "content",
    topic,
    platform,
    tone,
    optimize: Boolean(optimize),
    format,
    detailed: wantsDetailedResponse(topic),
    imageSummary
  });
}

export async function chatWithAssistant({ message, context }) {
  const normMessage = String(message).toLowerCase();
  
  // Detect real-time trend intent
  if (TREND_INTENT_PATTERN.test(normMessage) || /\b(latest|news|viral|trending|hot|post|ideas|tools|startup)\b/i.test(normMessage)) {
    try {
      const liveData = await trendingService.getTrendsByTopic(message);
      if (liveData && liveData.length > 0) {
        let responseText = `I've scouted the latest real-time topics for you. Here is what's RESONATING right now:\n\n`;
        liveData.slice(0, 10).forEach((topic, idx) => {
          responseText += `${idx + 1}. ${topic}\n`;
        });
        responseText += "\nClick any of these to manifest content, or tell me if you want to explore a different angle!";
        return responseText;
      }
    } catch (err) {
      console.error("Chat trending fetch failed:", err);
    }
  }

  const mode = detectResponseMode(message);

  if (mode === "content") {
    return generateText({
      mode: "content",
      topic: message,
      platform: context || "Instagram / LinkedIn",
      tone: "Helpful and clear",
      optimize: true,
      format: detectContentType(message),
      detailed: wantsDetailedResponse(message),
      imageSummary: ""
    });
  }

  return generateText({
    mode: "chat",
    message,
    context,
    detailed: wantsDetailedResponse(message)
  });
}

function parseCaptionPayload(content) {
  try {
    const normalized = content.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(normalized);
    return {
      caption: stripHashtags(String(parsed.caption || "").trim()),
      hashtags: normalizeHashtags(parsed.hashtags)
    };
  } catch {
    return {
      caption: stripHashtags(content),
      hashtags: extractHashtags(content)
    };
  }
}

function parseYouTubePayload(content) {
  try {
    const normalized = content.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(normalized);
    return {
      title: String(parsed.title || "").trim(),
      description: String(parsed.description || "").trim(),
      hashtags: normalizeHashtags(parsed.hashtags)
    };
  } catch {
    const lines = String(content)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const title =
      lines[0]?.replace(/^title:\s*/i, "").trim() ||
      "YouTube Video Title";
    const description = lines
      .slice(1)
      .join("\n")
      .replace(/^description:\s*/i, "")
      .trim();

    return {
      title,
      description: stripHashtags(description || content),
      hashtags: extractHashtags(content)
    };
  }
}

export async function generateOpenRouterCaption({ topic, platform, tone }) {
  if (!env.openRouterApiKey || env.openRouterApiKey === "or_xxx") {
    throw new Error("Missing OPENROUTER_API_KEY in backend environment.");
  }

  const format = detectContentType(topic);
  const youtubeMode = isYouTubePlatform(platform);
  const prompt = [
    youtubeMode
      ? `Generate YouTube metadata for this topic: ${topic}.`
      : `Create ${format} content for ${platform}.`,
    youtubeMode ? `Target tone: ${tone}.` : `Topic: ${topic}.`,
    youtubeMode ? "Return an engaging YouTube title and a discovery-friendly description." : `Tone: ${tone}.`,
    "Keep it concise, readable, and clean.",
    "Use short lines and natural spacing.",
    "Do not generate multiple options.",
    "Avoid large text blocks, separators like ---, and unnecessary hashtags.",
    youtubeMode
      ? "Title should be clickable but not spammy. Description should be 2 to 4 short paragraphs. Add up to 5 relevant tags only if useful. Do not use Hook/Action labels."
      : format === "caption"
        ? "For captions, write 2 to 4 short lines and include 3 to 5 relevant hashtags only if needed."
        : format === "script"
          ? "For scripts, use Hook, Main Content, and Call to Action."
          : format === "description"
            ? "For descriptions, write 2 to 3 engaging paragraphs without labels like Hook or CTA."
            : "For carousels, use Slide 1, Slide 2, and continue only when needed.",
    youtubeMode
      ? 'Return strict JSON only in this format: {"title":"...","description":"...","hashtags":["#tag1","#tag2"]}'
      : 'Return strict JSON only in this format: {"caption":"...","hashtags":["#tag1","#tag2"]}'
  ].join(" ");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openRouterModel || "mistralai/mistral-7b-instruct",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a social media copywriter. Return concise engaging output as valid JSON. Keep formatting minimal and readable."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = data?.error?.message || "OpenRouter caption generation failed";
    throw new Error(apiMessage);
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned an empty caption response.");
  }

  if (youtubeMode) {
    const parsed = parseYouTubePayload(content);

    return {
      title: parsed.title || `YouTube video about ${topic}`,
      description: parsed.description || `A YouTube description about ${topic}.`,
      hashtags: parsed.hashtags,
      caption: parsed.description || `A YouTube description about ${topic}.`
    };
  }

  const parsed = parseCaptionPayload(content);

  return {
    caption: parsed.caption || `Sharing thoughts about ${topic} on ${platform}.`,
    hashtags: parsed.hashtags
  };
}

export async function getLatestTrends(topic = "") {
  const currentYear = new Date().getFullYear();
  const prompt = topic
    ? `Identify 5 VIRAL TRENDS related to "${topic}" for ${currentYear}. 
       STRICT RULES:
       1. Response MUST be valid JSON only: {"topics": ["Short Trend 1", "Short Trend 2", ...], "hashtags": ["#tag1", ...]}
       2. Each topic MUST be 2-3 WORDS MAX. e.g., "2026 Tech Trends", "Minimalist AI Art".
       3. NO SENTENCES. NO GREETINGS.`
    : `Identify 5 GLOBAL VIRAL TRENDS for ${currentYear}.
       STRICT RULES:
       1. Response MUST be valid JSON only: {"topics": ["Short Trend 1", "Short Trend 2", ...], "hashtags": ["#tag1", ...]}
       2. Each topic MUST be 2-3 WORDS MAX. e.g., "Viral Fashion Challenges", "AI Music Trends".
       3. NO SENTENCES. NO GREETINGS.`;

  const payload = {
    mode: "chat",
    message: prompt,
    detailed: false
  };

  const response = await generateText(payload);
  
  try {
    const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response;
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      topics: (parsed.topics || []).map(t => String(t).slice(0, 35)).slice(0, 5),
      hashtags: (parsed.hashtags || []).map(t => t.startsWith("#") ? t : `#${t}`).slice(0, 10)
    };
  } catch (e) {
    const allHashtags = Array.from(new Set(extractHashtags(response))).slice(0, 10);
    const topics = response.split("\n")
      .map(line => line.trim().replace(/^[-*•\d.]+\s*/, ""))
      .filter(line => line.length > 3 && line.length < 35 && !line.includes("#") && line.split(" ").length < 5)
      .slice(0, 5);

    return { 
      topics: topics.length > 0 ? topics : [`${currentYear} Tech Trends`, "Viral AI News", "Short Video Hacks", "Sustainable Living", "Digital Wellness"],
      hashtags: allHashtags.length > 0 ? allHashtags : ["#trending", "#viral", "#socialmedia", "#contentcreator", "#ai", "#growth", "#innovation", "#community", "#strategy", "#future"]
    };
  }
}
