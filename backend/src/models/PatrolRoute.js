/**
 * A defined security patrol path with a fixed number of checkpoints.
 * Guards follow routes during scheduled patrols.
 */
import mongoose from "mongoose";

const patrolRouteSchema = new mongoose.Schema(
  {
    // Human-readable route code (e.g. "ROUTE-A")
    routeId: { type: String, required: true, trim: true, unique: true },
    // How many checkpoints the guard must scan on this route
    checkpointCount: { type: Number, required: true, min: 1 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { collection: "patrolRoutes" }
);

patrolRouteSchema.index({ routeId: 1 }, { unique: true });

export const PatrolRoute =
  mongoose.models.PatrolRoute || mongoose.model("PatrolRoute", patrolRouteSchema);
