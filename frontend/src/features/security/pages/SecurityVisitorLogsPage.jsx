/**
 * Visitor logging for security staff. Supports walk-in entries (new visitor details)
 * and pre-approved guests (linked to a resident's active approval for today).
 * Exit is recorded separately when the visitor leaves the society.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { PhoneTextField } from "../../../shared/components/PhoneTextField.jsx";
import { apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { optionalPhoneFieldError } from "../../../shared/validation/pkPhone.js";
import { formatCount } from "../../../shared/formatCount.js";

const UNITS_PAGE_SIZE = 200;
const APPROVALS_LIMIT = 200;

function todayLocalIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Paginate through all units so the walk-in form can list every unit.
async function fetchAllUnits() {
  const all = [];
  let skip = 0;
  for (;;) {
    const data = await apiGet(`/units?limit=${UNITS_PAGE_SIZE}&skip=${skip}`);
    const items = data.items ?? [];
    if (items.length === 0) break;
    all.push(...items);
    if (typeof data.total === "number" && all.length >= data.total) break;
    if (items.length < UNITS_PAGE_SIZE) break;
    skip += items.length;
  }
  return all;
}

function approvalLabel(row) {
  const guest = row.visitor?.name ?? row.visitorId;
  const unit = row.unit?.unitNumber ?? row.unitId;
  const date = row.validDate ? new Date(row.validDate).toLocaleDateString() : "—";
  return `${guest} — Unit ${unit} — ${date}`;
}

export function SecurityVisitorLogsPage() {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [unitsError, setUnitsError] = useState(null);
  const [approvalsError, setApprovalsError] = useState(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [preApprovedOpen, setPreApprovedOpen] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    phone: "",
    unitId: "",
    purpose: "",
  });
  const [preApprovedForm, setPreApprovedForm] = useState({
    approvalId: "",
    purpose: "",
  });

  // Load recent visitor logs and the full unit list (used by walk-in entry).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnitsError(null);

    const [logsOutcome, unitsOutcome] = await Promise.allSettled([
      apiGet("/visitor-logs?limit=100"),
      fetchAllUnits(),
    ]);

    if (logsOutcome.status === "fulfilled") {
      setLogs(logsOutcome.value.items ?? []);
    } else {
      const e = logsOutcome.reason;
      setError(e instanceof Error ? e.message : "Load failed");
      setLogs([]);
    }

    if (unitsOutcome.status === "fulfilled") {
      setUnits(unitsOutcome.value);
    } else {
      const e = unitsOutcome.reason;
      setUnitsError(e instanceof Error ? e.message : "Could not load units");
      setUnits([]);
    }

    setLoading(false);
  }, []);

  // Pre-approved guests must have an active approval valid for today.
  const loadApprovals = useCallback(async () => {
    setApprovalsError(null);
    try {
      const data = await apiGet(
        `/guest-approvals?status=Active&validDate=${todayLocalIsoDate()}&limit=${APPROVALS_LIMIT}`
      );
      const items = data.items ?? [];
      setApprovals(items);
      setPreApprovedForm((f) => ({
        ...f,
        approvalId: items.some((a) => a.id === f.approvalId) ? f.approvalId : "",
      }));
    } catch (e) {
      setApprovalsError(e instanceof Error ? e.message : "Could not load approvals");
      setApprovals([]);
      setPreApprovedForm((f) => ({ ...f, approvalId: "" }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openWalkInDialog() {
    setPhoneError(null);
    setDialogError(null);
    setWalkInOpen(true);
  }

  function openPreApprovedDialog() {
    setDialogError(null);
    setApprovalsError(null);
    setPreApprovedOpen(true);
    loadApprovals();
  }

  // Walk-in: create a new visitor record and log their entry to a unit.
  async function handleWalkInEntry(e) {
    e.preventDefault();
    setDialogError(null);
    const pe = optionalPhoneFieldError(walkInForm.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    try {
      await apiPost("/visitor-logs", {
        visitor: {
          name: walkInForm.name.trim(),
          phone: walkInForm.phone || undefined,
        },
        unitId: walkInForm.unitId,
        purpose: walkInForm.purpose.trim() || undefined,
      });
      setWalkInOpen(false);
      setWalkInForm({ name: "", phone: "", unitId: "", purpose: "" });
      setPhoneError(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Entry failed");
    }
  }

  // Pre-approved: entry is tied to an existing guest approval; visitor details come from that record.
  async function handlePreApprovedEntry(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/visitor-logs", {
        approvalId: preApprovedForm.approvalId,
        purpose: preApprovedForm.purpose.trim() || undefined,
      });
      setPreApprovedOpen(false);
      setPreApprovedForm({ approvalId: "", purpose: "" });
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Entry failed");
    }
  }

  // Mark the visitor as having left; backend sets the exit timestamp.
  async function handleExit(row) {
    setError(null);
    try {
      await apiPatch(`/visitor-logs/${row.id}`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exit failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Visitor logs</Typography>
      <Typography variant="body2" color="text.secondary">
        Log walk-in visitors with their details, or check in guests who were pre-approved by a
        resident. Exit is recorded when the visitor leaves.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button variant="contained" onClick={openWalkInDialog} sx={{ alignSelf: "flex-start" }}>
          Log walk-in
        </Button>
        <Button
          variant="outlined"
          onClick={openPreApprovedDialog}
          sx={{ alignSelf: "flex-start" }}
        >
          Log pre-approved guest
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {unitsError && (
        <Alert severity="warning" onClose={() => setUnitsError(null)}>
          Units list failed to load (walk-in form may be incomplete): {unitsError}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(logs.length, "entry")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Visitor</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Entry</TableCell>
            <TableCell>Exit</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.visitor?.name ?? row.visitorId}</TableCell>
              <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
              <TableCell>{row.entryTime ? new Date(row.entryTime).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.exitTime ? new Date(row.exitTime).toLocaleString() : "—"}</TableCell>
              <TableCell align="right">
                {!row.exitTime && (
                  <Button size="small" variant="outlined" onClick={() => handleExit(row)}>
                    Log exit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No visitor logs.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={walkInOpen}
        onClose={() => {
          setPhoneError(null);
          setDialogError(null);
          setWalkInOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleWalkInEntry}>
          <DialogTitle>Walk-in visitor</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Visitor name"
                value={walkInForm.name}
                onChange={(ev) => setWalkInForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <PhoneTextField
                value={walkInForm.phone}
                onPhoneChange={(phone) => {
                  setWalkInForm((f) => ({ ...f, phone }));
                  setPhoneError(null);
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
              <TextField
                select
                required
                label="Unit visiting"
                value={walkInForm.unitId}
                onChange={(ev) => setWalkInForm((f) => ({ ...f, unitId: ev.target.value }))}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Purpose"
                value={walkInForm.purpose}
                onChange={(ev) => setWalkInForm((f) => ({ ...f, purpose: ev.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setDialogError(null);
                setWalkInOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Record entry
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={preApprovedOpen}
        onClose={() => {
          setDialogError(null);
          setPreApprovedOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handlePreApprovedEntry}>
          <DialogTitle>Pre-approved guest</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              {approvalsError && (
                <Alert severity="warning" onClose={() => setApprovalsError(null)}>
                  {approvalsError}
                </Alert>
              )}
              <TextField
                select
                required
                label="Guest approval"
                value={preApprovedForm.approvalId}
                onChange={(ev) =>
                  setPreApprovedForm((f) => ({ ...f, approvalId: ev.target.value }))
                }
                disabled={approvals.length === 0}
                helperText={
                  approvals.length === 0
                    ? "No active approvals for today"
                    : "Select the guest pre-approved by a resident"
                }
              >
                {approvals.map((row) => (
                  <MenuItem key={row.id} value={row.id}>
                    {approvalLabel(row)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Purpose"
                value={preApprovedForm.purpose}
                onChange={(ev) =>
                  setPreApprovedForm((f) => ({ ...f, purpose: ev.target.value }))
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setPreApprovedOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!preApprovedForm.approvalId}
            >
              Record entry
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
