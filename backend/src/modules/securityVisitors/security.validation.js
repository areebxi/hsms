import mongoose from "mongoose";
import { z } from "zod";

import { optionalPkPhone } from "../../lib/pkPhone.js";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

export const createVisitorBody = z.object({
  name: z.string().trim().min(1),
  phone: optionalPkPhone,
  idProofType: z.string().trim().optional(),
  idProofNumber: z.string().trim().optional(),
});

export const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const createGuestApprovalBody = z.object({
  visitor: createVisitorBody,
  unitId: objectIdString,
  validDate: z.coerce.date(),
  status: z.enum(["Active", "Cancelled"]).optional(),
});

export const visitorLogCreateBody = z.object({
  visitorId: objectIdString.optional(),
  visitor: createVisitorBody.optional(),
  unitId: objectIdString,
  approvalId: objectIdString.optional().nullable(),
  purpose: z.string().trim().optional(),
  entryTime: z.coerce.date().optional(),
}).refine((b) => b.visitorId || b.visitor, {
  message: "Provide visitorId or visitor details",
});

export const visitorLogExitBody = z.object({
  exitTime: z.coerce.date().optional(),
});

export const gateEventBody = z.object({
  entityType: z.enum(["Staff", "Visitor", "Resident"]),
  entityId: z.string().trim().min(1),
  action: z.enum(["Approved", "Denied"]),
});

export const createStaffBody = z.object({
  name: z.string().trim().min(1),
  role: z.enum(["Maid", "Driver", "Vendor", "Other"]),
  phone: optionalPkPhone,
  assignedUnitId: objectIdString.optional().nullable(),
});

export const patchStaffBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    role: z.enum(["Maid", "Driver", "Vendor", "Other"]).optional(),
    phone: optionalPkPhone,
    assignedUnitId: objectIdString.optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const staffAttendanceInBody = z.object({
  staffId: objectIdString,
  entryTime: z.coerce.date().optional(),
  date: z.coerce.date().optional(),
});

export const staffAttendanceOutBody = z.object({
  exitTime: z.coerce.date().optional(),
});

export const sosCreateBody = z.object({
  locationInfo: z.string().trim().optional(),
  emergencyContacts: z.any().optional(),
});

export const listSOSQuery = listQuery.extend({
  status: z.string().optional(),
});

export const listPatrolQuery = listQuery.extend({
  mine: z.enum(["true", "false"]).optional(),
});

export const patrolLogBody = z.object({
  routeId: z.string().trim().min(1),
  checkpointId: z.string().trim().optional(),
});
