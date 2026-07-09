/**
 * Security operations: visitors, gate access, staff, SOS, and patrols.
 * Residents pre-approve guests; guards check visitors in/out and run patrol sessions.
 */
import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { recordGateEvent } from "../../integrations/gateAccessAdapter.js";
import { getCurrentUnitIdsForUser } from "../billingPayments/billing.service.js";
import { Visitor } from "../../models/Visitor.js";
import { GuestApproval } from "../../models/GuestApproval.js";
import { VisitorLog } from "../../models/VisitorLog.js";
import { GateAccessLog } from "../../models/GateAccessLog.js";
import { Staff } from "../../models/Staff.js";
import { StaffAttendance } from "../../models/StaffAttendance.js";
import { SOSAlert } from "../../models/SOSAlert.js";
import { SOSResponse } from "../../models/SOSResponse.js";
import { PatrolLog } from "../../models/PatrolLog.js";
import { PatrolRoute } from "../../models/PatrolRoute.js";
import { PatrolSession } from "../../models/PatrolSession.js";
import { User } from "../../models/User.js";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
}

function isSameCalendarDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function serializeVisitor(doc) {
  if (!doc) return null;
  const v = doc.toObject ? doc.toObject() : { ...doc };
  const id = v._id?.toString?.() ?? String(v._id);
  const { _id, __v, ...rest } = v;
  return { id, ...rest };
}

function serializeGuestApproval(doc, populated = false) {
  if (!doc) return null;
  const g = doc.toObject ? doc.toObject() : { ...doc };
  const id = g._id?.toString?.() ?? String(g._id);
  const out = {
    id,
    approvedBy: g.approvedBy?._id ? g.approvedBy._id.toString() : String(g.approvedBy),
    visitorId: g.visitorId?._id ? g.visitorId._id.toString() : String(g.visitorId),
    unitId: g.unitId?._id ? g.unitId._id.toString() : String(g.unitId),
    validDate: g.validDate,
    status: g.status,
  };
  if (populated && g.visitorId && typeof g.visitorId === "object" && g.visitorId.name) {
    out.visitor = serializeVisitor(g.visitorId);
  }
  if (populated && g.unitId && typeof g.unitId === "object" && g.unitId.unitNumber) {
    out.unit = { id: g.unitId._id.toString(), unitNumber: g.unitId.unitNumber };
  }
  return out;
}

function serializeVisitorLog(doc, populated = false) {
  if (!doc) return null;
  const l = doc.toObject ? doc.toObject() : { ...doc };
  const id = l._id?.toString?.() ?? String(l._id);
  const out = {
    id,
    visitorId: l.visitorId?._id ? l.visitorId._id.toString() : String(l.visitorId),
    unitId: l.unitId?._id ? l.unitId._id.toString() : String(l.unitId),
    loggedBy: l.loggedBy?._id ? l.loggedBy._id.toString() : String(l.loggedBy),
    entryTime: l.entryTime,
    exitTime: l.exitTime,
    approvalId: l.approvalId ? String(l.approvalId) : null,
    purpose: l.purpose,
  };
  if (populated && l.visitorId && typeof l.visitorId === "object" && l.visitorId.name) {
    out.visitor = serializeVisitor(l.visitorId);
  }
  if (populated && l.unitId && typeof l.unitId === "object" && l.unitId.unitNumber) {
    out.unit = { id: l.unitId._id.toString(), unitNumber: l.unitId.unitNumber };
  }
  return out;
}

function serializeGate(doc, entityName = null) {
  if (!doc) return null;
  const g = doc.toObject ? doc.toObject() : { ...doc };
  const id = g._id?.toString?.() ?? String(g._id);
  return {
    id,
    entityType: g.entityType,
    entityId: g.entityId,
    entityName: entityName ?? g.entityName ?? null,
    action: g.action,
    timestamp: g.timestamp,
    managedBy: g.managedBy?._id ? g.managedBy._id.toString() : String(g.managedBy),
  };
}

