import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

export const listInventoryQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export const createInventoryBody = z.object({
  itemName: z.string().trim().min(1),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  condition: z.string().trim().optional(),
  purchaseDate: z.coerce.date().optional(),
  status: z.string().trim().optional(),
});

export const patchInventoryBody = z
  .object({
    itemName: z.string().trim().min(1).optional(),
    category: z.string().trim().optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    condition: z.string().trim().optional(),
    purchaseDate: z.union([z.null(), z.coerce.date()]).optional(),
    status: z.string().trim().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });
