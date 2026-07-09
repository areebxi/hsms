/**
 * Helper workers who regularly enter the society — maids, drivers, vendors, etc.
 * Often assigned to a specific unit.
 */
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["Maid", "Driver", "Vendor", "Other"],
    },
    phone: { type: String, trim: true },
    // Unit this person primarily serves; null if society-wide
    assignedUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },
  },
  { collection: "staff" }
);

export const Staff =
  mongoose.models.Staff || mongoose.model("Staff", staffSchema);
