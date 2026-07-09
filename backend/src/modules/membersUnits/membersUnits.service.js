/**
 * Members, units, and ownership records — core society directory data.
 * Ownership changes drive unit Occupied/Vacant status; user deletion has safety guards.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { HttpError } from "../../lib/httpError.js";
import { User } from "../../models/User.js";
import { Unit } from "../../models/Unit.js";
import { OwnershipRecord } from "../../models/OwnershipRecord.js";
import { Complaint } from "../../models/Complaint.js";
import { Vote } from "../../models/Vote.js";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeUser(doc) {
  if (!doc) return null;
  const u = doc.toObject ? doc.toObject() : { ...doc };
  delete u.passwordHash;
  const id = u._id?.toString?.() ?? String(u._id);
  const { _id, __v, ...rest } = u;
  return { id, ...rest };
}

function serializeUnit(doc) {
  if (!doc) return null;
  const x = doc.toObject ? doc.toObject() : { ...doc };
  const id = x._id?.toString?.() ?? String(x._id);
  const { _id, __v, ...rest } = x;
  return { id, ...rest };
}

function serializeOwnership(doc, populated = false) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : { ...doc };
  const id = r._id?.toString?.() ?? String(r._id);
  const out = {
    id,
    unitId: r.unitId?._id ? r.unitId._id.toString() : r.unitId?.toString?.() ?? String(r.unitId),
    userId: r.userId?._id ? r.userId._id.toString() : r.userId?.toString?.() ?? String(r.userId),
    ownershipType: r.ownershipType,
    startDate: r.startDate,
    endDate: r.endDate ?? null,
  };
  if (populated && r.unitId && typeof r.unitId === "object" && r.unitId.unitNumber) {
    out.unit = serializeUnit(r.unitId);
  }
  if (populated && r.userId && typeof r.userId === "object" && r.userId.email) {
    out.user = serializeUser(r.userId);
  }
  return out;
}

// --- Users (admin-managed accounts for all roles) ---

export async function listUsers(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.q && query.q.length > 0) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return {
    items: items.map((u) => serializeUser(u)),
    total,
    limit,
    skip,
  };
}

export async function createUser(body) {
  const email = body.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await User.create({
    name: body.name.trim(),
    email,
    phone: body.phone?.trim(),
    passwordHash,
    role: body.role,
    familyDetails: body.familyDetails,
    vehicleInfo: body.vehicleInfo,
    status: body.status ?? "Active",
  });
  return serializeUser(user);
}

export async function getUserById(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new HttpError(400, "Invalid user id");
  }
  const user = await User.findById(userId).lean();
  if (!user) throw new HttpError(404, "User not found");
  return serializeUser(user);
}

export async function updateUser(userId, body) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new HttpError(400, "Invalid user id");
  }
  const updates = { ...body };
  if (updates.email) {
    updates.email = updates.email.toLowerCase().trim();
    const clash = await User.findOne({
      email: updates.email,
      _id: { $ne: userId },
    });
    if (clash) throw new HttpError(409, "Email already in use");
  }
  if (updates.password) {
    updates.passwordHash = await bcrypt.hash(updates.password, 12);
    delete updates.password;
  }
  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).lean();
  if (!user) throw new HttpError(404, "User not found");
  return serializeUser(user);
}

/**
 * Remove user — blocked if last admin, self-delete, or linked ownership/complaints exist.
 * Preserves data integrity for billing and complaint history.
 */
export async function deleteUser(userId, auth) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new HttpError(400, "Invalid user id");
  }
  if (userId === auth.userId) {
    throw new HttpError(403, "You cannot delete your own account");
  }

  const target = await User.findById(userId).lean();
  if (!target) throw new HttpError(404, "User not found");

  if (target.role === "Admin") {
    const adminCount = await User.countDocuments({ role: "Admin" });
    if (adminCount <= 1) {
      throw new HttpError(409, "Cannot delete the only administrator account");
    }
  }

  const oid = new mongoose.Types.ObjectId(userId);
  if (await OwnershipRecord.exists({ userId: oid })) {
    throw new HttpError(409, "Cannot delete a user who has ownership or tenancy records");
  }
  if (await Complaint.exists({ submittedBy: oid })) {
    throw new HttpError(409, "Cannot delete a user who has submitted complaints");
  }

  await Vote.deleteMany({ votedBy: oid });
  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) throw new HttpError(404, "User not found");
  return { deleted: true };
}

// --- Units (physical properties with monthly charge defaults for billing) ---

export async function listUnits(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Unit.find(filter).sort({ unitNumber: 1 }).skip(skip).limit(limit).lean(),
    Unit.countDocuments(filter),
  ]);
  return { items: items.map(serializeUnit), total, limit, skip };
}

export async function createUnit(body) {
  try {
    const unit = await Unit.create({
      unitNumber: body.unitNumber.trim(),
      unitType: body.unitType,
      floor: body.floor,
      monthlyCharges: body.monthlyCharges ?? 0,
      status: body.status ?? "Vacant",
    });
    return serializeUnit(unit);
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, "Unit number already exists");
    }
    throw err;
  }
}

export async function getUnitById(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new HttpError(400, "Invalid unit id");
  }
  const unit = await Unit.findById(unitId).lean();
  if (!unit) throw new HttpError(404, "Unit not found");
  return serializeUnit(unit);
}

export async function updateUnit(unitId, body) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new HttpError(400, "Invalid unit id");
  }
  const updates = { ...body };
  if (updates.unitNumber) updates.unitNumber = updates.unitNumber.trim();
  try {
    const unit = await Unit.findByIdAndUpdate(unitId, { $set: updates }, { new: true }).lean();
    if (!unit) throw new HttpError(404, "Unit not found");
    return serializeUnit(unit);
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, "Unit number already exists");
    }
    throw err;
  }
}

