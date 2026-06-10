import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    billType: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true, trim: true },
  },
  { collection: "bills", timestamps: true }
);

billSchema.index({ unitId: 1, dueDate: -1 });

export const Bill =
  mongoose.models.Bill || mongoose.model("Bill", billSchema);
