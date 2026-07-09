/**
 * A charge issued to a unit — maintenance, utilities, penalties, etc.
 * Residents pay bills through the Payment model.
 */
import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    // Usually the accountant who created the bill
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // e.g. "Maintenance", "Water", "Penalty"
    billType: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    // e.g. "Pending", "Paid", "Overdue"
    status: { type: String, required: true, trim: true },
  },
  { collection: "bills", timestamps: true }
);

billSchema.index({ unitId: 1, dueDate: -1 });

export const Bill =
  mongoose.models.Bill || mongoose.model("Bill", billSchema);
