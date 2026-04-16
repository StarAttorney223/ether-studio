import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";

function ContentGeneratorPage() {
  const [form, setForm] = useState({
    topic: "",
    platform: "Instagram",
    tone: "Professional",
    optimize: true
  });
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
      const data = await api.generateContent({
        topic: form.topic,
        platform: form.platform,
        tone: form.tone,
        optimize: form.optimize
      });
      setOutput(data.data?.caption || "No caption returned.");
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <p className="whitespace-pre-wrap text-[1.1rem] leading-8 text-gray-900 dark:text-white">{output}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["#Sustainability", "#SocialMedia", "#AIContent", "#Growth"].map((tag) => (
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
