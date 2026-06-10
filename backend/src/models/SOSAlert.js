import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    locationInfo: { type: String, trim: true },
    status: { type: String, required: true, trim: true },
    emergencyContacts: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: "sosAlerts", timestamps: true }
);

sosAlertSchema.index({ createdAt: -1 });

export const SOSAlert =
  mongoose.models.SOSAlert || mongoose.model("SOSAlert", sosAlertSchema);
