const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "studio-auth-token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getCurrentUser: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),
  getChats: () => request("/chat"),
  getChatById: (id) => request(`/chat/${id}`),
  saveChat: (payload) => request("/chat/save", { method: "POST", body: JSON.stringify(payload) }),
  deleteChat: (id) => request(`/chat/${id}`, { method: "DELETE" }),
  deleteAllChats: (userId) => request(`/chat/user/${userId}`, { method: "DELETE" }),
  getAnalytics: () => request("/analytics"),
  getPosts: () => request("/posts"),
  getDraftPosts: () => request("/posts/drafts"),
  getPostById: (id) => request(`/posts/${id}`),
  getScheduledPosts: () => request("/posts/scheduled"),
  createPost: (payload) => request("/posts", { method: "POST", body: JSON.stringify(payload) }),
  updatePost: (id, payload) => request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  getLinkedInAuthUrl: (redirectPath = "/create-post") =>
    request(`/auth/linkedin?redirectPath=${encodeURIComponent(redirectPath)}`),
  getLinkedInStatus: () => request("/auth/linkedin/status"),
  publishLinkedInPost: (payload) => request("/post/linkedin", { method: "POST", body: JSON.stringify(payload) }),
  generateAICaption: (payload) =>
    request("/ai/generate-caption", { method: "POST", body: JSON.stringify(payload) }),
  generateContent: (payload) =>
    payload instanceof FormData
      ? request("/generate-content", { method: "POST", body: payload })
      : request("/generate-content", { method: "POST", body: JSON.stringify(payload) }),
  generateImage: (payload) =>
    request("/generate-image", { method: "POST", body: JSON.stringify(payload) }),
  uploadImage: (payload) =>
    request("/upload-image", { method: "POST", body: payload }),
  getImages: () => request("/images"),
  toggleFavoriteImage: (id) => request(`/images/${id}/favorite`, { method: "PATCH" }),
  reorderImages: (items) =>
    request("/images/reorder", { method: "PATCH", body: JSON.stringify({ items }) }),
  deleteImage: (id) => request(`/images/${id}`, { method: "DELETE" }),
  chat: (payload) => request("/chat", { method: "POST", body: JSON.stringify(payload) }),
  schedulePost: (payload) =>
    request("/schedule-post", { method: "POST", body: JSON.stringify(payload) }),
  deleteScheduledPost: (id) => request(`/schedule-post/${id}`, { method: "DELETE" }),
  getTrends: (topic = "") => request(`/trends${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`)
};
