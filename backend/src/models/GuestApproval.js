/**
 * Pre-approval from a resident for an expected guest on a specific date.
 * Security checks this before allowing entry at the gate.
 */
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
    // Guest is only valid for entry on this calendar day
    validDate: { type: Date, required: true },
    // e.g. "Pending", "Approved", "Expired"
    status: { type: String, required: true, trim: true },
  },
  { collection: "guestApprovals" }
);

guestApprovalSchema.index({ unitId: 1, validDate: 1 });

export const GuestApproval =
  mongoose.models.GuestApproval ||
  mongoose.model("GuestApproval", guestApprovalSchema);
