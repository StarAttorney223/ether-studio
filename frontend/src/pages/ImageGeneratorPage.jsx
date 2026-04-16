import { useEffect, useMemo, useState } from "react";
import { Bolt, Trash2 } from "lucide-react";
import { generatedImages } from "../data/mockData";
import { api } from "../services/api";

const STORAGE_KEY = "studio-recent-generated-images";
const THUMBNAIL_PROMPT_SUFFIX =
  "high contrast, bold lighting, cinematic, youtube thumbnail style, vibrant colors, sharp focus, dramatic composition";

function normalizeStoredItem(item) {
  if (typeof item === "string") {
    return {
      id: `${item}-${Date.now()}`,
      imageUrl: item,
      prompt: "",
      aspectRatio: "16:9",
      createdAt: new Date().toISOString(),
      type: "image",
      textOverlay: ""
    };
  }

  return {
    id: item.id || `${item.imageUrl}-${item.createdAt || Date.now()}`,
    imageUrl: item.imageUrl || "",
    prompt: item.prompt || "",
    aspectRatio: item.aspectRatio || "16:9",
    createdAt: item.createdAt || new Date().toISOString(),
    type: item.type === "thumbnail" ? "thumbnail" : "image",
    textOverlay: item.textOverlay || ""
  };
}

function getAspectClass(aspectRatio) {
  const map = {
    "1:1": "aspect-square",
    "16:9": "aspect-[16/9]",
    "9:16": "aspect-[9/16] max-h-[72vh]",
    "4:5": "aspect-[4/5] max-h-[72vh]",
    "5:4": "aspect-[5/4]",
    "4:3": "aspect-[4/3]",
    "3:4": "aspect-[3/4] max-h-[72vh]",
    "3:2": "aspect-[3/2]",
    "2:3": "aspect-[2/3] max-h-[72vh]",
    "21:9": "aspect-[21/9]"
  };

  return map[aspectRatio] || map["16:9"];
}

function CreationCard({ item, onDelete, showDelete }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-gray-800">
      <div className={`relative ${getAspectClass(item.aspectRatio)}`}>
        <img src={item.imageUrl} alt={item.prompt || "Creation"} className="h-full w-full object-cover" />
        {item.textOverlay && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-gradient-to-t from-black/65 via-black/15 to-black/45 p-4">
            <p className="mt-2 max-w-[90%] text-center text-lg font-black uppercase leading-tight tracking-[0.04em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] sm:text-xl">
              {item.textOverlay}
            </p>
          </div>
        )}
        {item.type === "thumbnail" && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
            Thumbnail
          </span>
        )}
        {showDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 transition group-hover:opacity-100 dark:bg-gray-900/85 dark:text-white"
            aria-label="Delete creation"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {item.aspectRatio}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
        {item.prompt && <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{item.prompt}</p>}
      </div>
    </article>
  );
}

function ImageGeneratorPage() {
  const [mode, setMode] = useState("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [style, setStyle] = useState("Photorealistic");
  const [lighting, setLighting] = useState("Golden Hour");
  const [textOverlay, setTextOverlay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [recentGenerated, setRecentGenerated] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRecentGenerated(JSON.parse(saved).map(normalizeStoredItem));
    }
  }, []);

  const allRecentCreations = useMemo(() => {
    const seeded = generatedImages.map((imageUrl, index) =>
      normalizeStoredItem({
        id: `seed-${index}`,
        imageUrl,
        aspectRatio: "1:1",
        createdAt: new Date(2026, 0, index + 1).toISOString(),
        type: "image"
      })
    );

    return [...recentGenerated, ...seeded].slice(0, 20);
  }, [recentGenerated]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.generateImage({
        prompt,
        aspectRatio,
        style,
        lighting,
        mode,
        textOverlay
      });
      const imageUrl = data.data?.imageUrl || "";
      const item = {
        id: `${Date.now()}`,
        imageUrl,
        prompt,
        aspectRatio,
        createdAt: new Date().toISOString(),
        type: mode,
        textOverlay: mode === "thumbnail" ? textOverlay.trim() : ""
      };
      setResult(item);

      const next = [item, ...recentGenerated].slice(0, 12);
      setRecentGenerated(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const next = recentGenerated.filter((item) => item.id !== id);
    setRecentGenerated(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (result?.id === id) {
      setResult(null);
    }
  };

  return (
    <div className="space-y-8 studio-animate-in">
      <section>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Image Generator</h1>
        <p className="mt-2 max-w-3xl text-[1.4rem] text-gray-600 dark:text-gray-300">Bring your creative visions to life with polished images and scroll-stopping thumbnails in one place.</p>
      </section>

      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-studio-primary">Creative Generator</p>
          <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-gray-700">
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "image"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              Image Generator
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("thumbnail");
                setAspectRatio("16:9");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "thumbnail"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              Thumbnail Generator
            </button>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-4 h-28 w-full rounded-3xl bg-gray-100 px-5 py-4 text-[1.1rem] text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
          placeholder={
            mode === "thumbnail"
              ? "Make a YouTube thumbnail for: How to grow on Instagram fast"
              : "A futuristic lounge in the clouds, ethereal lighting, cinematic architecture..."
          }
        />

        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-[140px_160px_160px_1fr_200px]">
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
            <option value="1:1">1:1 (Thumbnail / Profile)</option>
            <option value="16:9">16:9 (Banner / Landscape)</option>
            <option value="9:16">9:16 (Reel / TikTok / Story)</option>
            <option value="4:5">4:5 (Instagram Portrait)</option>
            <option value="5:4">5:4 (Feed Landscape)</option>
            <option value="4:3">4:3 (Classic Landscape)</option>
            <option value="3:4">3:4 (Classic Portrait)</option>
            <option value="3:2">3:2 (Photo Wide)</option>
            <option value="2:3">2:3 (Poster Portrait)</option>
            <option value="21:9">21:9 (Cinematic Banner)</option>
          </select>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
            <option>Photorealistic</option>
            <option>3D Render</option>
            <option>Illustration</option>
            <option>Concept Art</option>
            <option>Minimalist</option>
          </select>
          <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
            <option>Golden Hour</option>
            <option>Studio</option>
            <option>Cinematic</option>
            <option>Soft Ambient</option>
            <option>Low Key</option>
          </select>
          <input
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            placeholder={mode === "thumbnail" ? "Text overlay (optional)" : "Text overlay disabled for images"}
            disabled={mode !== "thumbnail"}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6e3df5] to-[#9670ff] text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
          >
            <Bolt size={15} /> {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {mode === "thumbnail" && (
          <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">Thumbnail mode enhancement</p>
            <p className="mt-1">
              Your prompt is automatically enhanced with: <span className="font-medium">{THUMBNAIL_PROMPT_SUFFIX}</span>
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </section>

      {result && (
        <section>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Latest Result</h2>
          <div className="mt-4 max-w-4xl">
            <CreationCard item={result} onDelete={handleDelete} showDelete={false} />
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Recent Creations</h2>
          <span className="rounded-full bg-[#eadbff] px-3 py-1 text-xs font-semibold text-studio-primary">{recentGenerated.length} New</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allRecentCreations.map((item) => (
            <CreationCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              showDelete={recentGenerated.some((recentItem) => recentItem.id === item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ImageGeneratorPage;
