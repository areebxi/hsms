import mongoose from "mongoose";

const gateAccessLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ["Staff", "Visitor", "Resident"],
    },
    entityId: { type: String, required: true, trim: true },
    action: {
      type: String,
      required: true,
      enum: ["Approved", "Denied"],
    },
    timestamp: { type: Date, default: Date.now },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { collection: "gateAccessLogs" }
);

gateAccessLogSchema.index({ timestamp: -1 });

export const GateAccessLog =
  mongoose.models.GateAccessLog ||
  mongoose.model("GateAccessLog", gateAccessLogSchema);
