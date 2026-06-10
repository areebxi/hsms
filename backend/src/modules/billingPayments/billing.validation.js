import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

export const createBillBody = z.object({
  unitId: objectIdString,
  billType: z.string().trim().min(1),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
});

export const patchBillBody = z
  .object({
    billType: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const generateBillsBody = z.object({
  billType: z.string().trim().min(1),
  dueDate: z.coerce.date(),
  unitIds: z.array(objectIdString).optional(),
});

export const listBillsQuery = z.object({
  unitId: objectIdString.optional(),
  status: z.enum(["Pending", "Paid", "Overdue"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

function normalizeCardDigits(s) {
  return String(s).replace(/\s/g, "").replace(/\D/g, "");
}

function passesLuhn(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits.charAt(i), 10);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const cardPaymentBody = z.object({
  billId: objectIdString,
  cardNumber: z
    .string()
    .min(1)
    .transform((s) => normalizeCardDigits(s))
    .pipe(
      z
        .string()
        .regex(/^\d{13,19}$/, "Card number must be 13 to 19 digits")
        .refine(passesLuhn, { message: "Invalid card number" })
    ),
});

export const listPaymentsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
