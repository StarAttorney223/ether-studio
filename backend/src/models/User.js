import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const User = mongoose.model("User", userSchema);
