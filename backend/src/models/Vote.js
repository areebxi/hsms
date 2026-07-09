/**
 * A resident's single answer to a poll.
 * Each user can vote only once per poll (enforced by unique index).
 */
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
    // Must match one of the poll's option strings
    selectedOption: { type: String, required: true, trim: true },
  },
  { collection: "votes" }
);

// One vote per resident per poll
voteSchema.index({ pollId: 1, votedBy: 1 }, { unique: true });

export const Vote =
  mongoose.models.Vote || mongoose.model("Vote", voteSchema);
