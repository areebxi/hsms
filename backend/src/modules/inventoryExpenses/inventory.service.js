import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { Inventory } from "../../models/Inventory.js";

function serializeInventory(doc, populated = false) {
  if (!doc) return null;
  const x = doc.toObject ? doc.toObject() : { ...doc };
  const id = x._id?.toString?.() ?? String(x._id);
  const out = {
    id,
    itemName: x.itemName,
    category: x.category,
    quantity: x.quantity,
    condition: x.condition,
    purchaseDate: x.purchaseDate,
    lastUpdated: x.lastUpdated,
    managedBy: x.managedBy?._id ? x.managedBy._id.toString() : String(x.managedBy),
    status: x.status,
  };
  if (populated && x.managedBy && typeof x.managedBy === "object" && x.managedBy.name) {
    out.managerName = x.managedBy.name;
  }
  return out;
}

export async function listInventory(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  }
  if (query.q) {
    const r = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ itemName: r }, { category: r }, { condition: r }, { status: r }];
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate("managedBy", "name")
      .sort({ itemName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  return { items: items.map((row) => serializeInventory(row, true)), total, limit, skip };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createInventory(body, managedByUserId) {
  const row = await Inventory.create({
    itemName: body.itemName,
    category: body.category,
    quantity: body.quantity ?? 0,
    condition: body.condition,
    purchaseDate: body.purchaseDate,
    status: body.status,
    managedBy: managedByUserId,
    lastUpdated: new Date(),
  });
  const populated = await Inventory.findById(row._id).populate("managedBy", "name").lean();
  return serializeInventory(populated, true);
}

export async function getInventory(itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) throw new HttpError(400, "Invalid item id");
  const row = await Inventory.findById(itemId).populate("managedBy", "name").lean();
  if (!row) throw new HttpError(404, "Item not found");
  return serializeInventory(row, true);
}

export async function patchInventory(itemId, body) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) throw new HttpError(400, "Invalid item id");
  const updates = { ...body, lastUpdated: new Date() };
  const row = await Inventory.findByIdAndUpdate(itemId, { $set: updates }, { new: true })
    .populate("managedBy", "name")
    .lean();
  if (!row) throw new HttpError(404, "Item not found");
  return serializeInventory(row, true);
}

export async function deleteInventory(itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) throw new HttpError(400, "Invalid item id");
  const d = await Inventory.findByIdAndDelete(itemId);
  if (!d) throw new HttpError(404, "Item not found");
  return { deleted: true, id: itemId };
}
