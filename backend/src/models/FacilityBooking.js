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
    timeSlotStart: { type: String, required: true, trim: true },
    timeSlotEnd: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
  },
  { collection: "facilityBookings" }
);

facilityBookingSchema.index({ facilityId: 1, date: 1 });

export const FacilityBooking =
  mongoose.models.FacilityBooking ||
  mongoose.model("FacilityBooking", facilityBookingSchema);
