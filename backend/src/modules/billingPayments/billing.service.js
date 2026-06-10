import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { processCardPayment } from "../../integrations/dummyPaymentProvider.js";
import { sendNotification } from "../../integrations/notificationProvider.js";
import { Bill } from "../../models/Bill.js";
import { Payment } from "../../models/Payment.js";
import { User } from "../../models/User.js";
import { Unit } from "../../models/Unit.js";
import { OwnershipRecord } from "../../models/OwnershipRecord.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function serializeBill(doc, populated = false) {
  if (!doc) return null;
  const b = doc.toObject ? doc.toObject() : { ...doc };
  const id = b._id?.toString?.() ?? String(b._id);
  const unitId = b.unitId?._id ? b.unitId._id.toString() : String(b.unitId);
  const generatedBy =
    b.generatedBy?._id != null ? b.generatedBy._id.toString() : String(b.generatedBy);
  const due = new Date(b.dueDate);
  let effectiveStatus = b.status;
  if (b.status === "Pending" && due < startOfToday()) {
    effectiveStatus = "Overdue";
  }
  const out = {
    id,
    unitId,
    generatedBy,
    billType: b.billType,
    amount: b.amount,
    dueDate: b.dueDate,
    status: b.status,
    effectiveStatus,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
  if (populated && b.unitId && typeof b.unitId === "object" && b.unitId.unitNumber) {
    out.unit = {
      id: b.unitId._id.toString(),
      unitNumber: b.unitId.unitNumber,
      unitType: b.unitId.unitType,
    };
  }
  return out;
}

function serializePayment(doc, populated = false) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const id = p._id?.toString?.() ?? String(p._id);
  const out = {
    id,
    billId:
      p.billId && typeof p.billId === "object" && p.billId._id
        ? p.billId._id.toString()
        : String(p.billId),
    paidBy: p.paidBy?._id ? p.paidBy._id.toString() : String(p.paidBy),
    amountPaid: p.amountPaid,
    paymentMethod: p.paymentMethod,
    transactionRef: p.transactionRef,
    paidAt: p.paidAt,
  };
  if (populated && p.billId && typeof p.billId === "object" && p.billId._id) {
    const unitNested =
      p.billId.unitId && typeof p.billId.unitId === "object" && p.billId.unitId.unitNumber;
    out.bill = serializeBill(p.billId, !!unitNested);
  }
  return out;
}

/**
 * FR-2a: notify current residents when a bill is issued (`channel: app`; stub logs until real push/in-app feed exists).
 */
