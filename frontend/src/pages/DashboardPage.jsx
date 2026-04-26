import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/common/Toast";
import PostCardSkeleton from "../components/common/PostCardSkeleton";
import StatCard from "../components/common/StatCard";
import { dashboardStats, pipelineItems } from "../data/mockData";
import { api } from "../services/api";

const PLACEHOLDERS = [
  "A 3-part carousel about the future of AI in minimalist design.",
  "10 productivity hacks for remote designers.",
  "A viral TikTok script about eco-friendly lifestyle.",
  "A soulful LinkedIn post about career resilience.",
  "A tech review description for the latest gadget."
];

const SUGGESTION_CATEGORIES = [
  {
    id: "trending",
    label: "🔥 Trending",
    items: ["2026 Tech Trends", "Viral Topics", "Breaking News", "Internet Drama"]
  },
  {
    id: "business",
    label: "💼 Business",
    items: ["Startup Ideas", "Side Hustles", "Growth Hacks", "Marketing Ideas"]
  },
  {
    id: "content",
    label: "🎥 Content",
    items: ["YouTube Ideas", "Reel Hooks", "Caption Ideas", "Viral Scripts"]
  },
  {
    id: "ai",
    label: "🤖 AI / Tech",
    items: ["AI Tools", "Future Tech", "Automation Ideas", "ChatGPT Hacks"]
  }
];

