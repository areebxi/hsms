/**
 * A physical property in the society — apartment, villa, or plot.
 * Bills and ownership are tied to units, not directly to users.
 */
import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    unitNumber: { type: String, required: true, trim: true },
    unitType: {
      type: String,
      required: true,
      enum: ["Apartment", "Villa", "Plot"],
    },
    floor: { type: Number },
    // Base amount used when generating monthly maintenance bills
    monthlyCharges: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Occupied", "Vacant"],
      default: "Vacant",
    },
  },
  { collection: "units" }
);

unitSchema.index({ unitNumber: 1 }, { unique: true });

export const Unit =
  mongoose.models.Unit || mongoose.model("Unit", unitSchema);
