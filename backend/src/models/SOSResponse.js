/**
 * Records when a security guard acknowledges an SOS alert.
 * Multiple guards may respond to the same alert.
 */
import mongoose from "mongoose";

const sosResponseSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SOSAlert",
      required: true,
    },
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // When the guard confirmed they are handling the alert
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { collection: "sosResponses" }
);

sosResponseSchema.index({ alertId: 1 });

export const SOSResponse =
  mongoose.models.SOSResponse ||
  mongoose.model("SOSResponse", sosResponseSchema);
