import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import * as trendingService from "./trending.service.js";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

const HF_API_URL = "https://router.huggingface.co/hf-inference/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function generateWithGemini({ topic, platform, tone, format, imageContext = null }) {
  if (!genAI) throw new Error("Gemini API key is missing.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
User request topic: ${topic}
Target Platform: ${platform}
Desired Tone: ${tone}

Instructions for multimodal generation:
- If the user asks to identify something, identify the objects, people, or text in the image.
- If it's a caption, generate a high-engagement caption based on the image's context.
- If it's a script, generate a structured video script (Hook, Body, CTA) based on the visuals.
- If it's for YouTube, provide a long-form description with naturally integrated SEO keywords.
- Always be visually accurate to what is depicted in the image.

Output structure:
- Produce clean, structured text.
- Use natural spacing and line breaks.
`;

  const parts = [{ text: prompt }];

  if (imageContext && imageContext.path) {
    try {
      const imageBuffer = fs.readFileSync(imageContext.path);
      parts.push({
        inlineData: {
          mimeType: imageContext.mimeType || "image/jpeg",
          data: imageBuffer.toString("base64")
        }
      });
    } catch (err) {
      console.error("Gemini image conversion failed:", err);
    }
  }

  const result = await model.generateContent(parts);
  const response = await result.response;
  return response.text().trim();
}

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
    youtube_description: `Structure needed:
1. Hook: Catchy opening.
2. Summary: Clear details about the topic.
3. Tags/Keywords.
4. Call to Action.`,
    short_video_script: `Structure needed:
1. Hook (0-3s).
2. Main Body (2-3 punchy points).
3. Ending CTA.`,
    script: `Structure needed:
1. Hook.
2. Main content.
3. Conclusion.`,
    linkedin_post: `Structure needed:
1. Powerful hook.
2. Bulleted value points.
3. Closing thought.`,
    carousel: `Structure needed:
1. Slide 1 (Title)
2. Slides 2-4 (Value)
3. Final Slide (CTA)`,
    caption: `Structure needed:
1. Hook line.
2. Short, engaging body.
3. Call to Action.`
  };

  return `You are a social media expert. Your task is to write content strictly about the User's Topic.
DO NOT use generic marketing boilerplate. Stick directly to the subject matter requested.

Topic: ${topic}
Platform: ${platform}
Tone: ${tone}
Content Type: ${format.replace(/_/g, " ")}

${imageSummary ? `Extra Visual Context: ${imageSummary}\n` : ""}
Rules:
- Write exactly what was requested.
- Keep it clean; no markdown choices or internal thoughts.
- Make it highly relevant to "${topic}".

${formatRules[format] || formatRules.caption}`;
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
    const historyMsgs = Array.isArray(payload.history) ? payload.history.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: String(msg.content)
    })) : [];

    return [
      {
        role: "system",
        content: "You are a helpful, conversational social media assistant. Keep answers natural and concise."
      },
      ...historyMsgs,
      {
        role: "user",
        content: buildChatPrompt(payload)
      }
    ];
  }

  return [
    {
      role: "system",
      content: "You are an expert copywriter. Output strictly the requested social media content without acknowledging instructions or offering generic business advice."
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

  const messages = buildOpenRouterMessages(payload);
  const candidateModels = [
    env.huggingFaceTextModel,
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct"
  ].filter(Boolean);

  let lastError = "Hugging Face text generation failed";
  const hfEndpoints = [
    "https://api-inference.huggingface.co/v1/chat/completions",
    "https://router.huggingface.co/hf-inference/models"
  ];

  for (const model of candidateModels) {
    for (const baseUrl of hfEndpoints) {
      const isRouter = baseUrl.includes("router.huggingface.co");
      const url = isRouter ? `${baseUrl}/${model}/v1/chat/completions` : baseUrl;
      const requestBody = isRouter 
        ? { model, messages, max_tokens: 800, temperature: payload.mode === "chat" ? 0.8 : 0.7 }
        : { model, messages, temperature: payload.mode === "chat" ? 0.8 : 0.7, max_tokens: 800 };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.huggingFaceApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`Success with HF model: ${model} via ${isRouter ? 'Router' : 'Inference API'}`);
          if (data.choices && data.choices[0]?.message?.content) {
            console.log("Response:", data.choices[0].message.content.trim());
            return data.choices[0].message.content.trim();
          }
          if (data.generated_text) {
            console.log("Response:", data.generated_text.trim());
            return data.generated_text.trim();
          }
        } else {
           console.log(`Failed with HF model: ${model} -> ${JSON.stringify(data.error || data)}`);
        }
        
        lastError = data?.error || lastError;
      } catch (err) {
        lastError = err.message;
      }
    }
  }

  throw new Error(lastError);
}

async function generateWithOpenRouter(payload) {
  if (!env.openRouterApiKey || env.openRouterApiKey === "or_xxx") {
    throw new Error("Missing OPENROUTER_API_KEY in backend environment.");
  }

  const promptMessages = buildOpenRouterMessages(payload);
  console.log("OpenRouter messages:", JSON.stringify(promptMessages, null, 2));

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
      messages: promptMessages
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
    if (env.openRouterApiKey && env.openRouterApiKey !== "or_xxx") {
      return generateWithOpenRouter(payload);
    }
    throw error;
  }
}

export async function generateCaption({ topic, platform, tone, optimize, imageContext = null }) {
  const format = detectContentType(topic);
  
  console.log("--- generateCaption ---");
  console.log("Topic:", topic);
  console.log("Format:", format);
  console.log("Platform:", platform);
  console.log("Tone:", tone);

  // Use Gemini if an image is provided (Multimodal)
  if (imageContext && genAI) {
    try {
      return await generateWithGemini({ topic, platform, tone, format, imageContext });
    } catch (err) {
      console.error("Gemini failed, falling back", err);
      // fallback continues below
    }
  }

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

export async function chatWithAssistant({ message, context, history }) {
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
    let enhancedTopic = message;
    if (history && history.length > 0) {
      const lastAsst = [...history].reverse().find(m => m.role === 'assistant');
      if (lastAsst) {
        enhancedTopic = `User requested: "${message}". Context from previous AI response: "${lastAsst.content.substring(0, 400)}"`;
      }
    }

    return generateText({
      mode: "content",
      topic: enhancedTopic,
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
    history,
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
