import { useEffect, useMemo, useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import Toast from "../components/common/Toast";
import { api } from "../services/api";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatCreatedDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeScheduledPost(post) {
  const platformList = Array.isArray(post.platforms) ? post.platforms : [];
  return {
    id: post.id,
    title: post.content,
    platform: platformList[0] || "Instagram",
    platforms: platformList,
    scheduledAt: post.scheduledTime,
    status: post.status
  };
}

function normalizeDraftPost(post) {
  const platformList = Array.isArray(post.platforms) ? post.platforms : [];
  return {
    id: post.id,
    title: post.content,
    createdAt: post.createdAt,
    platforms: platformList
  };
}

function SchedulerPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("");
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [draftPosts, setDraftPosts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadScheduledPosts = async () => {
    try {
      const response = await api.getScheduledPosts();
      const posts = (response.data || []).map(normalizeScheduledPost);
      setScheduledPosts(posts);
    } catch {
      setScheduledPosts([]);
    }
  };

  const loadDraftPosts = async () => {
    setLoadingDrafts(true);
    try {
      const response = await api.getDraftPosts();
      const posts = (response.data || []).map(normalizeDraftPost);
      setDraftPosts(posts);
    } catch {
      setDraftPosts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    loadScheduledPosts();
    loadDraftPosts();
  }, []);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { key: `empty-${index}`, inMonth: false };
      }

      const date = new Date(year, month, dayNumber);
      const isoDate = date.toISOString().slice(0, 10);
      const events = scheduledPosts.filter((post) => post.scheduledAt?.slice(0, 10) === isoDate);

      return {
        key: isoDate,
        inMonth: true,
        dayNumber,
        events
      };
    });
  }, [currentMonth, scheduledPosts]);

  const handleSchedule = async () => {
    if (!title.trim() || !scheduledAt) {
      setStatus("Post title and date-time are required.");
      return;
    }

    setStatus("Scheduling...");
    try {
      await api.createPost({
        content: title.trim(),
        platforms: [platform],
        mediaUrl: "",
        status: "scheduled",
        scheduledTime: new Date(scheduledAt).toISOString()
      });
      setStatus("Post scheduled successfully.");
      setTitle("");
      setScheduledAt("");
      await loadScheduledPosts();
      setToast({ message: "Post scheduled.", type: "success" });
    } catch (error) {
      setStatus(error.message);
      setToast({ message: error.message || "Unable to schedule post.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.deletePost(deleteTarget.id);
      if (deleteTarget.scheduledAt) {
        setScheduledPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
        setStatus("Scheduled post deleted.");
      } else {
        setDraftPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
        setStatus("Draft deleted.");
      }
      setDeleteTarget(null);
      setToast({ message: "Post deleted.", type: "success" });
    } catch (error) {
      setStatus(error.message);
      setToast({ message: error.message || "Unable to delete post.", type: "error" });
    }
  };

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] studio-animate-in">
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <BackButton />
                <h1 className="text-5xl font-bold">Content Calendar</h1>
              </div>
              <p className="text-[1.2rem] text-gray-500 dark:text-gray-300">{monthLabel(currentMonth)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-900 dark:bg-gray-700 dark:text-white"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-900 dark:bg-gray-700 dark:text-white"
              >
                Next
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-gray-700">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {dayLabels.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((cell) => (
                <div key={cell.key} className="h-28 border-b border-r border-slate-100 p-2 dark:border-gray-700">
                  {cell.inMonth && (
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{cell.dayNumber}</p>
                      <div className="mt-1 space-y-1">
                        {cell.events.slice(0, 2).map((event) => (
                          <div key={event.id} className="group flex items-center gap-1 rounded-full border border-studio-primary px-2 py-1 text-[10px]">
                            <button
                              onClick={() => navigate(`/create-post/${event.id}`)}
                              className="truncate text-left font-semibold text-studio-primary"
                              title="Edit scheduled post"
                            >
                              {formatTime(event.scheduledAt)} {event.title}
                            </button>
                            <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={() => navigate(`/create-post/${event.id}`)} className="text-studio-primary" title="Edit">
                                <Pencil size={10} />
                              </button>
                              <button onClick={() => setDeleteTarget(event)} className="text-rose-600" title="Delete">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Drafts Closet</h2>
              <span className="rounded-full bg-[#ebe4ff] px-2 py-1 text-xs font-semibold text-gray-900 dark:bg-[#3b2f68] dark:text-white">
                {loadingDrafts ? "..." : `${draftPosts.length} Total`}
              </span>
            </div>
            <div className="space-y-3">
              {loadingDrafts &&
                Array.from({ length: 3 }).map((_, index) => (
                  <article key={index} className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                    <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                    <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                    <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                  </article>
                ))}
              {!loadingDrafts &&
                draftPosts.map((draft) => (
                  <article key={draft.id} className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{draft.title}</p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">{formatCreatedDate(draft.createdAt)}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {draft.platforms.map((item) => (
                            <span key={`${draft.id}-${item}`} className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-studio-primary dark:bg-gray-800">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/create-post/${draft.id}`)}
                          className="rounded-full bg-white p-2 text-studio-primary shadow-soft dark:bg-gray-800"
                          title="Edit draft"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(draft)}
                          className="rounded-full bg-white p-2 text-rose-600 shadow-soft dark:bg-gray-800"
                          title="Delete draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              {!loadingDrafts && draftPosts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  No drafts yet. Start creating one.
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/create-post")}
              className="mt-4 w-full rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-gray-500 transition-colors hover:border-studio-primary hover:text-studio-primary dark:border-gray-700 dark:text-gray-300"
            >
              <PlusCircle className="mx-auto mb-2" size={18} />
              New Draft
            </button>
          </section>

          <section className="rounded-[2rem] bg-gradient-to-r from-[#5e2de5] to-[#8248f0] p-5 text-white shadow-glow">
            <h3 className="text-2xl font-bold">Upcoming Scheduled</h3>
            <div className="mt-3 space-y-2 text-sm">
              {scheduledPosts.length === 0 && <p>No scheduled posts yet.</p>}
              {scheduledPosts.slice(0, 6).map((post) => (
                <div key={post.id} className="group flex items-center justify-between gap-2 rounded-xl bg-white/10 px-2 py-1.5">
                  <button onClick={() => navigate(`/create-post/${post.id}`)} className="truncate text-left text-xs">
                    {post.platform} {new Date(post.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => navigate(`/create-post/${post.id}`)} className="rounded p-1 hover:bg-white/20" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(post)} className="rounded p-1 hover:bg-white/20" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule New Post</h3>
            <div className="mt-3 space-y-3">
              <input
                className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option>Instagram</option>
                <option>LinkedIn</option>
                <option>Twitter / X</option>
              </select>
              <input
                type="datetime-local"
                className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <button onClick={handleSchedule} className="h-11 w-full rounded-full bg-studio-primary font-semibold text-white transition-all duration-300 hover:scale-[1.02]">
                Schedule Post
              </button>
              {status && <p className="text-xs text-gray-500 dark:text-gray-300">{status}</p>}
            </div>
          </section>
        </aside>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-soft studio-animate-in dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Scheduled Post?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {deleteTarget.scheduledAt
                ? `This will remove "${deleteTarget.title}" scheduled for ${new Date(deleteTarget.scheduledAt).toLocaleString()}.`
                : `This will permanently remove "${deleteTarget.title}" from your drafts.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-white">
                Cancel
              </button>
              <button onClick={confirmDelete} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default SchedulerPage;
