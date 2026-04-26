import axios from "axios";
import { env } from "../config/env.js";

const GNEWS_API_URL = "https://gnews.io/api/v4/top-headlines";

const SUBREDDITS_BY_CATEGORY = {
  trending: ["news", "worldnews", "technology"],
  business: ["startups", "business", "entrepreneur", "marketing"],
  content: ["YouTube", "socialmedia", "ContentCreators"],
  ai: ["technology", "artificial", "MachineLearning", "Singularity"]
};

/**
 * Fetch from Hacker News (Algolia Search API)
 */
async function fetchHackerNews(query = "ai") {
  try {
    const response = await axios.get(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`, {
      timeout: 5000
    });
    return (response.data?.hits || []).map(hit => hit.title);
  } catch (err) {
    console.error("[HackerNews] Fetch failed:", err.message);
    return [];
  }
}

/**
 * Strict Topic to Data Source Mapping
 */
export async function getTrendsByTopic(topic = "") {
  const norm = topic.toLowerCase();
  
  // 🤖 AI / TECH (HackerNews / GNews)
  if (norm.includes("ai tools") || norm.includes("chatgpt") || norm.includes("automation")) {
    const hnQuery = norm.includes("chatgpt") ? "chatgpt" : norm.includes("automation") ? "automation" : "ai tools";
    const titles = await fetchHackerNews(hnQuery);
    return titles.filter(t => t.length > 20).slice(0, 15);
  }
  
  if (norm.includes("future tech") || norm.includes("wearable tech")) {
    const results = await getGNewsTrends("technology");
    return results.map(r => r.title).slice(0, 15);
  }

  if (norm.includes("tech trends")) {
    const results = await getGNewsTrends("technology");
    return results.map(r => r.title).slice(0, 15);
  }

  // 🔥 TRENDING (Reddit / GNews)
  if (norm.includes("viral topics") || norm.includes("breaking news") || norm.includes("internet drama")) {
    if (norm.includes("breaking news")) {
      const results = await getGNewsTrends("general");
      return results.map(r => r.title).slice(0, 15);
    }
    const sub = norm.includes("drama") ? "PublicFreakout" : "news";
    const titles = await getTrendingByIntent(sub === "news" ? "trending" : sub);
    return titles;
  }

  // 💼 BUSINESS & 🎥 CONTENT (Reddit specific subs)
  let targetSub = "news";
  if (norm.includes("startup")) targetSub = "startups";
  else if (norm.includes("side hustle")) targetSub = "entrepreneur";
  else if (norm.includes("growth hack") || norm.includes("marketing")) targetSub = "marketing";
  else if (norm.includes("youtube")) targetSub = "YouTube";
  else if (norm.includes("reel") || norm.includes("instagram")) targetSub = "Instagram";
  else if (norm.includes("caption") || norm.includes("script")) targetSub = "socialmedia";

  try {
    const response = await axios.get(`https://www.reddit.com/r/${targetSub}/hot.json?limit=25`, {
      headers: { "User-Agent": "EtherStudio/1.0" },
      timeout: 5000
    });
    const titles = (response.data?.data?.children || []).map(child => child.data.title);
    return [...new Set(titles)]
      .filter(t => t && t.length > 25)
      .filter(t => !t.toLowerCase().includes("[removed]") && !t.toLowerCase().includes("[deleted]"))
      .slice(0, 15);
  } catch {
    return getCombinedTrends();
  }
}

/**
 * Resolve intent category from prompt text
 */
export function resolveCategoryFromPrompt(prompt = "") {
  const normalized = prompt.toLowerCase();
  
  if (/\b(startup|business|growth|marketing|hacks|ideas|finance)\b/i.test(normalized)) {
    return "business";
  }
  if (/\b(youtube|reel|instagram|content|caption|tiktok|scripts|video)\b/i.test(normalized)) {
    return "content";
  }
  if (/\b(ai|tech|automation|tools|future|intelligence|robotics)\b/i.test(normalized)) {
    return "ai";
  }
  
  return "trending"; 
}

/**
 * Dynamic trend fetching based on prompt intent
 */
export async function getTrendingByIntent(prompt = "") {
  const category = resolveCategoryFromPrompt(prompt);
  const subreddits = SUBREDDITS_BY_CATEGORY[category] || SUBREDDITS_BY_CATEGORY.trending;
  
  const results = await Promise.all(subreddits.map(async (sub) => {
    try {
      const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
        headers: { "User-Agent": "EtherStudio/1.0" },
        timeout: 5000
      });
      return (response.data?.data?.children || []).map(child => child.data.title);
    } catch { return []; }
  }));

  const allTitles = results.flat();
  return [...new Set(allTitles)]
    .filter(t => t && t.length >= 25)
    .filter(t => !t.toLowerCase().includes("[removed]") && !t.toLowerCase().includes("[deleted]"))
    .slice(0, 15);
}

/**
 * Fetch trending titles from Reddit
 */
export async function getRedditTrends() {
  try {
    const subreddits = ["news", "worldnews", "technology"];
    const results = await Promise.all(subreddits.map(async sub => {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
          headers: { "User-Agent": "EtherStudio/1.0" },
          timeout: 5000
        });
        return (response.data?.data?.children || []).map(child => ({ title: child.data.title, source: `r/${sub}` }));
      } catch { return []; }
    }));

    const all = results.flat().filter(p => p.title && p.title.length >= 20);
    const seen = new Set();
    const unique = [];
    for (const p of all) {
      if (!seen.has(p.title)) { seen.add(p.title); unique.push(p); }
    }
    return unique.slice(0, 30);
  } catch { return []; }
}

/**
 * Fetch trending news from GNews
 */
export async function getGNewsTrends(category = "technology") {
  try {
    if (!env.gnewsApiKey) return [];
    const response = await axios.get(GNEWS_API_URL, {
      params: { category, lang: "en", apikey: env.gnewsApiKey, max: 10 },
      timeout: 5000
    });
    const articles = response.data?.articles || [];
    return articles.map(a => ({ title: a.title, source: "News" }));
  } catch { return []; }
}

/**
 * Combined trends
 */
export async function getCombinedTrends() {
  const [reddit, news] = await Promise.all([getRedditTrends(), getGNewsTrends()]);
  const combined = [...reddit, ...news];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.slice(0, 15).map(item => item.title);
}
