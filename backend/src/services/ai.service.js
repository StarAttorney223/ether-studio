import { env } from "../config/env.js";

const HF_API_URL = "https://router.huggingface.co/hf-inference/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildPrompt({ topic, platform, tone, optimize }) {
  return `Write a social media caption for ${platform}. Topic: ${topic}. Tone: ${tone}. ${optimize ? "Optimize for engagement, include CTA and relevant hashtags." : "Keep it concise."}`;
}

async function generateWithHuggingFace(payload) {
  if (!env.huggingFaceApiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY in backend environment.");
  }

  const prompt = buildPrompt(payload);
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
        parameters: { max_new_tokens: 220, temperature: 0.75, return_full_text: false }
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
      messages: [
        { role: "system", content: "You are an expert social media copywriter." },
        { role: "user", content: buildPrompt(payload) }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenRouter generation failed");
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Unable to generate content right now.";
}

export async function generateCaption(payload) {
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

export async function chatWithAssistant({ message, context }) {
  const chatPayload = {
    topic: `${context || "General social strategy"}. User message: ${message}`,
    platform: "Instagram / LinkedIn",
    tone: "Strategic consultant",
    optimize: true
  };

  return generateCaption(chatPayload);
}

function normalizeHashtags(rawHashtags = []) {
  return (rawHashtags || [])
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 8);
}

function parseCaptionPayload(content) {
  try {
    const normalized = content.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(normalized);
    return {
      caption: String(parsed.caption || "").trim(),
      hashtags: normalizeHashtags(parsed.hashtags)
    };
  } catch {
    const hashtagMatches = content.match(/#[\w-]+/g) || [];
    const caption = content.replace(/#[\w-]+/g, "").trim();
    return {
      caption: caption || content.trim(),
      hashtags: normalizeHashtags(hashtagMatches)
    };
  }
}

export async function generateOpenRouterCaption({ topic, platform, tone }) {
  if (!env.openRouterApiKey || env.openRouterApiKey === "or_xxx") {
    throw new Error("Missing OPENROUTER_API_KEY in backend environment.");
  }

  const prompt = `Generate a social media caption for:
Topic: ${topic}
Platform: ${platform}
Tone: ${tone}

Also include 8-10 hashtags.
Return strict JSON only in this format:
{"caption":"...","hashtags":["#tag1","#tag2","#tag3"]}`;

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
          content: "You are a social media copywriter. Return concise engaging output as valid JSON."
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

  const parsed = parseCaptionPayload(content);

  return {
    caption: parsed.caption || `Sharing thoughts about ${topic} on ${platform}.`,
    hashtags: parsed.hashtags
  };
}
