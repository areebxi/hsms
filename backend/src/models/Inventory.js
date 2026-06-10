import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    condition: { type: String, trim: true },
    purchaseDate: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, trim: true },
  },
  { collection: "inventory" }
);

export const Inventory =
  mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
