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
    priority: { type: String, trim: true },
    postedAt: { type: Date, default: Date.now },
  },
  { collection: "notices" }
);

noticeSchema.index({ postedAt: -1 });

export const Notice =
  mongoose.models.Notice || mongoose.model("Notice", noticeSchema);
