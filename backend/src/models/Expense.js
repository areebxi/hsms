/**
 * Money spent by the society on operations — repairs, salaries, utilities, etc.
 * Separate from resident bills and payments.
 */
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, trim: true },
  },
  { collection: "expenses" }
);

expenseSchema.index({ expenseDate: -1 });

export const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
