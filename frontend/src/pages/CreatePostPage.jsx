import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, ImagePlus, Sparkles, Video } from "lucide-react";
import BackButton from "../components/BackButton";
import Toast from "../components/common/Toast";
import PostPreview from "../components/create-post/PostPreview";
import { api } from "../services/api";

const platformOptions = ["Instagram", "LinkedIn", "Twitter / X", "YouTube"];

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

  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("Professional");
  const [hashtags, setHashtags] = useState([]);
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState("Instagram");
  const [statusText, setStatusText] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [postData, setPostData] = useState({
    caption: "",
    title: "",
    description: "",
    hashtags: "",
    media: "",
    thumbnail: "",
    platform: "Instagram",
    type: "image"
  });

  const isYouTubeSelected = platforms.includes("YouTube");
  const previewablePlatforms = useMemo(
    () => platformOptions.filter((platform) => platforms.includes(platform)),
    [platforms]
  );

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => setToast({ message: "", type: "success" }), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!previewablePlatforms.includes(previewPlatform)) {
      const fallbackPlatform = previewablePlatforms[0] || "Instagram";
      setPreviewPlatform(fallbackPlatform);
      setPostData((prev) => ({ ...prev, platform: fallbackPlatform }));
    }
  }, [previewPlatform, previewablePlatforms]);

  useEffect(() => {
    async function loadPostForEdit() {
      if (!isEditMode) return;

      setLoadingPost(true);
      try {
        const response = await api.getPostById(id);
        const post = response.data;
        const nextPlatforms =
          Array.isArray(post.platforms) && post.platforms.length > 0 ? post.platforms : ["Instagram"];
        const nextPreviewPlatform = nextPlatforms[0] || "Instagram";

        setPlatforms(nextPlatforms);
        setPreviewPlatform(nextPreviewPlatform);
        setPostData({
          caption: post.content || "",
          title: post.title || "",
          description: post.description || post.content || "",
          hashtags: "",
          media: post.mediaUrl || "",
          thumbnail: post.thumbnailUrl || "",
          platform: nextPreviewPlatform,
          type: post.type || (nextPlatforms.includes("YouTube") ? "video" : "image")
        });

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

  const updatePostData = (field, value) => {
    setPostData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platform) => {
    setPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((item) => item !== platform);
        if (platform === "YouTube") {
          setPostData((current) => ({ ...current, platform: next[0] || "Instagram" }));
        }
        return next;
      }

      return [...prev, platform];
    });

    if (platform === "YouTube") {
      setPreviewPlatform("YouTube");
      setPostData((prev) => ({ ...prev, platform: "YouTube", type: "video" }));
    }
  };

  const handleMediaUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await toDataUrl(file);
      updatePostData(field, dataUrl);

      if (field === "media") {
        const nextType = file.type.startsWith("video/") ? "video" : "image";
        updatePostData("type", nextType);
      }

      setStatusText(field === "thumbnail" ? "Thumbnail ready for preview and save." : "Media ready for preview and save.");
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

      const nextHashtags = response.data?.hashtags || [];
      setHashtags(nextHashtags);
      updatePostData("hashtags", nextHashtags.join(" "));

      if (previewPlatform === "YouTube") {
        updatePostData("title", response.data?.title || "");
        updatePostData("description", response.data?.description || response.data?.caption || "");
        if (!isYouTubeSelected) {
          setPlatforms((prev) => (prev.includes("YouTube") ? prev : [...prev, "YouTube"]));
        }
      } else {
        updatePostData("caption", response.data?.caption || "");
      }

      setToast({ message: previewPlatform === "YouTube" ? "AI YouTube copy generated." : "AI caption generated.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "AI generation failed.", type: "error" });
    } finally {
      setGeneratingAi(false);
    }
  };

  const submitPost = async (status) => {
    const normalizedContent = postData.caption.trim() || postData.description.trim();

    if (isYouTubeSelected && !postData.title.trim()) {
      setStatusText("Title is required for YouTube posts.");
      return;
    }

    if (!normalizedContent) {
      setStatusText(isYouTubeSelected ? "Please enter a description or caption." : "Please enter post content.");
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
        content: normalizedContent,
        title: postData.title.trim(),
        description: postData.description.trim(),
        platforms,
        mediaUrl: postData.media,
        thumbnailUrl: postData.thumbnail,
        type: isYouTubeSelected ? "video" : postData.type,
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
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-soft dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Loading post...
      </div>
    );
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
                placeholder={previewPlatform === "YouTube" ? "What should this video be about?" : "What should this post communicate?"}
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
                <Sparkles size={14} /> {generatingAi ? "Generating..." : previewPlatform === "YouTube" ? "Generate YouTube Copy" : "Generate with AI"}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold text-studio-primary dark:border-gray-700">
              <Sparkles size={16} />
              Manual Write
            </div>

            {isYouTubeSelected && (
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Video Title</span>
                  <input
                    value={postData.title}
                    onChange={(event) => updatePostData("title", event.target.value)}
                    placeholder="Write a compelling YouTube title..."
                    className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Video Description</span>
                  <textarea
                    value={postData.description}
                    onChange={(event) => updatePostData("description", event.target.value)}
                    placeholder="Describe the video, add context, and guide discovery..."
                    className="h-36 w-full resize-none rounded-3xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>
            )}

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">
                {isYouTubeSelected ? "Caption / Supporting Copy" : "Caption"}
              </span>
              <textarea
                value={postData.caption}
                onChange={(e) => updatePostData("caption", e.target.value)}
                placeholder={
                  isYouTubeSelected
                    ? "Optional short caption or promo copy for cross-posting..."
                    : "E.g. Write a professional post about the impact of generative AI on creative studios..."
                }
                className="h-36 w-full resize-none rounded-3xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              />
            </label>

            {(hashtags.length > 0 || postData.hashtags) && (
              <p className="mt-2 text-xs font-semibold text-studio-primary">
                {postData.hashtags || hashtags.join(" ")}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">Media Assets</p>

            {isYouTubeSelected ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <Video size={20} />
                  <span className="mt-2 text-sm font-semibold">Upload Video</span>
                  <span className="mt-1 px-6 text-center text-xs">Use your main YouTube media file here.</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaUpload(event, "media")} />
                </label>

                <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <ImagePlus size={20} />
                  <span className="mt-2 text-sm font-semibold">Upload Thumbnail</span>
                  <span className="mt-1 px-6 text-center text-xs">Add a thumbnail for the YouTube preview card.</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaUpload(event, "thumbnail")} />
                </label>
              </div>
            ) : (
              <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <ImagePlus size={20} />
                <span className="mt-2 text-sm font-semibold">Upload Media</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => handleMediaUpload(event, "media")} />
              </label>
            )}
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
            content={postData.caption}
            media={postData.media}
            platform={previewPlatform}
            hashtags={hashtags}
            onPlatformChange={(platform) => {
              setPreviewPlatform(platform);
              updatePostData("platform", platform);
            }}
            availablePlatforms={previewablePlatforms}
            title={postData.title}
            description={postData.description}
            thumbnail={postData.thumbnail}
          />

          <div className="rounded-2xl bg-[#efe4ff] px-4 py-3 text-xs font-semibold text-studio-primary dark:bg-[#3b2f68] dark:text-white">
            {isYouTubeSelected
              ? "Tip: A strong YouTube title plus a custom thumbnail usually outperforms description-only uploads."
              : "Tip: Images with high contrast generally perform better on Instagram."}
          </div>
        </aside>
      </div>

      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default CreatePostPage;
