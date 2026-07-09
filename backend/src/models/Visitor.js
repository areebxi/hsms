/**
 * A person who visits the society.
 * Identity is stored here once; each visit is logged separately in VisitorLog.
 */
import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    // e.g. "CNIC", "Driving License"
    idProofType: { type: String, trim: true },
    idProofNumber: { type: String, trim: true },
  },
  { collection: "visitors" }
);

export const Visitor =
  mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);
