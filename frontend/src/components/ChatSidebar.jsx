import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Trash2 } from "lucide-react";

function ChatSidebar({
  chats,
  activeChatId,
  loading,
  isMobileOpen,
  onToggleMobile,
  onNewChat,
  onOpenChat,
  onDeleteChat,
  onDeleteAllChats
}) {
  return (
    <>
      <button
        onClick={onToggleMobile}
        className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-soft dark:bg-gray-800 dark:text-white lg:hidden"
      >
        {isMobileOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        Chats
      </button>

      <aside
        className={`${
          isMobileOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 lg:translate-x-0 lg:opacity-100"
        } fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200 bg-white p-4 shadow-soft transition-all duration-300 dark:border-gray-700 dark:bg-gray-900 lg:static lg:h-auto lg:translate-x-0 lg:rounded-[2rem] lg:border lg:opacity-100`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4 space-y-2">
            <button
              onClick={onNewChat}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-studio-primary px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:scale-[1.01]"
            >
              <MessageSquarePlus size={16} />
              New Chat
            </button>
            <button
              type="button"
              onClick={onDeleteAllChats}
              disabled={loading || chats.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Delete All Chats
            </button>
          </div>

          <div className="studio-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
            {loading && Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
              </div>
            ))}

            {!loading &&
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-start gap-2 rounded-2xl p-2 transition-colors ${
                    activeChatId === chat.id
                      ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-purple-900/20"
                      : "bg-gray-100 text-gray-900 hover:bg-purple-500/20 dark:bg-gray-700 dark:text-white dark:hover:bg-purple-500/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpenChat(chat.id)}
                    className="min-w-0 flex-1 rounded-xl px-2 py-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold">{chat.title || "New Chat"}</p>
                    <p
                      className={`mt-1 text-xs ${
                        activeChatId === chat.id ? "text-white/80" : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChat(chat.id)}
                    className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      activeChatId === chat.id
                        ? "bg-white/15 text-white hover:bg-white/25"
                        : "text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:text-red-300 dark:hover:bg-red-500/20 dark:hover:text-red-200"
                    }`}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

            {!loading && chats.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                No chats yet. Start a new conversation.
              </div>
            )}
          </div>
        </div>
      </aside>

      {isMobileOpen && (
        <button
          onClick={onToggleMobile}
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Close chats sidebar"
        />
      )}
    </>
  );
}

export default ChatSidebar;