/** Resolve display name for gate log entries (visitor, staff, or resident). */
async function resolveGateEntity(entityType, entityId) {
  if (entityType === "Visitor") {
    const visitor = await Visitor.findById(entityId).lean();
    if (!visitor) throw new HttpError(404, "Visitor not found");
    return visitor.name;
  }
  if (entityType === "Staff") {
    const staff = await Staff.findById(entityId).lean();
    if (!staff) throw new HttpError(404, "Staff member not found");
    return `${staff.name} (${staff.role})`;
  }
  const resident = await User.findOne({ _id: entityId, role: "Resident" }).lean();
  if (!resident) throw new HttpError(404, "Resident not found");
  return resident.name;
}

async function enrichGateLogsWithNames(items) {
  const visitorIds = [];
  const staffIds = [];
  const residentIds = [];

  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.entityId)) continue;
    if (item.entityType === "Visitor") visitorIds.push(item.entityId);
    else if (item.entityType === "Staff") staffIds.push(item.entityId);
    else if (item.entityType === "Resident") residentIds.push(item.entityId);
  }

  const [visitors, staff, residents] = await Promise.all([
    visitorIds.length
      ? Visitor.find({ _id: { $in: visitorIds } })
          .select("name")
          .lean()
      : [],
    staffIds.length
      ? Staff.find({ _id: { $in: staffIds } })
          .select("name role")
          .lean()
      : [],
    residentIds.length
      ? User.find({ _id: { $in: residentIds }, role: "Resident" })
          .select("name")
          .lean()
      : [],
  ]);

  const nameByKey = new Map();
  for (const visitor of visitors) {
    nameByKey.set(`Visitor:${visitor._id}`, visitor.name);
  }
  for (const member of staff) {
    nameByKey.set(`Staff:${member._id}`, `${member.name} (${member.role})`);
  }
  for (const resident of residents) {
    nameByKey.set(`Resident:${resident._id}`, resident.name);
  }

  for (const item of items) {
    item.entityName =
      nameByKey.get(`${item.entityType}:${item.entityId}`) ?? item.entityId;
  }
}

function serializeStaff(doc) {
  if (!doc) return null;
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const id = s._id?.toString?.() ?? String(s._id);
  return {
    id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    assignedUnitId: s.assignedUnitId ? String(s.assignedUnitId) : null,
  };
}

function serializeAttendance(doc, populated = false) {
  if (!doc) return null;
  const a = doc.toObject ? doc.toObject() : { ...doc };
  const id = a._id?.toString?.() ?? String(a._id);
  const out = {
    id,
    staffId: a.staffId?._id ? a.staffId._id.toString() : String(a.staffId),
    entryTime: a.entryTime,
    exitTime: a.exitTime,
    recordedBy: a.recordedBy?._id ? a.recordedBy._id.toString() : String(a.recordedBy),
    date: a.date,
  };
  if (populated && a.staffId && typeof a.staffId === "object" && a.staffId.name) {
    out.staffName = a.staffId.name;
    out.staffRole = a.staffId.role;
  }
  return out;
}

function serializeSos(doc, populated = false) {
  if (!doc) return null;
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const id = s._id?.toString?.() ?? String(s._id);
  const out = {
    id,
    triggeredBy: s.triggeredBy?._id ? s.triggeredBy._id.toString() : String(s.triggeredBy),
    locationInfo: s.locationInfo,
    status: s.status,
    emergencyContacts: s.emergencyContacts,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  if (populated && s.triggeredBy && typeof s.triggeredBy === "object" && s.triggeredBy.name) {
    out.triggerName = s.triggeredBy.name;
    out.triggerEmail = s.triggeredBy.email;
    out.triggerPhone = s.triggeredBy.phone;
  }
  return out;
}

function serializePatrol(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const id = p._id?.toString?.() ?? String(p._id);
  return {
    id,
    guardId: p.guardId?._id ? p.guardId._id.toString() : String(p.guardId),
    sessionId: p.sessionId ? String(p.sessionId) : undefined,
    routeId: p.routeId,
    checkpointNumber: p.checkpointNumber,
    checkpointId: p.checkpointId,
    timestamp: p.timestamp,
  };
}

function serializePatrolRoute(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : { ...doc };
  const id = r._id?.toString?.() ?? String(r._id);
  return {
    id,
    routeId: r.routeId,
    checkpointCount: r.checkpointCount,
    createdBy: r.createdBy?._id
      ? r.createdBy._id.toString()
      : r.createdBy
        ? String(r.createdBy)
        : undefined,
  };
}

function serializePatrolSession(doc, checkpointsLogged = 0) {
  if (!doc) return null;
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const id = s._id?.toString?.() ?? String(s._id);
  return {
    id,
    guardId: s.guardId?._id ? s.guardId._id.toString() : String(s.guardId),
    routeId: s.routeId,
    checkpointCount: s.checkpointCount,
    checkpointsLogged,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    status: s.status,
  };
}

// --- Visitors & guest pre-approvals ---

export async function listVisitors(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    Visitor.find().sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Visitor.countDocuments(),
  ]);
  return { items: items.map(serializeVisitor), total, limit, skip };
}

