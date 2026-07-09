/**
 * A person who can log into the housing society system — admin, resident,
 * accountant, or security guard.
 */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    // Stored hashed; excluded from normal queries for security
    passwordHash: { type: String, required: true, select: false },
    // Determines which dashboard and permissions the user gets
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Resident", "Accountant", "SecurityGuard"],
    },
    // Optional household info (e.g. family members living in the unit)
    familyDetails: { type: mongoose.Schema.Types.Mixed },
    // Optional vehicle details for gate access
    vehicleInfo: { type: mongoose.Schema.Types.Mixed },
    // Inactive users cannot sign in
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
