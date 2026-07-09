/**
 * A shared amenity in the society — gym, community hall, pool, etc.
 * Residents book time slots via FacilityBooking.
 */
import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    capacity: { type: Number },
    // e.g. "Active", "Under Maintenance"
    status: { type: String, trim: true, default: "Active" },
  },
  { collection: "facilities" }
);

export const Facility =
  mongoose.models.Facility || mongoose.model("Facility", facilitySchema);
