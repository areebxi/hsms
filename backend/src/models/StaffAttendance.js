/**
 * Daily check-in and check-out records for society staff at the gate.
 */
import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    entryTime: { type: Date, required: true },
    // null means the staff member has not left yet today
    exitTime: { type: Date, default: null },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Calendar day this attendance row belongs to
    date: { type: Date, required: true },
  },
  { collection: "staffAttendance" }
);

staffAttendanceSchema.index({ staffId: 1, date: -1 });

export const StaffAttendance =
  mongoose.models.StaffAttendance ||
  mongoose.model("StaffAttendance", staffAttendanceSchema);
