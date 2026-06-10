import mongoose from "mongoose";

const financialReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      required: true,
      enum: ["Income", "Expense", "BalanceSheet", "Defaulters"],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateRangeStart: { type: Date, required: true },
    dateRangeEnd: { type: Date, required: true },
    snapshotUri: { type: String, trim: true },
    snapshotJson: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: "financialReports", timestamps: true }
);

export const FinancialReport =
  mongoose.models.FinancialReport ||
  mongoose.model("FinancialReport", financialReportSchema);
