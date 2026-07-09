/**
 * Zod schemas for billing and payment API inputs.
 * Shared objectIdString ensures MongoDB ids are valid before database lookups.
 */
import mongoose from "mongoose";import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

/** Manual single-bill creation by Admin/Accountant. */
export const createBillBody = z.object({
  unitId: objectIdString,
  billType: z.string().trim().min(1),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
});

/** Partial bill update — at least one field required; paid bills rejected in service. */
export const patchBillBody = z
  .object({
    billType: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

/** Bulk bill run — optional unitIds; otherwise all Occupied units with monthlyCharges > 0. */
export const generateBillsBody = z.object({
  billType: z.string().trim().min(1),
  dueDate: z.coerce.date(),
  unitIds: z.array(objectIdString).optional(),
});

/** Bill list filters — Overdue is a virtual status resolved in the service layer. */
export const listBillsQuery = z.object({
  unitId: objectIdString.optional(),
  status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

/** UI-only gateway: billId + optional method label. No card/bank secrets. */
export const gatewayPaymentBody = z.object({
  billId: objectIdString,
  paymentMethod: z.enum(["Visa", "Mastercard", "NetBanking"]).optional(),
});

/** Resident payment list pagination. */
export const listPaymentsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

/** Notification inbox — unreadOnly defaults true unless explicitly set to "false". */
export const listNotificationsQuery = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
