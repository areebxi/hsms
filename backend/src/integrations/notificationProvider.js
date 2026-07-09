/**
 * Notification delivery layer — email/SMS are logged only; app channel writes to the DB.
 */
import mongoose from "mongoose";

import { AppNotification } from "../models/AppNotification.js";

/**
 * In-app / email / SMS delivery abstraction.
 * - **channel `app`:** `to` is the **user id** (Resident) who should see the item in the app (in production: push or in-app feed).
 * - **channel `email` / `sms`:** `to` is the address/number.
 */
export async function sendNotification({ channel, to, subject, body }) {
  console.log("[notifications:stub]", { channel, to, subject, body });

  // Only the in-app channel persists today; email/SMS would plug in at this boundary.
  if (channel === "app" && to && mongoose.Types.ObjectId.isValid(to)) {
    let payload = body;
    let event;
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        payload = parsed;
        event = parsed.event;
      } catch {
        payload = { message: body };
      }
    } else if (body && typeof body === "object") {
      event = body.event;
    }

    await AppNotification.create({
      userId: to,
      channel: "app",
      subject,
      event,
      payload,
      read: false,
    });
  }

  return { delivered: true, channel, to };
}
