/**
 * One guard's patrol walk along a route from start to finish.
 * Groups individual checkpoint scans in PatrolLog.
 */
import mongoose from "mongoose";

const patrolSessionSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeId: { type: String, required: true, trim: true },
    checkpointCount: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, default: Date.now },
    // Set when all checkpoints are scanned
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
  },
  { collection: "patrolSessions" }
);

patrolSessionSchema.index({ guardId: 1, status: 1 });
patrolSessionSchema.index({ guardId: 1, startedAt: -1 });

export const PatrolSession =
  mongoose.models.PatrolSession ||
  mongoose.model("PatrolSession", patrolSessionSchema);
