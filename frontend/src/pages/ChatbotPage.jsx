import { useEffect, useMemo, useRef, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const LAST_CHAT_KEY = "studio-last-chat-id";
const starterMessages = [
  {
    role: "assistant",
    content:
      "Hello Alex! I've analyzed your recent Instagram performance. Engagement is peaking on Tuesday mornings with video content."
  },
  {
    role: "user",
    content:
      "Let's focus on minimalist workspaces and AI productivity hacks. Include a CTA for newsletter signups."
  }
];

function buildChatTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim());
  const rawTitle = firstUserMessage?.content?.trim() || "New Chat";
  return rawTitle.length > 48 ? `${rawTitle.slice(0, 48)}...` : rawTitle;
}

function ChatbotPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState(starterMessages);
  const [chatId, setChatId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef(null);

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const response = await api.getChats();
      const incomingChats = response.data || [];
      setChats(incomingChats);

      const lastChatId = localStorage.getItem(LAST_CHAT_KEY);
      const preferredChatId = incomingChats.find((chat) => chat.id === lastChatId)?.id || incomingChats[0]?.id || null;

      if (preferredChatId) {
        await openChat(preferredChatId, incomingChats);
      } else {
        setMessages(starterMessages);
        setChatId(null);
      }
    } catch {
      setChats([]);
      setMessages(starterMessages);
      setChatId(null);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages, loading]);

  const sidebarChats = useMemo(() => chats, [chats]);

  const upsertChatInList = (savedChat) => {
    setChats((prev) => {
      const next = [savedChat, ...prev.filter((chat) => chat.id !== savedChat.id)];
      return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const persistConversation = async (nextMessages, existingChatId = chatId) => {
    const response = await api.saveChat({
      chatId: existingChatId,
      title: buildChatTitle(nextMessages),
      messages: nextMessages
    });

    const savedChat = response.data;
    upsertChatInList(savedChat);
    setChatId(savedChat.id);
    localStorage.setItem(LAST_CHAT_KEY, savedChat.id);
    return savedChat;
  };

  async function openChat(id, chatCollection = chats) {
    const existing = chatCollection.find((chat) => chat.id === id && Array.isArray(chat.messages) && chat.messages.length > 0);

    if (existing) {
      setMessages(existing.messages);
      setChatId(existing.id);
      localStorage.setItem(LAST_CHAT_KEY, existing.id);
      setIsSidebarOpen(false);
      return;
    }

    const response = await api.getChatById(id);
    const chat = response.data;
    setMessages(chat.messages || []);
    setChatId(chat.id);
    localStorage.setItem(LAST_CHAT_KEY, chat.id);
    upsertChatInList(chat);
    setIsSidebarOpen(false);
  }

  const newChat = () => {
    setMessages([]);
    setChatId(null);
    localStorage.removeItem(LAST_CHAT_KEY);
    setPrompt("");
    setIsSidebarOpen(false);
  };

  const activateChat = (nextChat) => {
    if (nextChat) {
      setMessages(nextChat.messages || []);
      setChatId(nextChat.id);
      localStorage.setItem(LAST_CHAT_KEY, nextChat.id);
      return;
    }

    setMessages([]);
    setChatId(null);
    localStorage.removeItem(LAST_CHAT_KEY);
  };

  const handleDeleteChat = async (id) => {
    if (!window.confirm("Delete this chat?")) {
      return;
    }

    const previousChats = chats;
    const previousChatId = chatId;
    const previousMessages = messages;
    const remainingChats = chats.filter((chat) => chat.id !== id);

    setChats(remainingChats);

    if (chatId === id) {
      activateChat(remainingChats[0] || null);
    }

    try {
      await api.deleteChat(id);
    } catch {
      setChats(previousChats);
      const restoredActiveChat = previousChats.find((chat) => chat.id === previousChatId) || null;
      if (restoredActiveChat) {
        activateChat(restoredActiveChat);
      } else {
        setMessages(previousMessages);
        setChatId(previousChatId);
      }
    }
  };

  const handleDeleteAllChats = async () => {
    if (!chats.length || !window.confirm("Delete all chats?")) {
      return;
    }

    const previousChats = chats;
    const previousChatId = chatId;
    const previousMessages = messages;
    setChats([]);
    activateChat(null);
    setPrompt("");

    try {
      await api.deleteAllChats(user?.id || "me");
    } catch {
      setChats(previousChats);
      const restoredActiveChat = previousChats.find((chat) => chat.id === previousChatId) || null;
      if (restoredActiveChat) {
        activateChat(restoredActiveChat);
      } else {
        setMessages(previousMessages);
        setChatId(previousChatId);
      }
    }
  };

  const sendMessage = async () => {
    if (!prompt.trim() || loading) return;

    const text = prompt.trim();
    const nextUserMessages = [...messages, { role: "user", content: text }];
    setPrompt("");
    setMessages(nextUserMessages);
    setLoading(true);

    try {
      const data = await api.chat({ message: text, context: "Social media strategy assistant" });
      const nextMessages = [...nextUserMessages, { role: "assistant", content: data.data?.reply || "No response" }];
      setMessages(nextMessages);
      await persistConversation(nextMessages);
    } catch (error) {
      const nextMessages = [...nextUserMessages, { role: "assistant", content: `Error: ${error.message}` }];
      setMessages(nextMessages);
      await persistConversation(nextMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 studio-animate-in">
      <div className="flex items-start gap-5">
        <ChatSidebar
          chats={sidebarChats}
          activeChatId={chatId}
          loading={loadingChats}
          isMobileOpen={isSidebarOpen}
          onToggleMobile={() => setIsSidebarOpen((prev) => !prev)}
          onNewChat={newChat}
          onOpenChat={openChat}
          onDeleteChat={handleDeleteChat}
          onDeleteAllChats={handleDeleteAllChats}
        />

        <div className="grid min-w-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="flex min-h-[84vh] flex-col rounded-[2rem] bg-white p-4 text-gray-900 shadow-soft dark:bg-gray-800 dark:text-white">
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {["Optimize Bio", "Content Calendar", "SEO Hashtags"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-gray-100 px-3 py-1.5 font-semibold text-studio-primary transition-all duration-300 hover:scale-105 dark:bg-gray-700"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div
              ref={scrollContainerRef}
              className="studio-scrollbar max-h-[68vh] min-h-[68vh] flex-1 space-y-4 overflow-y-auto pr-2"
            >
              {messages.length === 0 && (
                <div className="grid min-h-[50vh] place-items-center rounded-[2rem] border border-dashed border-slate-200 text-center dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Start a new conversation</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Ask for content strategy, captions, campaign ideas, or audience insights.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`max-w-[78%] break-words rounded-3xl px-4 py-3 text-[1.02rem] ${
                    msg.role === "assistant"
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "ml-auto bg-studio-primary text-white"
                  }`}
                >
                  <p className="whitespace-pre-line leading-7">{msg.content}</p>
                </div>
              ))}
              {loading && <p className="text-sm text-gray-600 dark:text-gray-300">Assistant is thinking...</p>}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
              <input
                className="h-10 flex-1 bg-transparent px-3 text-sm text-gray-900 outline-none dark:text-white"
                placeholder="Describe your content goal..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="h-10 rounded-full bg-studio-primary px-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
              >
                Send
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[2rem] bg-white p-4 shadow-soft dark:bg-gray-800">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-300">
                Context Awareness
              </h2>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">Active Brand Voice</p>
                  <p className="font-semibold text-studio-primary">Minimalist & Editorial</p>
                </div>
                <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">Target Platform</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Instagram / LinkedIn</p>
                </div>
                <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">Current Conversation</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{chatId ? buildChatTitle(messages) : "Unsaved draft chat"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-gradient-to-tr from-[#1a2446] to-[#0e1530] p-4 text-white shadow-soft">
              <h3 className="text-xl font-semibold">Upgrade to Ultra</h3>
              <p className="mt-2 text-sm text-white/80">
                Unlock unlimited creative generation with free-tier AI routing support.
              </p>
              <button className="mt-4 h-10 w-full rounded-full bg-white text-sm font-semibold text-[#20283a]">
                Go Premium
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
