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
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Resident", "Accountant", "SecurityGuard"],
    },
    familyDetails: { type: mongoose.Schema.Types.Mixed },
    vehicleInfo: { type: mongoose.Schema.Types.Mixed },
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
