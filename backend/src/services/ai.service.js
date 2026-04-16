import { env } from "../config/env.js";

const HF_API_URL = "https://router.huggingface.co/hf-inference/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const CONTENT_REQUEST_PATTERN =
  /\b(generate|write|create|draft|caption|post|script|carousel|thread|copy|content|linkedin post|instagram caption|youtube script|ad copy)\b/i;
const DETAILED_REQUEST_PATTERN =
  /\b(detailed|detail|longer|in-depth|comprehensive|step by step|full version|deep dive)\b/i;

function wantsDetailedResponse(text = "") {
  return DETAILED_REQUEST_PATTERN.test(String(text));
}

function detectResponseMode(message = "") {
  return CONTENT_REQUEST_PATTERN.test(String(message)) ? "content" : "chat";
}

function detectContentFormat(text = "") {
  const normalized = String(text).toLowerCase();

  if (normalized.includes("script")) {
    return "script";
  }

  if (normalized.includes("carousel")) {
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
    caption:
      "For captions, write 2 to 4 short lines. Add 3 to 5 relevant hashtags only if they genuinely fit.",
    script:
      "For scripts, use exactly these labels on separate lines: Hook, Main Content, Call to Action. Keep each section concise and readable.",
    carousel:
      "For carousels, format as Slide 1, Slide 2, and continue only as needed. Keep each slide short and clear."
  };

  return [
    `Create ${format} content for ${platform}.`,
    `Topic: ${topic}.`,
    `Tone: ${tone}.`,
    optimize
      ? "Make it engaging and polished, but do not make it feel overloaded."
      : "Keep it clean and straightforward.",
    imageSummary
      ? `User has provided an image. Analyze its content and incorporate it into the response. Image context: ${imageSummary}`
      : "",
    "Output must be clean, structured, and easy to scan.",
    "Use short paragraphs with line breaks between ideas.",
    "Do not generate multiple options.",
    "Do not overuse symbols, markdown decoration, unnecessary hashtags, or separators like ---.",
    "Do not add image suggestions automatically.",
    detailed
      ? "The user asked for detail, so provide a fuller version while staying readable."
      : "Keep responses concise unless the user explicitly asks for detailed output.",
    formatRules[format] || formatRules.caption
  ]
    .filter(Boolean)
    .join(" ");
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
        parameters: { max_new_tokens: 260, temperature: payload.mode === "chat" ? 0.8 : 0.7, return_full_text: false }
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
  const format = detectContentFormat(topic);
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
  const mode = detectResponseMode(message);

  if (mode === "content") {
    return generateText({
      mode: "content",
      topic: message,
      platform: context || "Instagram / LinkedIn",
      tone: "Helpful and clear",
      optimize: true,
      format: detectContentFormat(message),
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

  const format = detectContentFormat(topic);
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
      ? "Title should be clickable but not spammy. Description should be 2 to 4 short paragraphs. Add up to 5 relevant tags only if useful."
      : format === "caption"
        ? "For captions, write 2 to 4 short lines and include 3 to 5 relevant hashtags only if needed."
        : format === "script"
          ? "For scripts, use Hook, Main Content, and Call to Action."
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