export async function createVisitor(body) {
  const v = await Visitor.create(body);
  return serializeVisitor(v);
}

/** Residents see only their approvals; guards/admin see all. */
export async function listGuestApprovals(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (auth.role === "Resident") {
    filter.approvedBy = auth.userId;
  }
  if (query.status) filter.status = query.status;
  if (query.validDate) {
    filter.validDate = {
      $gte: startOfDay(query.validDate),
      $lt: endOfDay(query.validDate),
    };
  }

  const [items, total] = await Promise.all([
    GuestApproval.find(filter)
      .populate("visitorId")
      .populate("unitId", "unitNumber")
      .sort({ validDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GuestApproval.countDocuments(filter),
  ]);

  return {
    items: items.map((g) => serializeGuestApproval(g, true)),
    total,
    limit,
    skip,
  };
}

/** Resident pre-approves a guest for a specific unit and valid date. */
export async function createGuestApproval(body, auth) {
  if (auth.role !== "Resident") {
    throw new HttpError(403, "Only residents create guest pre-approvals");
  }
  const units = await getCurrentUnitIdsForUser(auth.userId);
  if (!units.includes(body.unitId)) {
    throw new HttpError(403, "Invalid unit for your account");
  }

  const visitor = await Visitor.create(body.visitor);
  const approval = await GuestApproval.create({
    approvedBy: auth.userId,
    visitorId: visitor._id,
    unitId: body.unitId,
    validDate: body.validDate,
    status: body.status ?? "Active",
  });

  const populated = await GuestApproval.findById(approval._id)
    .populate("visitorId")
    .populate("unitId", "unitNumber")
    .lean();

  return serializeGuestApproval(populated, true);
}

export async function listVisitorLogs(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    VisitorLog.find()
      .populate("visitorId")
      .populate("unitId", "unitNumber")
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VisitorLog.countDocuments(),
  ]);
  return {
    items: items.map((l) => serializeVisitorLog(l, true)),
    total,
    limit,
    skip,
  };
}

/**
 * Guard checks visitor in — either via active approval (marks Used) or walk-in with unit.
 * Records a gate event and prevents double check-in on the same approval.
 */
export async function createVisitorLog(body, auth) {
  let visitorId;
  let unitId;
  let approvalId = null;

  if (body.approvalId) {
    const approval = await GuestApproval.findById(body.approvalId).lean();
    if (!approval) throw new HttpError(404, "Guest approval not found");
    if (approval.status !== "Active") {
      throw new HttpError(409, "Guest approval is not active");
    }
    if (!isSameCalendarDay(approval.validDate, new Date())) {
      throw new HttpError(400, "Guest approval is not valid for today");
    }

    const openLog = await VisitorLog.findOne({
      approvalId: body.approvalId,
      exitTime: null,
    }).lean();
    if (openLog) {
      throw new HttpError(409, "Guest already checked in");
    }

    visitorId = approval.visitorId.toString();
    unitId = approval.unitId.toString();
    approvalId = body.approvalId;
  } else {
    visitorId = body.visitorId;
    if (body.visitor) {
      const v = await Visitor.create(body.visitor);
      visitorId = v._id.toString();
    }
    if (!visitorId) throw new HttpError(400, "visitorId required");
    if (!body.unitId) throw new HttpError(400, "unitId required");
    unitId = body.unitId;
  }

  const entryTime = body.entryTime ?? new Date();
  const log = await VisitorLog.create({
    visitorId,
    unitId,
    loggedBy: auth.userId,
    entryTime,
    exitTime: null,
    approvalId,
    purpose: body.purpose,
  });

  if (approvalId) {
    await GuestApproval.findByIdAndUpdate(approvalId, { $set: { status: "Used" } });
  }

  await recordGateEvent({
    entityType: "Visitor",
    entityId: visitorId,
    action: "Approved",
    managedBy: auth.userId,
  });

  const populated = await VisitorLog.findById(log._id)
    .populate("visitorId")
    .populate("unitId", "unitNumber")
    .lean();

  return serializeVisitorLog(populated, true);
}

