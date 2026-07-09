/**
 * Financial report generation. Accountants pick a report type and date range,
 * run the report, view the snapshot, and browse previously saved reports.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { apiGet, apiPost } from "../../../shared/api/client.js";
import { ReportSnapshotView } from "./ReportSnapshotView.jsx";
import { formatCount } from "../../../shared/formatCount.js";

function day(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export function AccountantReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [form, setForm] = useState({
    reportType: "Income",
    start: "",
    end: "",
  });

  // Load previously generated reports for the history table.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/reports?limit=30");
      setReports(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ask the server to build a report for the selected type and date range.
  // The response includes a snapshot for immediate display and is saved to history.
  async function handleGenerate(e) {
    e.preventDefault();
    setError(null);
    setSnapshot(null);
    try {
      const report = await apiPost("/reports/generate", {
        reportType: form.reportType,
        dateRangeStart: new Date(form.start).toISOString(),
        dateRangeEnd: new Date(form.end).toISOString(),
      });
      setSnapshot(report);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Financial reports</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack component="form" spacing={2} onSubmit={handleGenerate}>
          <Typography variant="subtitle2">Generate report</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Report type"
              value={form.reportType}
              onChange={(ev) => setForm((f) => ({ ...f, reportType: ev.target.value }))}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="Income">Income (payments)</MenuItem>
              <MenuItem value="Expense">Expense (ledger)</MenuItem>
              <MenuItem value="BalanceSheet">Balance snapshot</MenuItem>
              <MenuItem value="Defaulters">Defaulters</MenuItem>
            </TextField>
            <TextField
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.start}
              onChange={(ev) => setForm((f) => ({ ...f, start: ev.target.value }))}
              required
            />
            <TextField
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.end}
              onChange={(ev) => setForm((f) => ({ ...f, end: ev.target.value }))}
              required
            />
            <Button type="submit" variant="contained">
              Generate
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            The balance report compares money collected and spent in the selected period, plus unpaid bills.
          </Typography>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {snapshot && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Latest output ({snapshot.reportType})
          </Typography>
          <ReportSnapshotView reportType={snapshot.reportType} data={snapshot.snapshotJson} />
        </Paper>
      )}

      <Typography variant="subtitle2">Saved reports</Typography>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(reports.length, "saved report", "saved reports")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Range</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.reportType}</TableCell>
              <TableCell>
                {day(r.dateRangeStart)} → {day(r.dateRangeEnd)}
              </TableCell>
              <TableCell>{day(r.createdAt)}</TableCell>
            </TableRow>
          ))}
          {!loading && reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">No saved reports yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
