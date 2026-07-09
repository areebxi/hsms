/**
 * Zod schemas for users, units, and ownership records.
 * Includes nested family/vehicle structures for resident profiles.
 */
import mongoose from "mongoose";
import { z } from "zod";

import { optionalPkPhone } from "../../lib/pkPhone.js";

export const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid id" });

const roleEnum = z.enum(["Admin", "Resident", "Accountant", "SecurityGuard"]);
const statusEnum = z.enum(["Active", "Inactive"]);

const emptyToUndef = (val) => {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  return s === "" ? undefined : s;
};

export const familyMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  relationship: z.string().trim().min(1).max(80),
  age: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().int().min(0).max(120).optional()
    )
    .optional(),
  phone: optionalPkPhone,
});

/** Nested family members on user create/update (gate pass, emergency contact). */
export const familyDetailsSchema = z.object({
  members: z.array(familyMemberSchema).max(20),
});

export const vehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1).max(32),
  makeModel: z.preprocess(emptyToUndef, z.string().max(120).optional()),
  color: z.preprocess(emptyToUndef, z.string().max(40).optional()),
});

/** Registered vehicles for gate and parking workflows. */
export const vehicleInfoSchema = z.object({
  vehicles: z.array(vehicleSchema).max(10),
});

/** Admin user search — role and status filters for directory management. */
export const listUsersQuery = z.object({
  q: z.string().trim().optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

/** New society member — password hashed in service; default role Resident. */
export const createUserBody = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: optionalPkPhone,
  password: z.string().min(8),
  role: roleEnum.default("Resident"),
  familyDetails: familyDetailsSchema.optional(),
  vehicleInfo: vehicleInfoSchema.optional(),
  status: statusEnum.optional(),
});

export const patchUserBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phone: optionalPkPhone,
    password: z.string().min(8).optional(),
    role: roleEnum.optional(),
    familyDetails: familyDetailsSchema.optional(),
    vehicleInfo: vehicleInfoSchema.optional(),
    status: statusEnum.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

export const listUnitsQuery = z.object({
  status: z.enum(["Occupied", "Vacant"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const createUnitBody = z.object({
  unitNumber: z.string().trim().min(1),
  unitType: z.enum(["Apartment", "Villa", "Plot"]),
  floor: z.number().optional(),
  monthlyCharges: z.number().min(0).optional(),
  status: z.enum(["Occupied", "Vacant"]).optional(),
});

export const patchUnitBody = z
  .object({
    unitNumber: z.string().trim().min(1).optional(),
    unitType: z.enum(["Apartment", "Villa", "Plot"]).optional(),
    floor: z.number().optional(),
    monthlyCharges: z.number().min(0).optional(),
    status: z.enum(["Occupied", "Vacant"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

/** Ownership history filter — currentOnly=true shows active tenancies only. */
export const listOwnershipQuery = z.object({
  unitId: objectIdString.optional(),
  userId: objectIdString.optional(),
  currentOnly: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

/** Assign resident to unit — endDate null means current occupancy. */
export const createOwnershipBody = z.object({
  unitId: objectIdString,
  userId: objectIdString,
  ownershipType: z.enum(["Owner", "Tenant"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const patchOwnershipBody = z
  .object({
    unitId: objectIdString.optional(),
    userId: objectIdString.optional(),
    ownershipType: z.enum(["Owner", "Tenant"]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });
