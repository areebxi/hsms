/**
 * In-app / email / SMS delivery abstraction.
 * - **channel `app`:** `to` is the **user id** (Resident) who should see the item in the app (in production: push or in-app feed).
 * - **channel `email` / `sms`:** `to` is the address/number.
 */
export async function sendNotification({ channel, to, subject, body }) {
  console.log("[notifications:stub]", { channel, to, subject, body });
  return { delivered: true, channel, to };
}
