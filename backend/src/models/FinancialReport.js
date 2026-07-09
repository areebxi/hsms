/**
 * A generated financial summary for a date range.
 * Stores a snapshot so reports can be viewed later without recalculating.
 */
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
    // Optional link to an exported file (PDF, CSV)
    snapshotUri: { type: String, trim: true },
    // Cached report data for quick reload in the app
    snapshotJson: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: "financialReports", timestamps: true }
);

export const FinancialReport =
  mongoose.models.FinancialReport ||
  mongoose.model("FinancialReport", financialReportSchema);
