/**
 * A resident's reservation of a facility for a specific date and time slot.
 */
import mongoose from "mongoose";

const facilityBookingSchema = new mongoose.Schema(
  {
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    // Time strings like "09:00" and "11:00" (not full timestamps)
    timeSlotStart: { type: String, required: true, trim: true },
    timeSlotEnd: { type: String, required: true, trim: true },
    // e.g. "Confirmed", "Cancelled"
    status: { type: String, required: true, trim: true },
  },
  { collection: "facilityBookings" }
);

facilityBookingSchema.index({ facilityId: 1, date: 1 });

export const FacilityBooking =
  mongoose.models.FacilityBooking ||
  mongoose.model("FacilityBooking", facilityBookingSchema);
