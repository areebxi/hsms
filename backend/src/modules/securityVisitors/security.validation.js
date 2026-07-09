/**
 * Zod schemas for security module API inputs.
 * Visitor log supports either approval-based check-in or walk-in with unit + visitor details.
 */
import mongoose from "mongoose";
import { z } from "zod";

import { optionalPkPhone } from "../../lib/pkPhone.js";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

/** Walk-in or catalog visitor record at the gate. */
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

export const guestApprovalStatusEnum = z.enum(["Active", "Cancelled", "Used"]);

export const listGuestApprovalsQuery = listQuery.extend({
  status: guestApprovalStatusEnum.optional(),
  validDate: z.coerce.date().optional(),
});

/** Resident pre-approval — creates visitor + approval for a single valid date. */
export const createGuestApprovalBody = z.object({
  visitor: createVisitorBody,
  unitId: objectIdString,
  validDate: z.coerce.date(),
  status: z.enum(["Active", "Cancelled"]).optional(),
});

/**
 * Check-in payload — approvalId alone is enough; otherwise unitId + visitor required.
 * Enforced via superRefine so guards can use either workflow.
 */
export const visitorLogCreateBody = z
  .object({
    visitorId: objectIdString.optional(),
    visitor: createVisitorBody.optional(),
    unitId: objectIdString.optional(),
    approvalId: objectIdString.optional().nullable(),
    purpose: z.string().trim().optional(),
    entryTime: z.coerce.date().optional(),
  })
  .superRefine((b, ctx) => {
    if (b.approvalId) return;
    if (!b.unitId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "unitId required",
        path: ["unitId"],
      });
    }
    if (!b.visitorId && !b.visitor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide visitorId or visitor details",
        path: ["visitor"],
      });
    }
  });

export const visitorLogExitBody = z.object({
  exitTime: z.coerce.date().optional(),
});

/** Manual gate event (approve/deny) for staff, visitors, or residents. */
export const gateEventBody = z.object({
  entityType: z.enum(["Staff", "Visitor", "Resident"]),
  entityId: objectIdString,
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

/** Resident SOS — rate-limited at route level to prevent abuse. */
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

/** Admin-defined patrol route template (checkpoint count for session progress). */
export const createPatrolRouteBody = z.object({
  routeId: z.string().trim().min(1),
  checkpointCount: z.coerce.number().int().min(1).max(100),
});

export const listPatrolSessionsQuery = listQuery.extend({
  mine: z.enum(["true", "false"]).optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
});

export const startPatrolSessionBody = z.object({
  routeId: z.string().trim().min(1),
});
