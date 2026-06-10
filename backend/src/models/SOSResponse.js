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
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { collection: "sosResponses" }
);

sosResponseSchema.index({ alertId: 1 });

export const SOSResponse =
  mongoose.models.SOSResponse ||
  mongoose.model("SOSResponse", sosResponseSchema);
