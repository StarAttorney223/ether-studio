import {
  getChatById,
  listChatsByUser,
  normalizeChatResponse,
  saveChat
} from "../services/chat.service.js";

export async function listChatsController(req, res) {
  const chats = await listChatsByUser(req.user._id);
  return res.status(200).json({
    success: true,
    data: chats.map(normalizeChatResponse)
  });
}

export async function getChatByIdController(req, res) {
  const chat = await getChatById(req.params.id, req.user._id);

  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  return res.status(200).json({
    success: true,
    data: normalizeChatResponse(chat)
  });
}

export async function saveChatController(req, res) {
  const { chatId = null, title = "", messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: "messages must be an array" });
  }

  if (messages.length === 0) {
    return res.status(400).json({ success: false, message: "messages are required" });
  }

  const invalidMessage = messages.find(
    (message) =>
      !message ||
      !["user", "assistant"].includes(message.role) ||
      !String(message.content || "").trim()
  );

  if (invalidMessage) {
    return res.status(400).json({ success: false, message: "Each message must include a valid role and content" });
  }

  const chat = await saveChat({
    chatId,
    userId: req.user._id,
    title,
    messages: messages.map((message) => ({
      role: message.role,
      content: String(message.content).trim()
    }))
  });

  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  return res.status(chatId ? 200 : 201).json({
    success: true,
    data: normalizeChatResponse(chat)
  });
}
