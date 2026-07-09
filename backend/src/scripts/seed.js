/**
 * One-time bootstrap script — creates the default Admin user if none exists.
 * Run manually: `node src/scripts/seed.js` (requires MONGODB_URI).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../models/User.js";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[seed] MONGODB_URI is not set — cannot seed.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@hsms.local").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin already exists (${email}) — skipping.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name: "System Admin",
    email,
    passwordHash,
    role: "Admin",
    status: "Active",
  });

  console.log(`[seed] Created Admin user: ${email}`);
  console.log("[seed] Change SEED_ADMIN_PASSWORD in production.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
