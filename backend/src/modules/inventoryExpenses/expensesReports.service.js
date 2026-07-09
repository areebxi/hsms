/**
 * Expense ledger and financial report generation.
 * Reports snapshot aggregated income/expenses for a date range (demo-grade balances).
 */
import mongoose from "mongoose";

import { HttpError } from "../../lib/httpError.js";
import { Bill } from "../../models/Bill.js";
import { Expense } from "../../models/Expense.js";
import { FinancialReport } from "../../models/FinancialReport.js";
import { Payment } from "../../models/Payment.js";
import { listDefaulters } from "../billingPayments/billing.service.js";

function serializeExpense(doc) {
  if (!doc) return null;
  const e = doc.toObject ? doc.toObject() : { ...doc };
  const id = e._id?.toString?.() ?? String(e._id);
  const recordedBy =
    e.recordedBy && typeof e.recordedBy === "object" && e.recordedBy._id
      ? e.recordedBy._id.toString()
      : String(e.recordedBy);
  return {
    id,
    category: e.category,
    amount: e.amount,
    expenseDate: e.expenseDate,
    description: e.description,
    recordedBy,
    recorderName:
      e.recordedBy && typeof e.recordedBy === "object" ? e.recordedBy.name : undefined,
  };
}

function serializeReport(doc) {
  if (!doc) return null;
  const r = doc.toObject ? doc.toObject() : { ...doc };
  const id = r._id?.toString?.() ?? String(r._id);
  return {
    id,
    reportType: r.reportType,
    generatedBy:
      r.generatedBy?._id != null ? r.generatedBy._id.toString() : String(r.generatedBy),
    dateRangeStart: r.dateRangeStart,
    dateRangeEnd: r.dateRangeEnd,
    snapshotJson: r.snapshotJson,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** Expense list with optional date-range filter for accountant review. */
export async function listExpenses(query) {
  const limit = query.limit ?? 50;
  const skip = query.skip ?? 0;
  const filter = {};
  if (query.from || query.to) {
    filter.expenseDate = {};
    if (query.from) filter.expenseDate.$gte = query.from;
    if (query.to) filter.expenseDate.$lte = query.to;
  }

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .populate("recordedBy", "name email")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter),
  ]);

  return {
    items: items.map((e) => serializeExpense(e)),
    total,
    limit,
    skip,
  };
}

export async function createExpense(body, recordedByUserId) {
  const expense = await Expense.create({
    category: body.category,
    amount: body.amount,
    expenseDate: body.expenseDate,
    description: body.description,
    recordedBy: recordedByUserId,
  });
  const populated = await Expense.findById(expense._id)
    .populate("recordedBy", "name email")
    .lean();
  return serializeExpense(populated);
}

export async function getExpense(expenseId) {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new HttpError(400, "Invalid expense id");
  }
  const expense = await Expense.findById(expenseId).populate("recordedBy", "name email").lean();
  if (!expense) throw new HttpError(404, "Expense not found");
  return serializeExpense(expense);
}

export async function patchExpense(expenseId, body) {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new HttpError(400, "Invalid expense id");
  }
  const expense = await Expense.findByIdAndUpdate(expenseId, { $set: body }, { new: true })
    .populate("recordedBy", "name email")
    .lean();
  if (!expense) throw new HttpError(404, "Expense not found");
  return serializeExpense(expense);
}

export async function deleteExpense(expenseId) {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new HttpError(400, "Invalid expense id");
  }
  const deleted = await Expense.findByIdAndDelete(expenseId);
  if (!deleted) throw new HttpError(404, "Expense not found");
  return { deleted: true };
}

/**
 * Build and persist a financial report snapshot.
 * Report type selects which aggregates to include (income, expenses, balance sheet, or defaulters).
 */
export async function generateFinancialReport(body, generatedByUserId) {
  const start = new Date(body.dateRangeStart);
  const end = new Date(body.dateRangeEnd);
  if (end < start) {
    throw new HttpError(400, "dateRangeEnd must be on or after dateRangeStart");
  }

  let snapshotJson = {};

  if (body.reportType === "Income") {
    const agg = await Payment.aggregate([
      { $match: { paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const totalIncome = agg[0]?.total ?? 0;
    const paymentCount = await Payment.countDocuments({
      paidAt: { $gte: start, $lte: end },
    });
    snapshotJson = { totalIncome, paymentCount };
  }

  if (body.reportType === "Expense") {
    const agg = await Expense.aggregate([
      { $match: { expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = agg[0]?.total ?? 0;
    const expenseCount = await Expense.countDocuments({
      expenseDate: { $gte: start, $lte: end },
    });
    snapshotJson = { totalExpenses, expenseCount };
  }

  if (body.reportType === "BalanceSheet") {
    const incomeAgg = await Payment.aggregate([
      { $match: { paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const expenseAgg = await Expense.aggregate([
      { $match: { expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalIncome = incomeAgg[0]?.total ?? 0;
    const totalExpensesLedger = expenseAgg[0]?.total ?? 0;
    const unpaid = await Bill.aggregate([
      { $match: { status: { $ne: "Paid" } } },
      { $group: { _id: null, outstanding: { $sum: "$amount" } } },
    ]);
    const outstandingBills = unpaid[0]?.outstanding ?? 0;
    snapshotJson = {
      periodIncome: totalIncome,
      periodExpenses: totalExpensesLedger,
      netOperating: totalIncome - totalExpensesLedger,
      outstandingBillsTotal: outstandingBills,
      note: "Simplified demo balances — outstanding is all unpaid bills regardless of period.",
    };
  }

  if (body.reportType === "Defaulters") {
    const def = await listDefaulters({ role: "Admin", userId: generatedByUserId, email: "" });
    snapshotJson = {
      count: def.total,
      bills: def.items,
    };
  }

  const report = await FinancialReport.create({
    reportType: body.reportType,
    generatedBy: generatedByUserId,
    dateRangeStart: start,
    dateRangeEnd: end,
    snapshotJson,
  });

  const populated = await FinancialReport.findById(report._id)
    .populate("generatedBy", "name email")
    .lean();

  return serializeReport(populated);
}

export async function listReports(query) {
  const limit = query.limit ?? 30;
  const skip = query.skip ?? 0;
  const [items, total] = await Promise.all([
    FinancialReport.find()
      .populate("generatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FinancialReport.countDocuments(),
  ]);
  return {
    items: items.map((r) => serializeReport(r)),
    total,
    limit,
    skip,
  };
}

export async function getReport(reportId) {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new HttpError(400, "Invalid report id");
  }
  const report = await FinancialReport.findById(reportId)
    .populate("generatedBy", "name email")
    .lean();
  if (!report) throw new HttpError(404, "Report not found");
  return serializeReport(report);
}
