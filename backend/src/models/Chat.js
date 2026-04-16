import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, default: "New Chat" },
    messages: { type: [chatMessageSchema], default: [] }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Chat = mongoose.model("Chat", chatSchema);
