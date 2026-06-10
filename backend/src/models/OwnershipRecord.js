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
    ownershipType: {
      type: String,
      required: true,
      enum: ["Owner", "Tenant"],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
  },
  { collection: "ownershipRecords" }
);

ownershipRecordSchema.index({ unitId: 1, userId: 1 });

export const OwnershipRecord =
  mongoose.models.OwnershipRecord ||
  mongoose.model("OwnershipRecord", ownershipRecordSchema);
