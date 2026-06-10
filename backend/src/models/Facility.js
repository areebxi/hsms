import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    capacity: { type: Number },
    status: { type: String, trim: true, default: "Active" },
  },
  { collection: "facilities" }
);

export const Facility =
  mongoose.models.Facility || mongoose.model("Facility", facilitySchema);
