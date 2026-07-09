/**
 * Complaints, notices, and polls HTTP routes.
 * Notices and polls are admin-managed; complaints and votes are resident-facing.
 */
import { Router } from "express";

import { authenticateJwt, requireDb, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as svc from "./communication.service.js";
import * as val from "./communication.validation.js";

const router = Router();

const anyAuth = [requireDb, authenticateJwt];
const adminOnly = [requireDb, authenticateJwt, requireRoles("Admin")];
const residentOnly = [requireDb, authenticateJwt, requireRoles("Resident")];

// --- Notices (read: all; write: admin) ---

router.get(
  "/notices",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    const query = val.listNoticesQuery.parse(req.query);
    const result = await svc.listNotices(query);
    res.json(result);
  })
);

router.post(
  "/notices",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = val.createNoticeBody.parse(req.body);
    const notice = await svc.createNotice(body, req.auth.userId);
    res.status(201).json(notice);
  })
);

router.get(
  "/notices/:noticeId",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.noticeId);
    const notice = await svc.getNotice(req.params.noticeId);
    res.json(notice);
  })
);

router.patch(
  "/notices/:noticeId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.noticeId);
    const body = val.patchNoticeBody.parse(req.body);
    const notice = await svc.patchNotice(req.params.noticeId, body);
    res.json(notice);
  })
);

router.delete(
  "/notices/:noticeId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.noticeId);
    const result = await svc.deleteNotice(req.params.noticeId);
    res.json(result);
  })
);

// --- Complaints (residents submit; admin updates status; delete rules in service) ---

router.get(
  "/complaints",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    const query = val.listComplaintsQuery.parse(req.query);
    const result = await svc.listComplaints(query, req.auth);
    res.json(result);
  })
);

router.post(
  "/complaints",
  ...residentOnly,
  asyncHandler(async (req, res) => {
    const body = val.createComplaintBody.parse(req.body);
    const complaint = await svc.createComplaint(body, req.auth);
    res.status(201).json(complaint);
  })
);

router.get(
  "/complaints/:complaintId",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.complaintId);
    const complaint = await svc.getComplaint(req.params.complaintId, req.auth);
    res.json(complaint);
  })
);

router.patch(
  "/complaints/:complaintId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.complaintId);
    const body = val.patchComplaintBody.parse(req.body);
    const complaint = await svc.patchComplaintStatus(req.params.complaintId, body);
    res.json(complaint);
  })
);

router.delete(
  "/complaints/:complaintId",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.complaintId);
    const result = await svc.deleteComplaint(req.params.complaintId, req.auth);
    res.json(result);
  })
);

// --- Polls & votes (admin manages polls; residents vote) ---

router.get(
  "/polls",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    const query = val.listPollsQuery.parse(req.query);
    const result = await svc.listPolls(query);
    res.json(result);
  })
);

router.post(
  "/polls",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = val.createPollBody.parse(req.body);
    const poll = await svc.createPoll(body, req.auth.userId);
    res.status(201).json(poll);
  })
);

router.get(
  "/polls/:pollId",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.pollId);
    const poll = await svc.getPoll(req.params.pollId, req.auth);
    res.json(poll);
  })
);

router.patch(
  "/polls/:pollId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.pollId);
    const body = val.patchPollBody.parse(req.body);
    const poll = await svc.patchPoll(req.params.pollId, body);
    res.json(poll);
  })
);

router.delete(
  "/polls/:pollId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.pollId);
    const result = await svc.deletePoll(req.params.pollId);
    res.json(result);
  })
);

router.post(
  "/votes",
  ...residentOnly,
  asyncHandler(async (req, res) => {
    const body = val.castVoteBody.parse(req.body);
    const result = await svc.castVote(body, req.auth);
    res.status(201).json(result);
  })
);

export default router;