function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [idea, setIdea] = useState("");
  const [selectedTrend, setSelectedTrend] = useState("");
  const [quickResult, setQuickResult] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [activeCategory, setActiveCategory] = useState("trending");
  const [liveTrends, setLiveTrends] = useState([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoadingPosts(true);
      const [analyticsResult, postsResult, trendsResult] = await Promise.allSettled([
        api.getAnalytics(), 
        api.getPosts(),
        api.getTrends()
      ]);

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value.data);
      } else {
        setAnalytics(null);
      }

      if (postsResult.status === "fulfilled") {
        setPosts(postsResult.value.data || []);
      } else {
        setPosts([]);
      }

      if (trendsResult.status === "fulfilled") {
        const fetchedTopics = (trendsResult.value.data?.topics || []).map(t => t.replace(/^\d+\.\s*/, '').trim());
        if (fetchedTopics.length > 0) setLiveTrends(fetchedTopics);
      }

      setLoadingPosts(false);
    }

    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const scheduledPosts = posts.filter((post) => post.status === "scheduled").length;

    if (!analytics?.metrics) {
      return [
        { label: "Total Posts", value: totalPosts.toString(), badge: "+12%" },
        { label: "Scheduled", value: scheduledPosts.toString(), badge: "Next 24h" },
        dashboardStats[2],
        dashboardStats[3]
      ];
    }

    return [
      { label: "Total Posts", value: totalPosts.toString(), badge: "+12%" },
      { label: "Scheduled", value: scheduledPosts.toString(), badge: "Next 24h" },
      { label: "Engagement", value: `${analytics.metrics.engagementRate}%`, badge: "+5.4%" },
      { label: "Followers", value: `${analytics.metrics.followers}k`, badge: "+2.1k" }
    ];
  }, [analytics, posts]);

  const recentPostCards = useMemo(() => {
    if (posts.length === 0) {
      return [];
    }

    return posts.slice(0, 8).map((post) => ({
      id: post.id,
      title: (post.title || post.content).slice(0, 64) + ((post.title || post.content).length > 64 ? "..." : ""),
      description: post.description || post.content,
      tags: [(post.platforms?.[0] || "Instagram").toUpperCase(), post.status.toUpperCase()],
      image:
        post.thumbnailUrl ||
        post.mediaUrl ||
        "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=1000&q=80"
    }));
  }, [posts]);

  const handleQuickGenerate = async () => {
    if (!idea.trim()) return;

    setQuickLoading(true);
    setQuickError("");

    try {
      const data = await api.generateContent({
        topic: idea,
        platform: "Instagram",
        tone: "Professional",
        optimize: true
      });
      setQuickResult(data.data?.caption || "No output returned.");
    } catch (error) {
      setQuickError(error.message);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleTrendClick = async (trend) => {
    setIdea(trend);
    setSelectedTrend(trend);
    
    // Auto-generate on click
    setQuickLoading(true);
    setQuickError("");

    try {
      const data = await api.generateContent({
        topic: trend,
        platform: "Instagram",
        tone: "Professional",
        optimize: true
      });
      setQuickResult(data.data?.caption || "No output returned.");
    } catch (error) {
      setQuickError(error.message);
    } finally {
      setQuickLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      await api.deletePost(deleteTarget.id);
      setPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: "Post deleted.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Unable to delete post.", type: "error" });
    }
  };

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="space-y-5 studio-animate-in">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#5f2ce3] to-[#8146ec] p-6 text-white shadow-glow sm:p-8">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold sm:text-5">What are we creating today?</h1>
              <p className="mt-2 text-sm text-white/85">Describe your idea and let the ether manifest it into content.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-full bg-white/12 p-2 pl-5 transition-all focus-within:bg-white/20">
                <input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder={PLACEHOLDERS[placeholderIndex]}
                  className="h-11 min-w-[220px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60 placeholder:italic transition-all duration-500"
                />
                <button
                  onClick={handleQuickGenerate}
                  disabled={quickLoading || !idea.trim()}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-studio-primary shadow-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-xl active:scale-95 disabled:opacity-60"
                >
                  {quickLoading ? "Manifesting..." : "Generate"}
                </button>
              </div>

              {quickError && <p className="mt-3 text-sm text-rose-200">{quickError}</p>}
              {quickResult && (
                <div className="mt-3 rounded-2xl bg-white/15 p-4 backdrop-blur-md">
                  <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-white/95 studio-scrollbar">{quickResult}</p>
                </div>
              )}

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {SUGGESTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${activeCategory === cat.id ? "bg-white text-studio-primary shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {[
                    ...(SUGGESTION_CATEGORIES.find(c => c.id === activeCategory)?.items || []),
                    ...(activeCategory === "trending" ? liveTrends : [])
                  ].map((item, idx) => (
                    <button
                      key={`${item}-${idx}`}
                      onClick={() => handleTrendClick(item)}
                      className="group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 transition-all duration-300 hover:scale-105 hover:bg-studio-primary hover:shadow-purple-500/40 hover:ring-studio-primary active:scale-95"
                    >
                      {item.length > 28 ? item.slice(0, 25) + "..." : item}
                      <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 studio-animate-in">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>

          <div className="studio-animate-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Studio Output</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your latest AI-assisted content creations</p>
              </div>
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-studio-primary transition-all duration-300 hover:translate-x-1">
                View all library <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loadingPosts
                ? Array.from({ length: 4 }).map((_, index) => <PostCardSkeleton key={index} />)
                : recentPostCards.map((item) => (
                    <article
                      key={`${item.id || item.title}-${item.description.slice(0, 12)}`}
                      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {item.id && (
                        <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <button
                            onClick={() => navigate(`/create-post/${item.id}`)}
                            className="rounded-full bg-white/95 p-2 text-gray-900 shadow-soft dark:bg-gray-900/95 dark:text-white"
                            title="Edit post"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-full bg-white/95 p-2 text-rose-600 shadow-soft"
                            title="Delete post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      <button onClick={() => navigate(`/create-post/${item.id}`)} className="w-full text-left">
                        <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                        <div className="space-y-2 p-5">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {item.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-900 dark:bg-gray-700 dark:text-white">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-[1.6rem] font-bold leading-8 text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                        </div>
                      </button>
                    </article>
                  ))}
            </div>
            {!loadingPosts && recentPostCards.length === 0 && (
              <div className="rounded-[1.9rem] border border-gray-200 bg-white p-8 text-center shadow-soft dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No posts yet</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Create your first post or save a draft to see recent studio output here.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft studio-animate-in dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Content Pipeline</h3>
            <MoreHorizontal size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-4">
            {pipelineItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:scale-[1.01] dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-studio-primary">{item.time}</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{item.type}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-3xl font-bold leading-9 text-gray-900 dark:text-white">Automate your schedule</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Let Ether AI find the best posting times based on your audience activity.</p>
            <button className="mt-4 rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-purple-600">Enable Auto-Pilot</button>
          </div>
        </aside>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft studio-animate-in dark:bg-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Post?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">This will permanently remove this post from your studio.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-white"
              >
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

export default DashboardPage;
