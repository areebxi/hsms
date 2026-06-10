import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, trim: true },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  { collection: "complaints", timestamps: true }
);

complaintSchema.index({ submittedBy: 1, createdAt: -1 });

export const Complaint =
  mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