/** Guard records visitor exit and logs a gate event. */
export async function exitVisitorLog(logId, body, auth) {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new HttpError(400, "Invalid log id");
  }
  const log = await VisitorLog.findById(logId);
  if (!log) throw new HttpError(404, "Visitor log not found");
  if (log.exitTime) {
    throw new HttpError(409, "Exit already recorded");
  }

  const exitTime = body.exitTime ?? new Date();
  const updated = await VisitorLog.findByIdAndUpdate(
    logId,
    { $set: { exitTime } },
    { new: true }
  )
    .populate("visitorId")
    .populate("unitId", "unitNumber")
    .lean();

  await recordGateEvent({
    entityType: "Visitor",
    entityId: log.visitorId.toString(),
    action: "Approved",
    managedBy: auth.userId,
  });

  return serializeVisitorLog(updated, true);
}

// --- Gate access log (staff, residents, visitors at the gate) ---

export async function listGateLogs(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    GateAccessLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GateAccessLog.countDocuments(),
  ]);
  const serialized = items.map((item) => serializeGate(item));
  await enrichGateLogsWithNames(serialized);
  return { items: serialized, total, limit, skip };
}

export async function createGateLog(body, auth) {
  const entityName = await resolveGateEntity(body.entityType, body.entityId);

  await recordGateEvent({
    entityType: body.entityType,
    entityId: body.entityId,
    action: body.action,
    managedBy: auth.userId,
  });

  const log = await GateAccessLog.create({
    entityType: body.entityType,
    entityId: body.entityId,
    action: body.action,
    managedBy: auth.userId,
    timestamp: new Date(),
  });

  return serializeGate(log, entityName);
}

// --- Staff roster & daily attendance ---

export async function listStaff(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    Staff.find().sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Staff.countDocuments(),
  ]);
  return { items: items.map(serializeStaff), total, limit, skip };
}

export async function createStaff(body) {
  const s = await Staff.create({
    name: body.name,
    role: body.role,
    phone: body.phone,
    assignedUnitId: body.assignedUnitId || null,
  });
  return serializeStaff(s);
}

export async function patchStaff(staffId, body) {
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new HttpError(400, "Invalid staff id");
  }
  const updates = { ...body };
  if (updates.assignedUnitId === null) updates.assignedUnitId = null;
  const s = await Staff.findByIdAndUpdate(staffId, { $set: updates }, { new: true }).lean();
  if (!s) throw new HttpError(404, "Staff not found");
  return serializeStaff(s);
}

export async function deleteStaff(staffId) {
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new HttpError(400, "Invalid staff id");
  }
  const d = await Staff.findByIdAndDelete(staffId);
  if (!d) throw new HttpError(404, "Staff not found");
  return { deleted: true };
}

export async function listStaffAttendance(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    StaffAttendance.find()
      .populate("staffId", "name role")
      .sort({ date: -1, entryTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StaffAttendance.countDocuments(),
  ]);
  return {
    items: items.map((a) => serializeAttendance(a, true)),
    total,
    limit,
    skip,
  };
}

/** One open check-in per staff per day — must check out before re-entry. */
export async function checkInStaff(body, auth) {
  const staff = await Staff.findById(body.staffId);
  if (!staff) throw new HttpError(404, "Staff not found");

  const entryTime = body.entryTime ?? new Date();
  const day = startOfDay(body.date ?? entryTime);

  const open = await StaffAttendance.findOne({
    staffId: body.staffId,
    date: day,
    exitTime: null,
  });
  if (open) {
    throw new HttpError(409, "Staff already checked in — check out first");
  }

  const att = await StaffAttendance.create({
    staffId: body.staffId,
    entryTime,
    exitTime: null,
    recordedBy: auth.userId,
    date: day,
  });

  const populated = await StaffAttendance.findById(att._id)
    .populate("staffId", "name role")
    .lean();

  return serializeAttendance(populated, true);
}

