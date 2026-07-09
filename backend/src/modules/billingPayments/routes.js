/**
 * Billing and payment HTTP routes.
 * Finance roles (Admin, Accountant) manage bills; residents pay and receive notifications.
 */
import { Router } from "express";

import { authenticateJwt, requireDb, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as billing from "./billing.service.js";
import * as val from "./billing.validation.js";

const router = Router();

/** Admin or Accountant — bill issuance, edits, and defaulter reports. */
const financeAuth = [requireDb, authenticateJwt, requireRoles("Admin", "Accountant")];
/** Any authenticated role — residents are scoped to their units in the service. */
const anyAuth = [requireDb, authenticateJwt];
/** Residents only — payments and in-app notifications. */
const residentAuth = [requireDb, authenticateJwt, requireRoles("Resident")];

// --- Defaulters & bulk generation (finance only) ---

router.get(
  "/bills/defaulters",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const data = await billing.listDefaulters(req.auth);
    res.json(data);
  })
);

router.post(
  "/bills/generate",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const body = val.generateBillsBody.parse(req.body);
    const result = await billing.generateBills(body, req.auth.userId);
    res.status(201).json(result);
  })
);

// --- Bill CRUD — read for any authenticated user (scoped in service); write for finance ---

router.get(
  "/bills",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    const query = val.listBillsQuery.parse(req.query);
    const result = await billing.listBills(query, req.auth);
    res.json(result);
  })
);

router.post(
  "/bills",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const body = val.createBillBody.parse(req.body);
    const bill = await billing.createBill(body, req.auth.userId);
    res.status(201).json(bill);
  })
);

router.get(
  "/bills/:billId",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.billId);
    const bill = await billing.getBillById(req.params.billId, req.auth);
    res.json(bill);
  })
);

router.patch(
  "/bills/:billId",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.billId);
    const body = val.patchBillBody.parse(req.body);
    const bill = await billing.patchBill(req.params.billId, body);
    res.json(bill);
  })
);

// --- Payments — residents pay via gateway; all roles can list (scoped in service) ---

router.post(
  "/payments/gateway",
  requireDb,
  authenticateJwt,
  requireRoles("Resident"),
  asyncHandler(async (req, res) => {
    const body = val.gatewayPaymentBody.parse(req.body);
    const result = await billing.payBillViaGateway(body, req.auth.userId);
    res.status(201).json(result);
  })
);

router.get(
  "/payments",
  ...anyAuth,
  asyncHandler(async (req, res) => {
    const query = val.listPaymentsQuery.parse(req.query);
    const result = await billing.listPayments(query, req.auth);
    res.json(result);
  })
);

// --- In-app notifications (residents only) ---

router.get(
  "/notifications",
  ...residentAuth,
  asyncHandler(async (req, res) => {
    const query = val.listNotificationsQuery.parse(req.query);
    const result = await billing.listNotifications(query, req.auth);
    res.json(result);
  })
);

router.patch(
  "/notifications/:notificationId/read",
  ...residentAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.notificationId);
    const result = await billing.markNotificationRead(req.params.notificationId, req.auth);
    res.json(result);
  })
);

export default router;
