/**
 * A single checkpoint scan during a security patrol.
 * Each log entry proves the guard reached a specific point on the route.
 */
import mongoose from "mongoose";

const patrolLogSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Links this scan to an active patrol session when applicable
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatrolSession",
    },
    routeId: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    // Position along the route (1 = first checkpoint)
    checkpointNumber: { type: Number, min: 1 },
    // QR or NFC tag identifier at the physical checkpoint
    checkpointId: { type: String, trim: true },
  },
  { collection: "patrolLogs" }
);

patrolLogSchema.index({ guardId: 1, timestamp: -1 });
patrolLogSchema.index({ sessionId: 1, checkpointNumber: 1 });

export const PatrolLog =
  mongoose.models.PatrolLog || mongoose.model("PatrolLog", patrolLogSchema);
