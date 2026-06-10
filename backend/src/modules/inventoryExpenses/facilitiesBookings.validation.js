import mongoose from "mongoose";
import { z } from "zod";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

/** HH:mm (24h), start strictly before end when paired in booking body */
export const timeSlotString = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, { message: "Use HH:mm (24h)" });

export const listFacilitiesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  status: z.enum(["Active", "Maintenance", "Closed"]).optional(),
});

export const createFacilityBody = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(["Active", "Maintenance", "Closed"]).optional(),
});

export const patchFacilityBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    type: z.string().trim().optional(),
    capacity: z.coerce.number().int().positive().optional(),
    status: z.enum(["Active", "Maintenance", "Closed"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const listBookingsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  facilityId: objectIdString.optional(),
  /** YYYY-MM-DD or ISO — filters bookings on that calendar day (UTC) */
  date: z.coerce.date().optional(),
  status: z.enum(["Confirmed", "Cancelled"]).optional(),
});

export const createBookingBody = z
  .object({
    facilityId: objectIdString,
    date: z.coerce.date(),
    timeSlotStart: timeSlotString,
    timeSlotEnd: timeSlotString,
  })
  .refine(
    (b) => {
      const [sh, sm] = b.timeSlotStart.split(":").map(Number);
      const [eh, em] = b.timeSlotEnd.split(":").map(Number);
      return sh * 60 + sm < eh * 60 + em;
    },
    { message: "timeSlotEnd must be after timeSlotStart", path: ["timeSlotEnd"] }
  );

export const occupiedSlotsQuery = z.object({
  date: z.coerce.date(),
});
