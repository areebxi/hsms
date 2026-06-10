import mongoose from "mongoose";

const patrolLogSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeId: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    checkpointId: { type: String, trim: true },
  },
  { collection: "patrolLogs" }
);

patrolLogSchema.index({ guardId: 1, timestamp: -1 });

export const PatrolLog =
  mongoose.models.PatrolLog || mongoose.model("PatrolLog", patrolLogSchema);
