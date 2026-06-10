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
    exitTime: { type: Date, default: null },
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
