import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, ImagePlus, Sparkles } from "lucide-react";
import BackButton from "../components/BackButton";
import Toast from "../components/common/Toast";
import PostPreview from "../components/create-post/PostPreview";
import { api } from "../services/api";

const platformOptions = ["Instagram", "LinkedIn", "Twitter / X"];

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toLocalDateParts(isoString) {
  if (!isoString) return { date: "", time: "" };
  const date = new Date(isoString);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  const [datePart, timePart] = local.split("T");
  return { date: datePart || "", time: timePart || "" };
}

function CreatePostPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [caption, setCaption] = useState("");
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("Professional");
  const [hashtags, setHashtags] = useState([]);
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState("Instagram");
  const [statusText, setStatusText] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => setToast({ message: "", type: "success" }), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode) return;

      setLoadingPost(true);
      try {
        const response = await api.getPostById(id);
        const post = response.data;
        setCaption(post.content || "");
        setPlatforms(Array.isArray(post.platforms) && post.platforms.length > 0 ? post.platforms : ["Instagram"]);
        setMediaUrl(post.mediaUrl || "");
        setPreviewPlatform(post.platforms?.[0] || "Instagram");

        if (post.status === "scheduled" && post.scheduledTime) {
          const localParts = toLocalDateParts(post.scheduledTime);
          setScheduleType("later");
          setScheduleDate(localParts.date);
          setScheduleTime(localParts.time);
        } else {
          setScheduleType("now");
          setScheduleDate("");
          setScheduleTime("");
        }
      } catch (error) {
        setToast({ message: error.message || "Unable to load post", type: "error" });
      } finally {
        setLoadingPost(false);
      }
    }

    loadPostForEdit();
  }, [id, isEditMode]);

  const scheduledDateTime = useMemo(() => {
    if (!scheduleDate || !scheduleTime) return null;
    return `${scheduleDate}T${scheduleTime}`;
  }, [scheduleDate, scheduleTime]);

  const togglePlatform = (platform) => {
    setPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((item) => item !== platform);
        if (!next.includes(previewPlatform)) {
          setPreviewPlatform(next[0]);
        }
        return next;
      }
      return [...prev, platform];
    });
  };

  const handleMediaUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await toDataUrl(file);
      setMediaUrl(dataUrl);
      setStatusText("Media ready for preview and save.");
    } catch {
      setStatusText("Could not process selected media file.");
    }
  };

  const handleGenerateAi = async () => {
    if (!idea.trim()) {
      setToast({ message: "Please describe your post idea first.", type: "error" });
      return;
    }

    setGeneratingAi(true);
    try {
      const response = await api.generateAICaption({
        topic: idea.trim(),
        platform: previewPlatform,
        tone
      });

      setCaption(response.data?.caption || "");
      setHashtags(response.data?.hashtags || []);
      setToast({ message: "AI caption generated.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "AI generation failed.", type: "error" });
    } finally {
      setGeneratingAi(false);
    }
  };

  const submitPost = async (status) => {
    if (!caption.trim()) {
      setStatusText("Please enter post content.");
      return;
    }

    if (status === "scheduled" && !scheduledDateTime) {
      setStatusText("Choose date and time to schedule this post.");
      return;
    }

    setLoadingAction(status);
    setStatusText("");

    try {
      const payload = {
        content: caption.trim(),
        platforms,
        mediaUrl,
        status,
        scheduledTime: status === "scheduled" ? new Date(scheduledDateTime).toISOString() : null
      };

      if (isEditMode) {
        await api.updatePost(id, payload);
        setToast({ message: "Post updated.", type: "success" });
      } else {
        await api.createPost(payload);
        if (status === "draft") setToast({ message: "Draft saved.", type: "success" });
        if (status === "scheduled") setToast({ message: "Post scheduled successfully.", type: "success" });
        if (status === "published") setToast({ message: "Post published (simulated).", type: "success" });
      }

      setStatusText(isEditMode ? "Post updated successfully." : "Saved successfully.");

      if (!isEditMode && status !== "draft") {
        navigate("/dashboard");
      }
    } catch (error) {
      setStatusText(error.message || "Unable to save post.");
      setToast({ message: error.message || "Unable to save post.", type: "error" });
    } finally {
      setLoadingAction("");
    }
  };

  if (loadingPost) {
    return <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-soft dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Loading post...</div>;
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px] studio-animate-in">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <BackButton />
                <h1 className="text-5xl font-bold">{isEditMode ? "Edit Post" : "Create New Post"}</h1>
              </div>
              <p className="mt-1 text-[1.05rem] text-gray-500 dark:text-gray-300">Drafting your next viral moment</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => submitPost("draft")}
                disabled={!!loadingAction}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-soft dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {loadingAction === "draft" ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => submitPost("scheduled")}
                disabled={!!loadingAction}
                className="rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                {loadingAction === "scheduled" ? "Scheduling..." : "Schedule Post"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Target Platforms</p>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((platform) => {
                const isSelected = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-2 border-studio-primary bg-white text-studio-primary dark:bg-gray-800"
                        : "border-2 border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Describe Your Post Idea</span>
              <input
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="What should this post communicate?"
                className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="h-10 rounded-full bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              >
                <option>Professional</option>
                <option>Bold</option>
                <option>Minimalist</option>
                <option>Playful</option>
              </select>
              <button
                onClick={handleGenerateAi}
                disabled={generatingAi}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 disabled:opacity-60 dark:bg-gray-800 dark:text-white"
              >
                <Sparkles size={14} /> {generatingAi ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold text-studio-primary dark:border-gray-700">
              <Sparkles size={16} />
              Manual Write
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Caption</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="E.g. Write a professional post about the impact of generative AI on creative studios..."
                className="h-36 w-full resize-none rounded-3xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              />
            </label>
            {hashtags.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-studio-primary">{hashtags.join(" ")}</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Media Assets</p>
            <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <ImagePlus size={20} />
              <span className="mt-2 text-sm font-semibold">Upload Media</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            </label>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-gray-200 bg-white p-5 text-gray-900 shadow-soft dark:border-gray-700 dark:bg-gray-800 dark:text-white md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Publishing</p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={scheduleType === "now"}
                    onChange={() => setScheduleType("now")}
                    className="accent-studio-primary"
                  />
                  Post Now
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={scheduleType === "later"}
                    onChange={() => setScheduleType("later")}
                    className="accent-studio-primary"
                  />
                  Schedule Later
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <CalendarClock size={15} className="text-studio-primary" /> Schedule Time
              </p>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                disabled={scheduleType !== "later"}
                className="h-10 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none disabled:opacity-60 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                disabled={scheduleType !== "later"}
                className="h-10 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none disabled:opacity-60 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => submitPost("draft")}
              disabled={!!loadingAction}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-soft dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              Save Draft
            </button>
            <button
              onClick={() => submitPost("scheduled")}
              disabled={!!loadingAction || scheduleType !== "later"}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 disabled:opacity-60 dark:bg-gray-800 dark:text-white"
            >
              Schedule Post
            </button>
            <button
              onClick={() => submitPost(scheduleType === "later" ? "scheduled" : "published")}
              disabled={!!loadingAction}
              className="rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {loadingAction === "published" || loadingAction === "scheduled"
                ? "Saving..."
                : isEditMode
                ? "Update Post"
                : "Publish Now"}
            </button>
          </div>

          {statusText && <p className="text-sm text-gray-500 dark:text-gray-300">{statusText}</p>}
        </section>

        <aside className="space-y-4">
          <PostPreview
            content={caption}
            media={mediaUrl}
            platform={previewPlatform}
            hashtags={hashtags}
            onPlatformChange={setPreviewPlatform}
          />

          <div className="rounded-2xl bg-[#efe4ff] px-4 py-3 text-xs font-semibold text-studio-primary dark:bg-[#3b2f68] dark:text-white">
            Tip: Images with high contrast generally perform better on Instagram.
          </div>
        </aside>
      </div>

      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default CreatePostPage;
