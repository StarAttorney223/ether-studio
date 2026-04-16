import { env } from "../config/env.js";

const HF_API_URL = "https://router.huggingface.co/hf-inference/models";

function getDimensions(aspectRatio) {
  const map = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "4:5": { width: 896, height: 1120 },
    "5:4": { width: 1120, height: 896 },
    "4:3": { width: 1152, height: 864 },
    "3:4": { width: 864, height: 1152 },
    "3:2": { width: 1216, height: 832 },
    "2:3": { width: 832, height: 1216 },
    "21:9": { width: 1344, height: 576 }
  };

  return map[aspectRatio] || map["16:9"];
}

function buildPollinationsUrl(prompt, aspectRatio) {
  const seed = Math.floor(Math.random() * 1000000);
  const { width, height } = getDimensions(aspectRatio);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=${width}&height=${height}&nologo=true`;
}

async function toDataUrlFromResponse(response) {
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function generateImageFromPrompt({ prompt, aspectRatio, style, lighting }) {
  const input = `Create an image. Prompt: ${prompt}. Aspect Ratio: ${aspectRatio}. Style: ${style}. Lighting: ${lighting}.`;

  const candidateModels = [
    env.huggingFaceImageModel,
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0"
  ].filter(Boolean);

  let lastError = "Image generation failed";

  if (env.huggingFaceApiKey) {
    for (const model of candidateModels) {
      try {
        const response = await fetch(`${HF_API_URL}/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.huggingFaceApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: input })
        });

        if (response.ok) {
          return toDataUrlFromResponse(response);
        }

        const errorPayload = await response.json().catch(() => ({}));
        lastError = errorPayload?.error || lastError;
      } catch (error) {
        lastError = error.message || lastError;
      }
    }
  }

  const fallbackResponse = await fetch(buildPollinationsUrl(prompt, aspectRatio)).catch(() => null);
  if (fallbackResponse?.ok) {
    return toDataUrlFromResponse(fallbackResponse);
  }

  throw new Error(lastError);
}
