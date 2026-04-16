import { useEffect, useMemo, useState } from "react";
import { Bolt } from "lucide-react";
import { generatedImages } from "../data/mockData";
import { api } from "../services/api";

const STORAGE_KEY = "studio-recent-generated-images";

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

function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [style, setStyle] = useState("Photorealistic");
  const [lighting, setLighting] = useState("Golden Hour");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [recentGenerated, setRecentGenerated] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRecentGenerated(JSON.parse(saved));
    }
  }, []);

  const allRecentImages = useMemo(() => {
    const dynamic = recentGenerated.map((item) => item.imageUrl);
    return [...dynamic, ...generatedImages].slice(0, 20);
  }, [recentGenerated]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.generateImage({
        prompt,
        aspectRatio,
        style,
        lighting
      });
      const imageUrl = data.data?.imageUrl || "";
      setResult(imageUrl);

      const next = [
        { imageUrl, prompt, aspectRatio, createdAt: new Date().toISOString() },
        ...recentGenerated
      ].slice(0, 12);

      setRecentGenerated(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 studio-animate-in">
      <section>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Image Generator</h1>
        <p className="mt-2 max-w-3xl text-[1.4rem] text-gray-600 dark:text-gray-300">Bring your creative visions to life. Enter a prompt and let Ether Studio handle the aesthetic precision.</p>
      </section>

      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.06em] text-studio-primary">AI Image Prompt</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-4 h-28 w-full rounded-3xl bg-gray-100 px-5 py-4 text-[1.1rem] text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
          placeholder="A futuristic lounge in the clouds, ethereal lighting, soft violet hues, cinematic architecture..."
        />

        <div className="mt-5 grid gap-3 xl:grid-cols-[120px_120px_120px_120px_120px_200px]">
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
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white xl:col-span-2">
            <option>Photorealistic</option>
            <option>3D Render</option>
            <option>Illustration</option>
            <option>Concept Art</option>
            <option>Minimalist</option>
          </select>
          <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white xl:col-span-2">
            <option>Golden Hour</option>
            <option>Studio</option>
            <option>Cinematic</option>
            <option>Soft Ambient</option>
            <option>Low Key</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6e3df5] to-[#9670ff] text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
          >
            <Bolt size={15} /> {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </section>

      {result && (
        <section>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Latest Result</h2>
          <div className={`mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-gray-800 ${getAspectClass(aspectRatio)}`}>
            <img src={result} alt="Generated" className="h-full w-full object-cover" />
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Recent Creations</h2>
          <span className="rounded-full bg-[#eadbff] px-3 py-1 text-xs font-semibold text-studio-primary">{recentGenerated.length} New</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allRecentImages.map((src, index) => (
            <img key={`${src}-${index}`} src={src} alt="Creation" className="aspect-square rounded-[2rem] object-cover" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ImageGeneratorPage;
