import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";

function ContentGeneratorPage() {
  const [hashtags, setHashtags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    topic: "",
    platform: "Instagram",
    tone: "Professional",
    optimize: true
  });
  const [trends, setTrends] = useState({ topics: [], hashtags: [] });
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("Craft your next social caption in one click.");
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState(output);

  useEffect(() => {
    setEditedOutput(output);
  }, [output]);

  const currentText = isEditing ? editedOutput : output;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("topic", form.topic);
      payload.append("platform", form.platform);
      payload.append("tone", form.tone);
      payload.append("optimize", String(form.optimize));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const data = await api.generateContent(payload);
      setOutput(data.data?.caption || "No caption returned.");
      setHashtags(data.data?.hashtags || []);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const resp = await api.getTrends(form.topic);
      setTrends(resp.data || { topics: [], hashtags: [] });
    } catch (err) {
      console.error("Trends fetch failed", err);
    } finally {
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    if (form.topic.length > 5 && !loadingTrends) {
      const timeout = setTimeout(handleFetchTrends, 1500);
      return () => clearTimeout(timeout);
    }
  }, [form.topic]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentText || "");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Generated Caption", text: currentText });
      return;
    }
    await navigator.clipboard.writeText(currentText || "");
    alert("Shared content copied to clipboard.");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setOutput(editedOutput);
      setIsEditing(false);
      return;
    }
    setEditedOutput(output);
    setIsEditing(true);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="space-y-5 rounded-[2rem] bg-studio-bg studio-animate-in">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Content Generator</h1>
          <p className="mt-2 text-[1.45rem] leading-8 text-gray-600 dark:text-gray-300">Craft high-converting social media copy with the power of Ether AI.</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Core Topic</span>
          <textarea
            value={form.topic}
            onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            className="h-28 w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="What should your post be about?"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Reference Image</span>
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm" />
            <p className="mt-2 whitespace-pre-line">
              {imageFile
                ? `Using image context: ${imageFile.name}`
                : "Optional. Upload an image and the AI will use it as visual context for captions, scripts, and content."}
            </p>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Platform</span>
            <select
              value={form.platform}
              onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
              className="h-12 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>X (Twitter)</option>
              <option>TikTok</option>
              <option>YouTube</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Tone Of Voice</span>
            <select
              value={form.tone}
              onChange={(e) => setForm((prev) => ({ ...prev, tone: e.target.value }))}
              className="h-12 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option>Professional</option>
              <option>Minimalist</option>
              <option>Playful</option>
              <option>Bold</option>
            </select>
          </label>
        </div>

        <label className="flex items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} className="text-studio-primary" /> Auto-optimize for engagement
          </span>
          <input
            type="checkbox"
            checked={form.optimize}
            onChange={(e) => setForm((prev) => ({ ...prev, optimize: e.target.checked }))}
            className="h-5 w-5 accent-studio-primary"
          />
        </label>

        <button
          onClick={handleGenerate}
          disabled={loading || !form.topic.trim()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] text-xl font-semibold text-white transition-all duration-300 hover:scale-[1.01] disabled:opacity-60"
        >
          <Sparkles size={18} /> {loading ? "Generating..." : "Generate Magic"}
        </button>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {/* Trends Section */}
        <section className="space-y-4 rounded-3xl border border-gray-100 bg-white/50 p-6 shadow-sm ring-1 ring-black/[0.02] transition-all dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-studio-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-studio-primary"></span>
                </span>
                <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-studio-primary">Trending Now</h3>
              </div>
            </div>
            <button 
              onClick={handleFetchTrends}
              disabled={loadingTrends}
              className="group flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider text-gray-400 hover:text-studio-primary disabled:opacity-50"
            >
              <Sparkles size={10} className={loadingTrends ? "animate-spin" : "group-hover:animate-pulse"} />
              {loadingTrends ? "Scouting..." : "Refresh"}
            </button>
          </div>
          
          <div className="space-y-2.5">
            {trends.topics.length > 0 ? (
              trends.topics.map((item, i) => {
                const cleanTopic = item.replace(/^\d+\.\s*/, '').trim();
                return (
                  <button 
                    key={i} 
                    onClick={async () => {
                      setForm(prev => ({ ...prev, topic: cleanTopic }));
                      // Trigger generation immediately with this topic
                      setLoading(true);
                      setError("");
                      try {
                        const payload = new FormData();
                        payload.append("topic", cleanTopic);
                        payload.append("platform", form.platform);
                        payload.append("tone", form.tone);
                        payload.append("optimize", String(form.optimize));
                        if (imageFile) payload.append("image", imageFile);
                        
                        const data = await api.generateContent(payload);
                        setOutput(data.data?.caption || "No caption returned.");
                        setHashtags(data.data?.hashtags || []);
                        setIsEditing(false);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-studio-primary/5 hover:ring-1 hover:ring-studio-primary/20 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-studio-primary text-[10px] font-bold text-white uppercase">{i+1}</span>
                    <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 leading-tight">{cleanTopic}</span>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                <p className="text-xs text-gray-400 italic">Type a topic to fetch real-time trends...</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 dark:border-gray-700/30 mt-2">
            {trends.hashtags.map((tag, i) => (
              <button 
                key={i} 
                onClick={async () => {
                  const nextTopic = form.topic.includes(tag) ? form.topic : `${form.topic} ${tag}`.trim();
                  setForm(prev => ({ ...prev, topic: nextTopic }));
                  
                  // Trigger generation immediately
                  setLoading(true);
                  setError("");
                  try {
                    const payload = new FormData();
                    payload.append("topic", nextTopic);
                    payload.append("platform", form.platform);
                    payload.append("tone", form.tone);
                    payload.append("optimize", String(form.optimize));
                    if (imageFile) payload.append("image", imageFile);
                    
                    const data = await api.generateContent(payload);
                    setOutput(data.data?.caption || "No caption returned.");
                    setHashtags(data.data?.hashtags || []);
                    setIsEditing(false);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="rounded-lg bg-studio-primary/5 px-2 py-1 text-[11px] font-bold text-studio-primary hover:bg-studio-primary hover:text-white transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft sm:p-7 studio-animate-in dark:border-gray-700 dark:bg-gray-800 xl:min-h-[84vh] xl:flex xl:flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">AI Generated Caption</h2>
            <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Instagram optimized</p>
          </div>
        </div>

        <div className="studio-scrollbar max-h-none min-h-[520px] flex-1 overflow-y-auto rounded-2xl bg-gray-100 p-4 dark:bg-gray-700">
          {isEditing ? (
            <textarea
              value={editedOutput}
              onChange={(e) => setEditedOutput(e.target.value)}
              className="h-[560px] w-full resize-none bg-transparent text-[1.1rem] leading-8 text-gray-900 outline-none dark:text-white"
            />
          ) : (
            <p className="whitespace-pre-line text-[1.05rem] leading-7 text-gray-900 dark:text-white">{output}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#efe6ff] px-4 py-2 text-sm font-semibold text-studio-primary">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleCopy} className="h-12 flex-1 rounded-full bg-white font-semibold text-gray-900 transition-all duration-300 hover:scale-[1.01] dark:bg-gray-800 dark:text-white">
            Copy to Clipboard
          </button>
          <button onClick={handleShare} className="h-12 w-16 rounded-full bg-gray-100 text-sm font-semibold text-gray-900 transition-all duration-300 hover:scale-105 dark:bg-gray-700 dark:text-white">
            Share
          </button>
          <button onClick={handleEditToggle} className="h-12 w-16 rounded-full bg-gray-100 text-sm font-semibold text-gray-900 transition-all duration-300 hover:scale-105 dark:bg-gray-700 dark:text-white">
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ContentGeneratorPage;
