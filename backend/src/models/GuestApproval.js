import mongoose from "mongoose";

const guestApprovalSchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    validDate: { type: Date, required: true },
    status: { type: String, required: true, trim: true },
  },
  { collection: "guestApprovals" }
);

guestApprovalSchema.index({ unitId: 1, validDate: 1 });

export const GuestApproval =
  mongoose.models.GuestApproval ||
  mongoose.model("GuestApproval", guestApprovalSchema);
