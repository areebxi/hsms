/**
 * Complaints, notices, and polls business logic.
 * Residents file complaints and vote; admins publish notices and manage complaint status.
 */
import crypto from "crypto";
import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { Complaint } from "../../models/Complaint.js";
import { Notice } from "../../models/Notice.js";
import { Poll } from "../../models/Poll.js";
import { Vote } from "../../models/Vote.js";
import { getCurrentUnitIdsForUser } from "../billingPayments/billing.service.js";

/** Human-readable ticket id for resident tracking (retries on rare collision). */
function generateTicketId() {
  return `TKT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function serializeNotice(doc, populated = false) {
  if (!doc) return null;
  const n = doc.toObject ? doc.toObject() : { ...doc };
  const id = n._id?.toString?.() ?? String(n._id);
  const out = {
    id,
    postedBy:
      n.postedBy?._id != null ? n.postedBy._id.toString() : String(n.postedBy),
    title: n.title,
    description: n.description,
    priority: n.priority,
    postedAt: n.postedAt,
  };
  if (populated && n.postedBy && typeof n.postedBy === "object" && n.postedBy.name) {
    out.authorName = n.postedBy.name;
    out.authorEmail = n.postedBy.email;
  }
  return out;
}

function serializeComplaint(doc, populated = false) {
  if (!doc) return null;
  const c = doc.toObject ? doc.toObject() : { ...doc };
  const id = c._id?.toString?.() ?? String(c._id);
  const out = {
    id,
    ticketId: c.ticketId,
    submittedBy:
      c.submittedBy?._id != null ? c.submittedBy._id.toString() : String(c.submittedBy),
    unitId: c.unitId?._id ? c.unitId._id.toString() : String(c.unitId),
    category: c.category,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
  if (populated && c.unitId && typeof c.unitId === "object" && c.unitId.unitNumber) {
    out.unit = {
      id: c.unitId._id.toString(),
      unitNumber: c.unitId.unitNumber,
      unitType: c.unitId.unitType,
    };
  }
  if (populated && c.submittedBy && typeof c.submittedBy === "object" && c.submittedBy.name) {
    out.submitterName = c.submittedBy.name;
    out.submitterEmail = c.submittedBy.email;
  }
  return out;
}

function serializePoll(doc, populated = false) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const id = p._id?.toString?.() ?? String(p._id);
  const out = {
    id,
    question: p.question,
    options: p.options,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    createdBy:
      p.createdBy?._id != null ? p.createdBy._id.toString() : String(p.createdBy),
  };
  if (populated && p.createdBy && typeof p.createdBy === "object" && p.createdBy.name) {
    out.creatorName = p.createdBy.name;
  }
  return out;
}

// --- Notices (admin-authored, readable by all authenticated users) ---

export async function listNotices(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    Notice.find()
      .populate("postedBy", "name email")
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notice.countDocuments(),
  ]);
  return { items: items.map((n) => serializeNotice(n, true)), total, limit, skip };
}

export async function createNotice(body, postedByUserId) {
  const notice = await Notice.create({
    postedBy: postedByUserId,
    title: body.title,
    description: body.description,
    priority: body.priority,
  });
  const populated = await Notice.findById(notice._id).populate("postedBy", "name email").lean();
  return serializeNotice(populated, true);
}

export async function getNotice(noticeId) {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new HttpError(400, "Invalid notice id");
  }
  const notice = await Notice.findById(noticeId).populate("postedBy", "name email").lean();
  if (!notice) throw new HttpError(404, "Notice not found");
  return serializeNotice(notice, true);
}

export async function patchNotice(noticeId, body) {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new HttpError(400, "Invalid notice id");
  }
  const notice = await Notice.findByIdAndUpdate(noticeId, { $set: body }, { new: true })
    .populate("postedBy", "name email")
    .lean();
  if (!notice) throw new HttpError(404, "Notice not found");
  return serializeNotice(notice, true);
}

export async function deleteNotice(noticeId) {
  if (!mongoose.Types.ObjectId.isValid(noticeId)) {
    throw new HttpError(400, "Invalid notice id");
  }
  const deleted = await Notice.findByIdAndDelete(noticeId);
  if (!deleted) throw new HttpError(404, "Notice not found");
  return { deleted: true };
}

// --- Complaints (residents submit; admins see all and update status) ---

export async function listComplaints(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (auth.role === "Resident") {
    filter.submittedBy = auth.userId;
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .populate("unitId", "unitNumber unitType")
      .populate("submittedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  return {
    items: items.map((c) => serializeComplaint(c, true)),
    total,
    limit,
    skip,
  };
}

/** Residents only — complaint must target one of the user's assigned units. */
export async function createComplaint(body, auth) {
  if (auth.role !== "Resident") {
    throw new HttpError(403, "Only residents may submit complaints");
  }
  const units = await getCurrentUnitIdsForUser(auth.userId);
  if (!units.includes(body.unitId)) {
    throw new HttpError(403, "You can only file complaints for your assigned units");
  }

  let ticketId = generateTicketId();
  for (let i = 0; i < 5; i++) {
    try {
      const complaint = await Complaint.create({
        ticketId,
        submittedBy: auth.userId,
        unitId: body.unitId,
        category: body.category,
        description: body.description,
        status: "Pending",
      });
      const populated = await Complaint.findById(complaint._id)
        .populate("unitId", "unitNumber unitType")
        .populate("submittedBy", "name email")
        .lean();
      return serializeComplaint(populated, true);
    } catch (err) {
      if (err.code === 11000) {
        ticketId = generateTicketId();
        continue;
      }
      throw err;
    }
  }
  throw new HttpError(500, "Could not allocate ticket id");
}

export async function getComplaint(complaintId, auth) {
  if (!mongoose.Types.ObjectId.isValid(complaintId)) {
    throw new HttpError(400, "Invalid complaint id");
  }
  const complaint = await Complaint.findById(complaintId)
    .populate("unitId", "unitNumber unitType")
    .populate("submittedBy", "name email")
    .lean();
  if (!complaint) throw new HttpError(404, "Complaint not found");

  if (auth.role === "Resident") {
    const uid = complaint.submittedBy._id?.toString?.() ?? String(complaint.submittedBy);
    if (uid !== auth.userId) {
      throw new HttpError(403, "Not allowed to view this complaint");
    }
  }

  return serializeComplaint(complaint, true);
}

/** Admin workflow: move complaint through Pending → In Progress → Resolved. */
export async function patchComplaintStatus(complaintId, body) {
  if (!mongoose.Types.ObjectId.isValid(complaintId)) {
    throw new HttpError(400, "Invalid complaint id");
  }
  const complaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { $set: { status: body.status } },
    { new: true }
  )
    .populate("unitId", "unitNumber unitType")
    .populate("submittedBy", "name email")
    .lean();
  if (!complaint) throw new HttpError(404, "Complaint not found");
  return serializeComplaint(complaint, true);
}

/**
 * Delete complaint — admins can remove any; residents only their own Pending ones.
 * Prevents residents from erasing complaints already being handled.
 */
export async function deleteComplaint(complaintId, auth) {
  if (!mongoose.Types.ObjectId.isValid(complaintId)) {
    throw new HttpError(400, "Invalid complaint id");
  }
  const complaint = await Complaint.findById(complaintId).lean();
  if (!complaint) throw new HttpError(404, "Complaint not found");

  if (auth.role === "Admin") {
    await Complaint.findByIdAndDelete(complaintId);
    return { deleted: true };
  }

  if (auth.role === "Resident") {
    const uid = String(complaint.submittedBy);
    if (uid !== auth.userId) {
      throw new HttpError(403, "Not allowed to delete this complaint");
    }
    if (complaint.status !== "Pending") {
      throw new HttpError(409, "Only pending complaints can be deleted");
    }
    await Complaint.findByIdAndDelete(complaintId);
    return { deleted: true };
  }

  throw new HttpError(403, "Insufficient permissions");
}

async function tallyVotes(pollId) {
  const pid =
    typeof pollId === "string" ? new mongoose.Types.ObjectId(pollId) : pollId;
  const agg = await Vote.aggregate([
    { $match: { pollId: pid } },
    { $group: { _id: "$selectedOption", count: { $sum: 1 } } },
  ]);
  const tally = {};
  for (const row of agg) {
    tally[row._id] = row.count;
  }
  return tally;
}

/** Whether voting is allowed: poll Open and current time within start/end window. */
function pollCanVote(poll, now = new Date()) {
  if (poll.status !== "Open") return false;
  const start = new Date(poll.startDate);
  const end = new Date(poll.endDate);
  return now >= start && now <= end;
}

// --- Polls & votes (admin creates; residents vote once per poll) ---

export async function listPolls(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Poll.find(filter)
      .populate("createdBy", "name email")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Poll.countDocuments(filter),
  ]);

  return {
    items: items.map((p) => serializePoll(p, true)),
    total,
    limit,
    skip,
  };
}

export async function createPoll(body, createdByUserId) {
  if (new Date(body.endDate) < new Date(body.startDate)) {
    throw new HttpError(400, "endDate must be on or after startDate");
  }
  const poll = await Poll.create({
    question: body.question,
    options: body.options,
    startDate: body.startDate,
    endDate: body.endDate,
    status: "Open",
    createdBy: createdByUserId,
  });
  const populated = await Poll.findById(poll._id).populate("createdBy", "name email").lean();
  return serializePoll(populated, true);
}

/** Poll detail with live tally, voting window, and the caller's vote if any. */
export async function getPoll(pollId, auth) {
  if (!mongoose.Types.ObjectId.isValid(pollId)) {
    throw new HttpError(400, "Invalid poll id");
  }
  const poll = await Poll.findById(pollId).populate("createdBy", "name email").lean();
  if (!poll) throw new HttpError(404, "Poll not found");

  const tally = await tallyVotes(poll._id);
  const totalVotes = Object.values(tally).reduce((a, b) => a + b, 0);

  let myVote = null;
  if (auth?.userId) {
    const v = await Vote.findOne({
      pollId: poll._id,
      votedBy: auth.userId,
    }).lean();
    if (v) myVote = { selectedOption: v.selectedOption };
  }

  const base = serializePoll(poll, true);
  const now = new Date();
  return {
    ...base,
    results: tally,
    totalVotes,
    canVote:
      auth?.role === "Resident" &&
      pollCanVote(poll, now) &&
      !myVote,
    myVote,
    votingOpen: pollCanVote(poll, now),
  };
}

export async function patchPoll(pollId, body) {
  if (!mongoose.Types.ObjectId.isValid(pollId)) {
    throw new HttpError(400, "Invalid poll id");
  }
  if (body.startDate && body.endDate && new Date(body.endDate) < new Date(body.startDate)) {
    throw new HttpError(400, "endDate must be on or after startDate");
  }
  const poll = await Poll.findByIdAndUpdate(pollId, { $set: body }, { new: true })
    .populate("createdBy", "name email")
    .lean();
  if (!poll) throw new HttpError(404, "Poll not found");
  return serializePoll(poll, true);
}

export async function deletePoll(pollId) {
  if (!mongoose.Types.ObjectId.isValid(pollId)) {
    throw new HttpError(400, "Invalid poll id");
  }
  const oid = new mongoose.Types.ObjectId(pollId);
  await Vote.deleteMany({ pollId: oid });
  const deleted = await Poll.findByIdAndDelete(pollId);
  if (!deleted) throw new HttpError(404, "Poll not found");
  return { deleted: true };
}

/** One vote per resident — duplicate key triggers a friendly conflict error. */
export async function castVote(body, auth) {
  if (auth.role !== "Resident") {
    throw new HttpError(403, "Only residents may vote");
  }

  const poll = await Poll.findById(body.pollId);
  if (!poll) throw new HttpError(404, "Poll not found");

  if (!pollCanVote(poll)) {
    throw new HttpError(409, "Poll is not open for voting");
  }

  if (!poll.options.includes(body.selectedOption)) {
    throw new HttpError(400, "selectedOption must match one of the poll options");
  }

  try {
    await Vote.create({
      pollId: poll._id,
      votedBy: auth.userId,
      selectedOption: body.selectedOption,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, "You have already voted on this poll");
    }
    throw err;
  }

  const tally = await tallyVotes(poll._id);
  const totalVotes = Object.values(tally).reduce((a, b) => a + b, 0);

  return {
    ok: true,
    pollId: poll._id.toString(),
    selectedOption: body.selectedOption,
    results: tally,
    totalVotes,
  };
}
