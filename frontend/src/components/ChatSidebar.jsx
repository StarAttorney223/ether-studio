import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";

function ChatSidebar({
  chats,
  activeChatId,
  loading,
  isMobileOpen,
  onToggleMobile,
  onNewChat,
  onOpenChat
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
          <button
            onClick={onNewChat}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-studio-primary px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:scale-[1.01]"
          >
            <MessageSquarePlus size={16} />
            New Chat
          </button>

          <div className="studio-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
            {loading && Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-gray-600" />
              </div>
            ))}

            {!loading &&
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onOpenChat(chat.id)}
                    className={`w-full rounded-2xl p-3 text-left transition-colors ${
                    activeChatId === chat.id
                      ? "border border-studio-primary bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-white"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  <p className="truncate text-sm font-semibold">{chat.title || "New Chat"}</p>
                  <p
                    className={`mt-1 text-xs ${
                      activeChatId === chat.id ? "text-gray-600 dark:text-white/80" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric"
                    })}
                  </p>
                </button>
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