async function notifyResidentsNewBill(billSerialized) {
  if (!billSerialized?.unitId) return;
  const unitOid = new mongoose.Types.ObjectId(billSerialized.unitId);
  const records = await OwnershipRecord.find({ unitId: unitOid, endDate: null })
    .select("userId")
    .lean();
  const unique = new Set();
  for (const r of records) {
    const uid = r.userId.toString();
    if (unique.has(uid)) continue;
    unique.add(uid);
    const user = await User.findById(uid).select("role").lean();
    if (!user || user.role !== "Resident") continue;
    const payload = {
      event: "bill_created",
      billId: billSerialized.id,
      unitId: billSerialized.unitId,
      unitNumber: billSerialized.unit?.unitNumber,
      billType: billSerialized.billType,
      amount: billSerialized.amount,
      dueDate: billSerialized.dueDate,
    };
    try {
      await sendNotification({
        channel: "app",
        to: uid,
        subject: "New society bill",
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("[billing] app notification failed for user", uid, e);
    }
  }
}

export async function getCurrentUnitIdsForUser(userId) {
  const oid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const rows = await OwnershipRecord.find({
    userId: oid,
    endDate: null,
  })
    .select("unitId")
    .lean();
  return rows.map((r) => r.unitId.toString());
}

export async function listBills(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};

  if (auth.role === "Resident") {
    const units = await getCurrentUnitIdsForUser(auth.userId);
    if (units.length === 0) {
      return { items: [], total: 0, limit, skip };
    }
    filter.unitId = { $in: units.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  if (query.unitId) {
    if (auth.role === "Resident") {
      const units = await getCurrentUnitIdsForUser(auth.userId);
      if (!units.includes(query.unitId)) {
        throw new HttpError(403, "Not allowed to view this unit's bills");
      }
    }
    filter.unitId = query.unitId;
  }

  if (query.status) {
    if (query.status === "Overdue") {
      filter.status = "Pending";
      filter.dueDate = { $lt: startOfToday() };
    } else {
      filter.status = query.status;
    }
  }

  const [items, total] = await Promise.all([
    Bill.find(filter)
      .populate("unitId", "unitNumber unitType monthlyCharges")
      .populate("generatedBy", "name email")
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return {
    items: items.map((b) => serializeBill(b, true)),
    total,
    limit,
    skip,
  };
}

export async function getBillById(billId, auth) {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    throw new HttpError(400, "Invalid bill id");
  }
  const bill = await Bill.findById(billId)
    .populate("unitId", "unitNumber unitType monthlyCharges")
    .populate("generatedBy", "name email")
    .lean();
  if (!bill) throw new HttpError(404, "Bill not found");

  if (auth.role === "Resident") {
    const units = await getCurrentUnitIdsForUser(auth.userId);
    const uid = bill.unitId._id?.toString?.() ?? String(bill.unitId);
    if (!units.includes(uid)) {
      throw new HttpError(403, "Not allowed to view this bill");
    }
  }

  return serializeBill(bill, true);
}

export async function createBill(body, generatedByUserId) {
  const unit = await Unit.findById(body.unitId);
  if (!unit) throw new HttpError(404, "Unit not found");

  const bill = await Bill.create({
    unitId: body.unitId,
    generatedBy: generatedByUserId,
    billType: body.billType,
    amount: body.amount,
    dueDate: body.dueDate,
    status: body.status ?? "Pending",
  });

  const populated = await Bill.findById(bill._id)
    .populate("unitId", "unitNumber unitType")
    .populate("generatedBy", "name email")
    .lean();

  const serialized = serializeBill(populated, true);
  await notifyResidentsNewBill(serialized);
  return serialized;
}

/**
 * Generate one bill per unit using `monthlyCharges` as amount (plan — calculate charges).
 */
export async function generateBills(body, generatedByUserId) {
  let units;
  if (body.unitIds?.length) {
    units = await Unit.find({ _id: { $in: body.unitIds } });
    if (units.length !== body.unitIds.length) {
      throw new HttpError(404, "One or more units were not found");
    }
  } else {
    units = await Unit.find({ status: "Occupied" });
  }

  const created = [];
  const skipped = [];

  for (const unit of units) {
    const amount = Number(unit.monthlyCharges) || 0;
    if (amount <= 0) {
      skipped.push({ unitId: unit._id.toString(), reason: "monthlyCharges is zero" });
      continue;
    }

    const duplicate = await Bill.findOne({
      unitId: unit._id,
      billType: body.billType,
      dueDate: body.dueDate,
    });
    if (duplicate) {
      skipped.push({
        unitId: unit._id.toString(),
        reason: "duplicate bill for same unit, type, and due date",
      });
      continue;
    }

    const bill = await Bill.create({
      unitId: unit._id,
      generatedBy: generatedByUserId,
      billType: body.billType,
      amount,
      dueDate: body.dueDate,
      status: "Pending",
    });

    const populated = await Bill.findById(bill._id)
      .populate("unitId", "unitNumber unitType")
      .populate("generatedBy", "name email")
      .lean();
    const serialized = serializeBill(populated, true);
    created.push(serialized);
    await notifyResidentsNewBill(serialized);
  }

  return { created, skipped, summary: { created: created.length, skipped: skipped.length } };
}

export async function patchBill(billId, body) {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    throw new HttpError(400, "Invalid bill id");
  }
  const existing = await Bill.findById(billId);
  if (!existing) throw new HttpError(404, "Bill not found");
  if (existing.status === "Paid") {
    throw new HttpError(409, "Cannot edit a paid bill");
  }

  const updates = { ...body };
  const bill = await Bill.findByIdAndUpdate(billId, { $set: updates }, { new: true })
    .populate("unitId", "unitNumber unitType")
    .populate("generatedBy", "name email")
    .lean();

  return serializeBill(bill, true);
}

export async function listDefaulters(auth) {
  if (auth.role === "Resident") {
    throw new HttpError(403, "Insufficient permissions");
  }
  const bills = await Bill.find({
    status: { $nin: ["Paid"] },
    dueDate: { $lt: startOfToday() },
  })
    .populate("unitId", "unitNumber unitType")
    .populate("generatedBy", "name email")
    .sort({ dueDate: 1 })
    .lean();

  return {
    items: bills.map((b) => serializeBill(b, true)),
    total: bills.length,
  };
}

function cardPaymentErrorMessage(reason) {
  if (reason === "invalid_card_number") return "Invalid card number";
  if (reason === "invalid_amount") return "Payment could not be completed";
  return "Payment could not be completed";
}

export async function payBillWithCard(body, payerUserId) {
  const bill = await Bill.findById(body.billId);
  if (!bill) throw new HttpError(404, "Bill not found");

  if (bill.status === "Paid") {
    throw new HttpError(409, "Bill is already paid");
  }

  const units = await getCurrentUnitIdsForUser(payerUserId);
  if (!units.includes(bill.unitId.toString())) {
    throw new HttpError(403, "You can only pay bills for your assigned units");
  }

  const existingPay = await Payment.findOne({ billId: bill._id });
  if (existingPay) {
    throw new HttpError(409, "Payment already recorded for this bill");
  }

  const result = processCardPayment({
    billId: bill._id.toString(),
    cardNumber: body.cardNumber,
    amount: bill.amount,
  });

  if (!result.ok) {
    throw new HttpError(400, cardPaymentErrorMessage(result.reason));
  }

  const payment = await Payment.create({
    billId: bill._id,
    paidBy: payerUserId,
    amountPaid: bill.amount,
    paymentMethod: "Card",
    transactionRef: result.transactionRef,
    paidAt: new Date(result.paidAt),
  });

  await Bill.findByIdAndUpdate(bill._id, { status: "Paid" });

  const populated = await Payment.findById(payment._id)
    .populate({ path: "billId", populate: { path: "unitId", select: "unitNumber unitType" } })
    .lean();

  return serializePayment(populated, true);
}

export async function listPayments(query, auth) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};

  if (auth.role === "Resident") {
    filter.paidBy = auth.userId;
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: "billId",
        populate: { path: "unitId", select: "unitNumber unitType" },
      })
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    items: items.map((p) => serializePayment(p, true)),
    total,
    limit,
    skip,
  };
}
