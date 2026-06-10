import { Router } from "express";

import { authenticateJwt, requireDb, requireRoles } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as service from "./membersUnits.service.js";
import * as val from "./membersUnits.validation.js";

const router = Router();

const adminStack = [requireDb, authenticateJwt, requireRoles("Admin")];
const adminOrFinanceStack = [requireDb, authenticateJwt, requireRoles("Admin", "Accountant")];
const unitReaders = [
  requireDb,
  authenticateJwt,
  requireRoles("Admin", "Accountant", "SecurityGuard"),
];

router.get(
  "/users",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const query = val.listUsersQuery.parse(req.query);
    const result = await service.listUsers(query);
    res.json(result);
  })
);

router.post(
  "/users",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const body = val.createUserBody.parse(req.body);
    const user = await service.createUser(body);
    res.status(201).json(user);
  })
);

router.get(
  "/users/:userId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    val.objectIdString.parse(userId);
    const user = await service.getUserById(userId);
    res.json(user);
  })
);

router.patch(
  "/users/:userId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    val.objectIdString.parse(userId);
    const body = val.patchUserBody.parse(req.body);
    const user = await service.updateUser(userId, body);
    res.json(user);
  })
);

router.delete(
  "/users/:userId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    val.objectIdString.parse(userId);
    const result = await service.deleteUser(userId, req.auth);
    res.json(result);
  })
);

router.get(
  "/my-units",
  requireDb,
  authenticateJwt,
  requireRoles("Resident"),
  asyncHandler(async (req, res) => {
    const result = await service.listResidentUnits(req.auth.userId);
    res.json(result);
  })
);

router.get(
  "/units",
  ...unitReaders,
  asyncHandler(async (req, res) => {
    const query = val.listUnitsQuery.parse(req.query);
    const result = await service.listUnits(query);
    res.json(result);
  })
);

router.post(
  "/units",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const body = val.createUnitBody.parse(req.body);
    const unit = await service.createUnit(body);
    res.status(201).json(unit);
  })
);

router.get(
  "/units/:unitId",
  ...unitReaders,
  asyncHandler(async (req, res) => {
    const { unitId } = req.params;
    val.objectIdString.parse(unitId);
    const unit = await service.getUnitById(unitId);
    res.json(unit);
  })
);

router.patch(
  "/units/:unitId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { unitId } = req.params;
    val.objectIdString.parse(unitId);
    const body = val.patchUnitBody.parse(req.body);
    const unit = await service.updateUnit(unitId, body);
    res.json(unit);
  })
);

router.delete(
  "/units/:unitId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { unitId } = req.params;
    val.objectIdString.parse(unitId);
    const result = await service.deleteUnit(unitId);
    res.json(result);
  })
);

router.get(
  "/ownership-records",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const query = val.listOwnershipQuery.parse(req.query);
    const result = await service.listOwnershipRecords(query);
    res.json(result);
  })
);

router.post(
  "/ownership-records",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const body = val.createOwnershipBody.parse(req.body);
    const record = await service.createOwnershipRecord(body);
    res.status(201).json(record);
  })
);

router.get(
  "/ownership-records/:recordId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    val.objectIdString.parse(recordId);
    const record = await service.getOwnershipRecord(recordId);
    res.json(record);
  })
);

router.patch(
  "/ownership-records/:recordId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    val.objectIdString.parse(recordId);
    const body = val.patchOwnershipBody.parse(req.body);
    const record = await service.updateOwnershipRecord(recordId, body);
    res.json(record);
  })
);

router.delete(
  "/ownership-records/:recordId",
  ...adminStack,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    val.objectIdString.parse(recordId);
    const result = await service.deleteOwnershipRecord(recordId);
    res.json(result);
  })
);

export default router;