export async function checkOutStaff(attendanceId, body, auth) {
  if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
    throw new HttpError(400, "Invalid attendance id");
  }
  const att = await StaffAttendance.findById(attendanceId);
  if (!att) throw new HttpError(404, "Attendance record not found");
  if (att.exitTime) {
    throw new HttpError(409, "Already checked out");
  }

  const exitTime = body.exitTime ?? new Date();
  const updated = await StaffAttendance.findByIdAndUpdate(
    attendanceId,
    { $set: { exitTime } },
    { new: true }
  )
    .populate("staffId", "name role")
    .lean();

  await recordGateEvent({
    entityType: "Staff",
    entityId: att.staffId.toString(),
    action: "Approved",
    managedBy: auth.userId,
  });

  return serializeAttendance(updated, true);
}

// --- SOS alerts (resident triggers; guard acknowledges) ---

export async function listSOSAlerts(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.status) filter.status = query.status;
  if (auth.role === "Resident") {
    filter.triggeredBy = auth.userId;
  }

  const [items, total] = await Promise.all([
    SOSAlert.find(filter)
      .populate("triggeredBy", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SOSAlert.countDocuments(filter),
  ]);

  return {
    items: items.map((s) => serializeSos(s, true)),
    total,
    limit,
    skip,
  };
}

export async function createSOSAlert(body, auth) {
  if (auth.role !== "Resident") {
    throw new HttpError(403, "Only residents may trigger SOS");
  }

  const alert = await SOSAlert.create({
    triggeredBy: auth.userId,
    locationInfo: body.locationInfo,
    status: "Open",
    emergencyContacts: body.emergencyContacts,
  });

  const populated = await SOSAlert.findById(alert._id)
    .populate("triggeredBy", "name email")
    .lean();

  return serializeSos(populated, true);
}

/** Guard takes ownership of an open alert — creates SOSResponse and updates status. */
export async function acknowledgeSOS(alertId, auth) {
  if (!mongoose.Types.ObjectId.isValid(alertId)) {
    throw new HttpError(400, "Invalid alert id");
  }
  const alert = await SOSAlert.findById(alertId);
  if (!alert) throw new HttpError(404, "Alert not found");
  if (alert.status !== "Open") {
    throw new HttpError(409, "Alert is not open");
  }

  await SOSResponse.create({
    alertId: alert._id,
    guardId: auth.userId,
    acknowledgedAt: new Date(),
  });

  await SOSAlert.findByIdAndUpdate(alert._id, { $set: { status: "Acknowledged" } });

  const populated = await SOSAlert.findById(alert._id)
    .populate("triggeredBy", "name email")
    .lean();

  return serializeSos(populated, true);
}

// --- Patrol routes, sessions, and checkpoint logging ---

export async function listPatrolLogs(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.mine === "true") {
    filter.guardId = auth.userId;
  }

  const [items, total] = await Promise.all([
    PatrolLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PatrolLog.countDocuments(filter),
  ]);

  return {
    items: items.map(serializePatrol),
    total,
    limit,
    skip,
  };
}

export async function createPatrolLog(body, auth) {
  const log = await PatrolLog.create({
    guardId: auth.userId,
    routeId: body.routeId,
    checkpointId: body.checkpointId,
    timestamp: new Date(),
  });
  return serializePatrol(log);
}

export async function listPatrolRoutes(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    PatrolRoute.find().sort({ routeId: 1 }).skip(skip).limit(limit).lean(),
    PatrolRoute.countDocuments(),
  ]);
  return {
    items: items.map(serializePatrolRoute),
    total,
    limit,
    skip,
  };
}

