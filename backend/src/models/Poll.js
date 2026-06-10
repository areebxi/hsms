import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
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

export const Poll =
  mongoose.models.Poll || mongoose.model("Poll", pollSchema);
