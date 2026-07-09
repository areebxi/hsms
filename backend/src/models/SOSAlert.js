/**
 * Emergency distress signal raised by a resident.
 * Security guards respond and log acknowledgements in SOSResponse.
 */
import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Free-text location hint (unit, block, landmark)
    locationInfo: { type: String, trim: true },
    // e.g. "Active", "Acknowledged", "Resolved"
    status: { type: String, required: true, trim: true },
    // Contacts to notify alongside security (phone numbers, names)
    emergencyContacts: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: "sosAlerts", timestamps: true }
);

sosAlertSchema.index({ createdAt: -1 });

export const SOSAlert =
  mongoose.models.SOSAlert || mongoose.model("SOSAlert", sosAlertSchema);
