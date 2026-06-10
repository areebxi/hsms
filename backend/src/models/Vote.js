import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },
    votedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    selectedOption: { type: String, required: true, trim: true },
  },
  { collection: "votes" }
);

voteSchema.index({ pollId: 1, votedBy: 1 }, { unique: true });

export const Vote =
  mongoose.models.Vote || mongoose.model("Vote", voteSchema);