/** Cannot delete units with ownership history — audit trail must be preserved. */
export async function deleteUnit(unitId) {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new HttpError(400, "Invalid unit id");
  }
  const count = await OwnershipRecord.countDocuments({ unitId });
  if (count > 0) {
    throw new HttpError(
      409,
      "Cannot delete a unit that has ownership history — retain the unit or remove ownership records after export if policy allows"
    );
  }
  const deleted = await Unit.findByIdAndDelete(unitId);
  if (!deleted) throw new HttpError(404, "Unit not found");
  return { deleted: true };
}

/** Units linked to the resident via current ownership (complaints, resident UX). */
export async function listResidentUnits(userId) {
  const oid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const rows = await OwnershipRecord.find({
    userId: oid,
    endDate: null,
  })
    .select("unitId")
    .lean();
  const ids = rows.map((r) => r.unitId);
  if (!ids.length) return { items: [] };
  const units = await Unit.find({ _id: { $in: ids } }).sort({ unitNumber: 1 }).lean();
  return { items: units.map(serializeUnit) };
}

/** Keep unit.status in sync when ownership records are added, ended, or removed. */
async function syncUnitOccupancy(unitId) {
  const oid =
    typeof unitId === "string" ? new mongoose.Types.ObjectId(unitId) : unitId;
  const active = await OwnershipRecord.exists({
    unitId: oid,
    endDate: null,
  });
  await Unit.findByIdAndUpdate(oid, {
    status: active ? "Occupied" : "Vacant",
  });
}

// --- Ownership records (link residents to units; drives billing and complaints) ---

export async function listOwnershipRecords(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.unitId) filter.unitId = query.unitId;
  if (query.userId) filter.userId = query.userId;
  if (query.currentOnly === "true") {
    filter.endDate = null;
  }

  const [items, total] = await Promise.all([
    OwnershipRecord.find(filter)
      .populate("unitId")
      .populate("userId", "-passwordHash")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OwnershipRecord.countDocuments(filter),
  ]);

  return {
    items: items.map((r) => serializeOwnership(r, true)),
    total,
    limit,
    skip,
  };
}

export async function createOwnershipRecord(body) {
  const unit = await Unit.findById(body.unitId);
  if (!unit) throw new HttpError(404, "Unit not found");
  const user = await User.findById(body.userId);
  if (!user) throw new HttpError(404, "User not found");

  const endDate = body.endDate === undefined ? null : body.endDate;
  if (endDate && endDate < body.startDate) {
    throw new HttpError(400, "endDate cannot be before startDate");
  }

  const record = await OwnershipRecord.create({
    unitId: body.unitId,
    userId: body.userId,
    ownershipType: body.ownershipType,
    startDate: body.startDate,
    endDate,
  });

  await syncUnitOccupancy(body.unitId);

  const populated = await OwnershipRecord.findById(record._id)
    .populate("unitId")
    .populate("userId", "-passwordHash")
    .lean();

  return serializeOwnership(populated, true);
}

export async function getOwnershipRecord(recordId) {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    throw new HttpError(400, "Invalid record id");
  }
  const record = await OwnershipRecord.findById(recordId)
    .populate("unitId")
    .populate("userId", "-passwordHash")
    .lean();
  if (!record) throw new HttpError(404, "Ownership record not found");
  return serializeOwnership(record, true);
}

export async function updateOwnershipRecord(recordId, body) {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    throw new HttpError(400, "Invalid record id");
  }
  const existing = await OwnershipRecord.findById(recordId);
  if (!existing) throw new HttpError(404, "Ownership record not found");
  const originalUnitId = existing.unitId;

  const updates = {};
  if (body.unitId !== undefined) {
    const unit = await Unit.findById(body.unitId).select("_id").lean();
    if (!unit) throw new HttpError(404, "Unit not found");
    updates.unitId = body.unitId;
  }
  if (body.userId !== undefined) {
    const user = await User.findById(body.userId).select("_id").lean();
    if (!user) throw new HttpError(404, "User not found");
    updates.userId = body.userId;
  }
  if (body.ownershipType !== undefined) updates.ownershipType = body.ownershipType;
  if (body.startDate !== undefined) updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate;

  if (updates.startDate && updates.endDate === undefined && existing.endDate) {
    /* ok */
  }
  const nextStart = updates.startDate ?? existing.startDate;
  const nextEnd =
    updates.endDate !== undefined ? updates.endDate : existing.endDate;
  if (nextEnd && nextStart && nextEnd < nextStart) {
    throw new HttpError(400, "endDate cannot be before startDate");
  }

  await OwnershipRecord.findByIdAndUpdate(recordId, { $set: updates });

  await syncUnitOccupancy(originalUnitId);
  const nextUnitId = updates.unitId ?? existing.unitId;
  if (String(nextUnitId) !== String(originalUnitId)) {
    await syncUnitOccupancy(nextUnitId);
  }

  const populated = await OwnershipRecord.findById(recordId)
    .populate("unitId")
    .populate("userId", "-passwordHash")
    .lean();

  return serializeOwnership(populated, true);
}

export async function deleteOwnershipRecord(recordId) {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    throw new HttpError(400, "Invalid record id");
  }
  const existing = await OwnershipRecord.findById(recordId);
  if (!existing) throw new HttpError(404, "Ownership record not found");
  const unitId = existing.unitId;
  await OwnershipRecord.findByIdAndDelete(recordId);
  await syncUnitOccupancy(unitId);
  return { deleted: true };
}
