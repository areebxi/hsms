/**
 * Links a resident to a unit they own or rent.
 * Tracks who lives where and for how long.
 */
import mongoose from "mongoose";

const ownershipRecordSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Owner = property holder; Tenant = renter
    ownershipType: {
      type: String,
      required: true,
      enum: ["Owner", "Tenant"],
    },
    startDate: { type: Date, required: true },
    // null means the person still occupies the unit
    endDate: { type: Date, default: null },
  },
  { collection: "ownershipRecords" }
);

ownershipRecordSchema.index({ unitId: 1, userId: 1 });

export const OwnershipRecord =
  mongoose.models.OwnershipRecord ||
  mongoose.model("OwnershipRecord", ownershipRecordSchema);
