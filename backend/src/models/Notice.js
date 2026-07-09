/**
 * A society-wide announcement posted by admin for residents to read.
 */
import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    // e.g. "High", "Normal" — helps residents spot urgent notices
    priority: { type: String, trim: true },
    postedAt: { type: Date, default: Date.now },
  },
  { collection: "notices" }
);

noticeSchema.index({ postedAt: -1 });

export const Notice =
  mongoose.models.Notice || mongoose.model("Notice", noticeSchema);
