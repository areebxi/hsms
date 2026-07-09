/**
 * Records money received against a bill.
 * Each bill can have at most one payment (enforced by unique index).
 */
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountPaid: { type: Number, required: true },
    // e.g. "Cash", "Bank Transfer", "Online"
    paymentMethod: { type: String, required: true, trim: true },
    // External reference from bank or payment gateway
    transactionRef: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
  },
  { collection: "payments" }
);

paymentSchema.index({ billId: 1 }, { unique: true });

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
