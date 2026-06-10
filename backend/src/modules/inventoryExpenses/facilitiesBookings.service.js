import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { Facility } from "../../models/Facility.js";
import { FacilityBooking } from "../../models/FacilityBooking.js";

function serializeFacility(doc) {
  if (!doc) return null;
  const x = doc.toObject ? doc.toObject() : { ...doc };
  const id = x._id?.toString?.() ?? String(x._id);
  return {
    id,
    name: x.name,
    type: x.type,
    capacity: x.capacity,
    status: x.status,
  };
}

function serializeBooking(doc, populated = false) {
  if (!doc) return null;
  const b = doc.toObject ? doc.toObject() : { ...doc };
  const id = b._id?.toString?.() ?? String(b._id);
  const out = {
    id,
    facilityId: b.facilityId?._id ? b.facilityId._id.toString() : String(b.facilityId),
    bookedBy: b.bookedBy?._id ? b.bookedBy._id.toString() : String(b.bookedBy),
    date: b.date,
    timeSlotStart: b.timeSlotStart,
    timeSlotEnd: b.timeSlotEnd,
    status: b.status,
  };
  if (populated && b.facilityId && typeof b.facilityId === "object" && b.facilityId.name) {
    out.facilityName = b.facilityId.name;
  }
  if (populated && b.bookedBy && typeof b.bookedBy === "object" && b.bookedBy.name) {
    out.bookedByName = b.bookedBy.name;
  }
  return out;
}

/** Normalize to UTC midnight for consistent same-day queries */
export function normalizeBookingDate(input) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function utcDayRange(input) {
  const day = normalizeBookingDate(input);
  const start = day.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { start: new Date(start), end: new Date(end) };
}

export function timeToMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
  if (!m) throw new HttpError(400, "Invalid time format");
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) throw new HttpError(400, "Invalid time");
  return h * 60 + min;
}

function intervalsOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

async function assertNoOverlap(facilityId, dateInput, startStr, endStr, excludeBookingId = null) {
  const { start, end } = utcDayRange(dateInput);
  const q = {
    facilityId,
    date: { $gte: start, $lt: end },
    status: { $ne: "Cancelled" },
  };
  if (excludeBookingId) {
    q._id = { $ne: excludeBookingId };
  }
  const existing = await FacilityBooking.find(q).select("timeSlotStart timeSlotEnd").lean();
  const ns = timeToMinutes(startStr);
  const ne = timeToMinutes(endStr);
  for (const row of existing) {
    const os = timeToMinutes(row.timeSlotStart);
    const oe = timeToMinutes(row.timeSlotEnd);
    if (intervalsOverlap(ns, ne, os, oe)) {
      throw new HttpError(409, "This time overlaps another booking for this facility");
    }
  }
}

export async function listFacilities(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.status) filter.status = query.status;
  else if (auth.role === "Resident") filter.status = "Active";

  const [items, total] = await Promise.all([
    Facility.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Facility.countDocuments(filter),
  ]);

  return { items: items.map(serializeFacility), total, limit, skip };
}

export async function createFacility(body) {
  const f = await Facility.create({
    name: body.name,
    type: body.type,
    capacity: body.capacity,
    status: body.status ?? "Active",
  });
  return serializeFacility(f.toObject());
}

export async function patchFacility(facilityId, body) {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) throw new HttpError(400, "Invalid facility id");
  const f = await Facility.findByIdAndUpdate(
    facilityId,
    { $set: body },
    { new: true, runValidators: true }
  ).lean();
  if (!f) throw new HttpError(404, "Facility not found");
  return serializeFacility(f);
}

export async function deleteFacility(facilityId) {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) throw new HttpError(400, "Invalid facility id");
  const n = await FacilityBooking.countDocuments({
    facilityId,
    status: { $ne: "Cancelled" },
  });
  if (n > 0) throw new HttpError(409, "Cannot delete facility with active bookings");
  const d = await Facility.findByIdAndDelete(facilityId);
  if (!d) throw new HttpError(404, "Facility not found");
  return { deleted: true, id: facilityId };
}

/** Confirmed / non-cancelled intervals on a day (for availability UI; no personal data). */
export async function listOccupiedSlots(facilityId, dateInput) {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) throw new HttpError(400, "Invalid facility id");
  const { start, end } = utcDayRange(dateInput);
  const rows = await FacilityBooking.find({
    facilityId,
    date: { $gte: start, $lt: end },
    status: { $ne: "Cancelled" },
  })
    .select("timeSlotStart timeSlotEnd")
    .sort({ timeSlotStart: 1 })
    .lean();

  return {
    facilityId,
    date: start,
    slots: rows.map((r) => ({
      timeSlotStart: r.timeSlotStart,
      timeSlotEnd: r.timeSlotEnd,
    })),
  };
}

export async function listBookings(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};

  if (auth.role === "Resident") {
    filter.bookedBy = auth.userId;
  }

  if (query.facilityId) filter.facilityId = query.facilityId;
  if (query.status) filter.status = query.status;

  if (query.date) {
    const { start, end } = utcDayRange(query.date);
    filter.date = { $gte: start, $lt: end };
  }

  const [items, total] = await Promise.all([
    FacilityBooking.find(filter)
      .populate("facilityId", "name")
      .populate("bookedBy", "name email")
      .sort({ date: -1, timeSlotStart: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FacilityBooking.countDocuments(filter),
  ]);

  return {
    items: items.map((b) => serializeBooking(b, true)),
    total,
    limit,
    skip,
  };
}

export async function createBooking(body, auth) {
  if (auth.role !== "Resident") throw new HttpError(403, "Only residents can create bookings");

  const facility = await Facility.findById(body.facilityId).lean();
  if (!facility) throw new HttpError(404, "Facility not found");
  if (facility.status !== "Active") throw new HttpError(400, "Facility is not available for booking");

  const dateNorm = normalizeBookingDate(body.date);
  await assertNoOverlap(body.facilityId, dateNorm, body.timeSlotStart, body.timeSlotEnd);

  const booking = await FacilityBooking.create({
    facilityId: body.facilityId,
    bookedBy: auth.userId,
    date: dateNorm,
    timeSlotStart: body.timeSlotStart.trim(),
    timeSlotEnd: body.timeSlotEnd.trim(),
    status: "Confirmed",
  });

  const populated = await FacilityBooking.findById(booking._id)
    .populate("facilityId", "name")
    .populate("bookedBy", "name email")
    .lean();

  return serializeBooking(populated, true);
}

export async function patchBooking(bookingId, body, auth) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new HttpError(400, "Invalid booking id");
  const b = await FacilityBooking.findById(bookingId).lean();
  if (!b) throw new HttpError(404, "Booking not found");

  const owner = String(b.bookedBy) === String(auth.userId);
  if (!owner && auth.role !== "Admin") throw new HttpError(403, "Not allowed");

  if (body.status === "Cancelled") {
    const updated = await FacilityBooking.findByIdAndUpdate(
      bookingId,
      { $set: { status: "Cancelled" } },
      { new: true }
    )
      .populate("facilityId", "name")
      .populate("bookedBy", "name email")
      .lean();
    return serializeBooking(updated, true);
  }

  throw new HttpError(400, "Unsupported update");
}
