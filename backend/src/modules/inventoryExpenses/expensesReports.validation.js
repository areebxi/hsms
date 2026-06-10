import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

export const listExpensesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createExpenseBody = z.object({
  category: z.string().trim().min(1),
  amount: z.number().positive(),
  expenseDate: z.coerce.date(),
  description: z.string().trim().optional(),
});

export const patchExpenseBody = z
  .object({
    category: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    expenseDate: z.coerce.date().optional(),
    description: z.string().trim().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const generateReportBody = z.object({
  reportType: z.enum(["Income", "Expense", "BalanceSheet", "Defaulters"]),
  dateRangeStart: z.coerce.date(),
  dateRangeEnd: z.coerce.date(),
});

export const listReportsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