export async function createPatrolRoute(body, auth) {
  const existing = await PatrolRoute.findOne({ routeId: body.routeId });
  if (existing) {
    throw new HttpError(409, "Route ID already exists");
  }
  const route = await PatrolRoute.create({
    routeId: body.routeId,
    checkpointCount: body.checkpointCount,
    createdBy: auth.userId,
  });
  return serializePatrolRoute(route);
}

async function countSessionCheckpoints(sessionId) {
  return PatrolLog.countDocuments({ sessionId });
}

export async function listPatrolSessions(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.mine === "true") {
    filter.guardId = auth.userId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    PatrolSession.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
    PatrolSession.countDocuments(filter),
  ]);

  const withCounts = await Promise.all(
    items.map(async (s) => {
      const checkpointsLogged = await countSessionCheckpoints(s._id);
      return serializePatrolSession(s, checkpointsLogged);
    })
  );

  return {
    items: withCounts,
    total,
    limit,
    skip,
  };
}

/** Start a route — one in_progress session per guard at a time. */
export async function startPatrolSession(body, auth) {
  const route = await PatrolRoute.findOne({ routeId: body.routeId });
  if (!route) {
    throw new HttpError(404, "Patrol route not found");
  }

  const open = await PatrolSession.findOne({
    guardId: auth.userId,
    status: "in_progress",
  });
  if (open) {
    throw new HttpError(409, "You already have an active patrol — complete it first");
  }

  const session = await PatrolSession.create({
    guardId: auth.userId,
    routeId: route.routeId,
    checkpointCount: route.checkpointCount,
    startedAt: new Date(),
    completedAt: null,
    status: "in_progress",
  });

  return serializePatrolSession(session, 0);
}

/** Guard logs next checkpoint — auto-numbered; capped at route checkpointCount. */
export async function logPatrolCheckpoint(sessionId, auth) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new HttpError(400, "Invalid session id");
  }

  const session = await PatrolSession.findById(sessionId);
  if (!session) {
    throw new HttpError(404, "Patrol session not found");
  }
  if (session.guardId.toString() !== auth.userId) {
    throw new HttpError(403, "Not your patrol session");
  }
  if (session.status === "completed") {
    throw new HttpError(409, "Patrol session already completed");
  }

  const checkpointsLogged = await countSessionCheckpoints(session._id);
  if (checkpointsLogged >= session.checkpointCount) {
    throw new HttpError(409, "All checkpoints already logged for this route");
  }

  const checkpointNumber = checkpointsLogged + 1;
  const log = await PatrolLog.create({
    guardId: auth.userId,
    sessionId: session._id,
    routeId: session.routeId,
    checkpointNumber,
    timestamp: new Date(),
  });

  return {
    log: serializePatrol(log),
    session: serializePatrolSession(session, checkpointNumber),
  };
}

/** End patrol — returns whether all required checkpoints were logged. */
export async function completePatrolSession(sessionId, auth) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new HttpError(400, "Invalid session id");
  }

  const session = await PatrolSession.findById(sessionId);
  if (!session) {
    throw new HttpError(404, "Patrol session not found");
  }
  if (session.guardId.toString() !== auth.userId) {
    throw new HttpError(403, "Not your patrol session");
  }
  if (session.status === "completed") {
    throw new HttpError(409, "Patrol session already completed");
  }

  const checkpointsLogged = await countSessionCheckpoints(session._id);
  const completedAt = new Date();
  const updated = await PatrolSession.findByIdAndUpdate(
    sessionId,
    { $set: { completedAt, status: "completed" } },
    { new: true }
  ).lean();

  const isComplete = checkpointsLogged >= session.checkpointCount;

  return {
    session: serializePatrolSession(updated, checkpointsLogged),
    checkpointsLogged,
    checkpointCount: session.checkpointCount,
    isComplete,
  };
}

export async function listPatrolSessionCheckpoints(sessionId, auth) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new HttpError(400, "Invalid session id");
  }

  const session = await PatrolSession.findById(sessionId);
  if (!session) {
    throw new HttpError(404, "Patrol session not found");
  }
  if (session.guardId.toString() !== auth.userId) {
    throw new HttpError(403, "Not your patrol session");
  }

  const logs = await PatrolLog.find({ sessionId })
    .sort({ checkpointNumber: 1 })
    .lean();

  return {
    items: logs.map(serializePatrol),
  };
}
