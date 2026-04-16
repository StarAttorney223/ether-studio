import mongoose from "mongoose";

const generatedContentSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    platform: { type: String, required: true },
    tone: { type: String, required: true },
    caption: { type: String, required: true }
  },
  { timestamps: true }
);

export const GeneratedContent = mongoose.model("GeneratedContent", generatedContentSchema);
