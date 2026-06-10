import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

export const createNoticeBody = z.object({
  title: z.string().trim().min(1),
  description: z.string().min(1),
  priority: z.string().trim().optional(),
});

export const patchNoticeBody = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().min(1).optional(),
    priority: z.string().trim().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const listNoticesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const createComplaintBody = z.object({
  unitId: objectIdString,
  category: z.string().trim().min(1),
  description: z.string().min(1),
});

export const patchComplaintBody = z.object({
  status: z.enum(["Pending", "In Progress", "Resolved"]),
});

export const listComplaintsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  status: z.enum(["Pending", "In Progress", "Resolved"]).optional(),
});

export const createPollBody = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const patchPollBody = z
  .object({
    question: z.string().trim().min(1).optional(),
    options: z.array(z.string().trim().min(1)).min(2).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.enum(["Open", "Closed"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const listPollsQuery = z.object({
  status: z.enum(["Open", "Closed", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const castVoteBody = z.object({
  pollId: objectIdString,
  selectedOption: z.string().trim().min(1),
});
