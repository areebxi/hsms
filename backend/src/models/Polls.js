/**
 * A society vote or survey created by admin.
 * Residents submit answers via the Vote model.
 */
import mongoose from "mongoose";

const pollsSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // Closed polls no longer accept votes
    status: {
      type: String,
      required: true,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { collection: "polls" }
);

export const Polls =
  mongoose.models.Polls || mongoose.model("Polls", pollsSchema);
