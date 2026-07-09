/**
 * Security module HTTP routes: visitors, gate, staff, SOS, and patrols.
 * SecurityGuard + Admin operate the gate; residents pre-approve guests and trigger SOS.
 */
import { Router } from "express";

import { authenticateJwt, requireDb, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as svc from "./security.service.js";
import * as val from "./security.validation.js";
import { sosPostRateLimiter } from "../../middleware/rateLimits.js";

const router = Router();

/** Any authenticated user (resident reads own approvals; security/admin see per service). */
const authn = [requireDb, authenticateJwt];
const securityTeam = [requireDb, authenticateJwt, requireRoles("SecurityGuard", "Admin")];
const adminOnly = [requireDb, authenticateJwt, requireRoles("Admin")];
const residentOnly = [requireDb, authenticateJwt, requireRoles("Resident")];
const sosReaders = [requireDb, authenticateJwt, requireRoles("Resident", "SecurityGuard", "Admin")];

// --- Visitors & guest pre-approvals ---

router.get(
  "/visitors",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listVisitors(q));
  })
);

router.post(
  "/visitors",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.createVisitorBody.parse(req.body);
    const v = await svc.createVisitor(body);
    res.status(201).json(v);
  })
);

router.get(
  "/guest-approvals",
  ...authn,
  asyncHandler(async (req, res) => {
    const q = val.listGuestApprovalsQuery.parse(req.query);
    res.json(await svc.listGuestApprovals(q, req.auth));
  })
);

router.post(
  "/guest-approvals",
  ...residentOnly,
  asyncHandler(async (req, res) => {
    const body = val.createGuestApprovalBody.parse(req.body);
    const g = await svc.createGuestApproval(body, req.auth);
    res.status(201).json(g);
  })
);

// --- Visitor check-in/out logs (security team) ---

router.get(
  "/visitor-logs",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listVisitorLogs(q));
  })
);

router.post(
  "/visitor-logs",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.visitorLogCreateBody.parse(req.body);
    const log = await svc.createVisitorLog(body, req.auth);
    res.status(201).json(log);
  })
);

router.patch(
  "/visitor-logs/:logId",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.logId);
    const body = val.visitorLogExitBody.parse(req.body);
    const log = await svc.exitVisitorLog(req.params.logId, body, req.auth);
    res.json(log);
  })
);

// --- Gate access events ---

router.get(
  "/gate-access",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listGateLogs(q));
  })
);

router.post(
  "/gate-access",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.gateEventBody.parse(req.body);
    const log = await svc.createGateLog(body, req.auth);
    res.status(201).json(log);
  })
);

// --- Staff roster (admin writes) & attendance (security team) ---

router.get(
  "/staff",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listStaff(q));
  })
);

router.post(
  "/staff",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = val.createStaffBody.parse(req.body);
    const s = await svc.createStaff(body);
    res.status(201).json(s);
  })
);

router.patch(
  "/staff/:staffId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.staffId);
    const body = val.patchStaffBody.parse(req.body);
    const s = await svc.patchStaff(req.params.staffId, body);
    res.json(s);
  })
);

router.delete(
  "/staff/:staffId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.staffId);
    res.json(await svc.deleteStaff(req.params.staffId));
  })
);

router.get(
  "/staff-attendance",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listStaffAttendance(q));
  })
);

router.post(
  "/staff-attendance",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.staffAttendanceInBody.parse(req.body);
    const a = await svc.checkInStaff(body, req.auth);
    res.status(201).json(a);
  })
);

router.patch(
  "/staff-attendance/:attendanceId",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.attendanceId);
    const body = val.staffAttendanceOutBody.parse(req.body);
    const a = await svc.checkOutStaff(req.params.attendanceId, body, req.auth);
    res.json(a);
  })
);

// --- SOS alerts (residents trigger; guards acknowledge) ---

router.get(
  "/sos/alerts",
  ...sosReaders,
  asyncHandler(async (req, res) => {
    const q = val.listSOSQuery.parse(req.query);
    res.json(await svc.listSOSAlerts(q, req.auth));
  })
);

router.post(
  "/sos/alerts",
  sosPostRateLimiter,
  ...residentOnly,
  asyncHandler(async (req, res) => {
    const body = val.sosCreateBody.parse(req.body);
    const alert = await svc.createSOSAlert(body, req.auth);
    res.status(201).json(alert);
  })
);

router.post(
  "/sos/alerts/:alertId/acknowledge",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.alertId);
    const alert = await svc.acknowledgeSOS(req.params.alertId, req.auth);
    res.json(alert);
  })
);

// --- Patrol routes, sessions, and checkpoint logging ---

router.get(
  "/patrols",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listPatrolQuery.parse(req.query);
    res.json(await svc.listPatrolLogs(q, req.auth));
  })
);

router.post(
  "/patrols",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.patrolLogBody.parse(req.body);
    const log = await svc.createPatrolLog(body, req.auth);
    res.status(201).json(log);
  })
);

router.get(
  "/patrol-routes",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listQuery.parse(req.query);
    res.json(await svc.listPatrolRoutes(q));
  })
);

router.post(
  "/patrol-routes",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.createPatrolRouteBody.parse(req.body);
    const route = await svc.createPatrolRoute(body, req.auth);
    res.status(201).json(route);
  })
);

router.get(
  "/patrol-sessions",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const q = val.listPatrolSessionsQuery.parse(req.query);
    res.json(await svc.listPatrolSessions(q, req.auth));
  })
);

router.post(
  "/patrol-sessions",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    const body = val.startPatrolSessionBody.parse(req.body);
    const session = await svc.startPatrolSession(body, req.auth);
    res.status(201).json(session);
  })
);

router.post(
  "/patrol-sessions/:sessionId/checkpoints",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.sessionId);
    const result = await svc.logPatrolCheckpoint(req.params.sessionId, req.auth);
    res.status(201).json(result);
  })
);

router.patch(
  "/patrol-sessions/:sessionId/complete",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.sessionId);
    const result = await svc.completePatrolSession(req.params.sessionId, req.auth);
    res.json(result);
  })
);

router.get(
  "/patrol-sessions/:sessionId/checkpoints",
  ...securityTeam,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.sessionId);
    res.json(await svc.listPatrolSessionCheckpoints(req.params.sessionId, req.auth));
  })
);

export default router;
