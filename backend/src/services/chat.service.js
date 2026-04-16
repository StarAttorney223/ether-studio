import { Chat } from "../models/Chat.js";

function buildChatTitle(messages = []) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim());
  const rawTitle = firstUserMessage?.content?.trim() || "New Chat";
  return rawTitle.length > 48 ? `${rawTitle.slice(0, 48)}...` : rawTitle;
}

export function normalizeChatResponse(chat) {
  return {
    id: chat._id,
    title: chat.title || buildChatTitle(chat.messages),
    messages: (chat.messages || []).map((message) => ({
      role: message.role,
      content: message.content
    })),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  };
}

export async function listChatsByUser(userId) {
  return Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function getChatById(chatId, userId) {
  return Chat.findOne({ _id: chatId, userId }).lean();
}

export async function saveChat({ chatId, userId, title, messages }) {
  const resolvedTitle = title?.trim() || buildChatTitle(messages);
  const payload = {
    userId,
    title: resolvedTitle,
    messages
  };

  if (chatId) {
    return Chat.findOneAndUpdate({ _id: chatId, userId }, payload, {
      new: true,
      runValidators: true
    }).lean();
  }

  return Chat.create(payload);
}
