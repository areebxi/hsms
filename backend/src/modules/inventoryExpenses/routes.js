import { Router } from "express";

import { authenticateJwt, requireDb, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as er from "./expensesReports.service.js";
import * as val from "./expensesReports.validation.js";
import * as fb from "./facilitiesBookings.service.js";
import * as fbVal from "./facilitiesBookings.validation.js";
import * as inv from "./inventory.service.js";
import * as invVal from "./inventory.validation.js";

const router = Router();

const financeAuth = [requireDb, authenticateJwt, requireRoles("Admin", "Accountant")];
const authn = [requireDb, authenticateJwt];
const adminOnly = [requireDb, authenticateJwt, requireRoles("Admin")];
const bookingReaders = [requireDb, authenticateJwt, requireRoles("Admin", "Accountant", "Resident")];
const residentOnly = [requireDb, authenticateJwt, requireRoles("Resident")];

router.get(
  "/expenses",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const query = val.listExpensesQuery.parse(req.query);
    const result = await er.listExpenses(query);
    res.json(result);
  })
);

router.post(
  "/expenses",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const body = val.createExpenseBody.parse(req.body);
    const expense = await er.createExpense(body, req.auth.userId);
    res.status(201).json(expense);
  })
);

router.get(
  "/expenses/:expenseId",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.expenseId);
    const expense = await er.getExpense(req.params.expenseId);
    res.json(expense);
  })
);

router.patch(
  "/expenses/:expenseId",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.expenseId);
    const body = val.patchExpenseBody.parse(req.body);
    const expense = await er.patchExpense(req.params.expenseId, body);
    res.json(expense);
  })
);

router.delete(
  "/expenses/:expenseId",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.expenseId);
    const result = await er.deleteExpense(req.params.expenseId);
    res.json(result);
  })
);

router.post(
  "/reports/generate",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const body = val.generateReportBody.parse(req.body);
    const report = await er.generateFinancialReport(body, req.auth.userId);
    res.status(201).json(report);
  })
);

router.get(
  "/reports",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    const query = val.listReportsQuery.parse(req.query);
    const result = await er.listReports(query);
    res.json(result);
  })
);

router.get(
  "/reports/:reportId",
  ...financeAuth,
  asyncHandler(async (req, res) => {
    val.objectIdString.parse(req.params.reportId);
    const report = await er.getReport(req.params.reportId);
    res.json(report);
  })
);

router.get(
  "/facilities",
  ...authn,
  asyncHandler(async (req, res) => {
    const query = fbVal.listFacilitiesQuery.parse(req.query);
    res.json(await fb.listFacilities(query, req.auth));
  })
);

router.post(
  "/facilities",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = fbVal.createFacilityBody.parse(req.body);
    const row = await fb.createFacility(body);
    res.status(201).json(row);
  })
);

router.patch(
  "/facilities/:facilityId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    fbVal.objectIdString.parse(req.params.facilityId);
    const body = fbVal.patchFacilityBody.parse(req.body);
    res.json(await fb.patchFacility(req.params.facilityId, body));
  })
);

router.delete(
  "/facilities/:facilityId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    fbVal.objectIdString.parse(req.params.facilityId);
    res.json(await fb.deleteFacility(req.params.facilityId));
  })
);

router.get(
  "/facilities/:facilityId/slots",
  ...authn,
  asyncHandler(async (req, res) => {
    fbVal.objectIdString.parse(req.params.facilityId);
    const query = fbVal.occupiedSlotsQuery.parse(req.query);
    res.json(await fb.listOccupiedSlots(req.params.facilityId, query.date));
  })
);

router.get(
  "/bookings",
  ...bookingReaders,
  asyncHandler(async (req, res) => {
    const query = fbVal.listBookingsQuery.parse(req.query);
    res.json(await fb.listBookings(query, req.auth));
  })
);

router.post(
  "/bookings",
  ...residentOnly,
  asyncHandler(async (req, res) => {
    const body = fbVal.createBookingBody.parse(req.body);
    const row = await fb.createBooking(body, req.auth);
    res.status(201).json(row);
  })
);

router.patch(
  "/bookings/:bookingId",
  ...bookingReaders,
  asyncHandler(async (req, res) => {
    fbVal.objectIdString.parse(req.params.bookingId);
    const body = fbVal.patchBookingBody.parse(req.body);
    res.json(await fb.patchBooking(req.params.bookingId, body, req.auth));
  })
);

router.get(
  "/inventory",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const query = invVal.listInventoryQuery.parse(req.query);
    res.json(await inv.listInventory(query));
  })
);

router.post(
  "/inventory",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const body = invVal.createInventoryBody.parse(req.body);
    const row = await inv.createInventory(body, req.auth.userId);
    res.status(201).json(row);
  })
);

router.get(
  "/inventory/:itemId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    invVal.objectIdString.parse(req.params.itemId);
    res.json(await inv.getInventory(req.params.itemId));
  })
);

router.patch(
  "/inventory/:itemId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    invVal.objectIdString.parse(req.params.itemId);
    const body = invVal.patchInventoryBody.parse(req.body);
    res.json(await inv.patchInventory(req.params.itemId, body));
  })
);

router.delete(
  "/inventory/:itemId",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    invVal.objectIdString.parse(req.params.itemId);
    res.json(await inv.deleteInventory(req.params.itemId));
  })
);

export default router;
