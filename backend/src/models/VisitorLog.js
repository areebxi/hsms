/**
 * Record of a visitor entering and leaving the society.
 * Created by security at the gate.
 */
import mongoose from "mongoose";

const visitorLogSchema = new mongoose.Schema(
  {
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entryTime: { type: Date, required: true },
    // null means the visitor is still inside the society
    exitTime: { type: Date, default: null },
    // Set when entry was backed by a pre-approved guest pass
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuestApproval",
      default: null,
    },
    purpose: { type: String, trim: true },
  },
  { collection: "visitorLogs" }
);

visitorLogSchema.index({ entryTime: -1 });

export const VisitorLog =
  mongoose.models.VisitorLog || mongoose.model("VisitorLog", visitorLogSchema);
