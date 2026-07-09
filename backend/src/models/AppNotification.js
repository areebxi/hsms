/**
 * An in-app notification delivered to a specific user.
 * Created when something happens they should know about (bill due, SOS, etc.).
 */
import mongoose from "mongoose";

const appNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: { type: String, default: "app", trim: true },
    subject: { type: String, trim: true },
    // What triggered this notification (e.g. "bill.created", "sos.alert")
    event: { type: String, trim: true },
    // Extra details about the event (IDs, amounts, etc.)
    payload: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { collection: "appNotifications", timestamps: true }
);

appNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const AppNotification =
  mongoose.models.AppNotification ||
  mongoose.model("AppNotification", appNotificationSchema);
