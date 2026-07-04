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

export function SecurityVisitorLogsPage() {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [unitsError, setUnitsError] = useState(null);
  const [open, setOpen] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    unitId: "",
    purpose: "",
    approvalId: "",
  });

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

  useEffect(() => {
    load();
  }, [load]);

  async function handleEntry(e) {
    e.preventDefault();
    setDialogError(null);
    const pe = optionalPhoneFieldError(form.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    try {
      await apiPost("/visitor-logs", {
        visitor: {
          name: form.name.trim(),
          phone: form.phone || undefined,
        },
        unitId: form.unitId,
        purpose: form.purpose.trim() || undefined,
        approvalId: form.approvalId.trim() || undefined,
      });
      setOpen(false);
      setForm({ name: "", phone: "", unitId: "", purpose: "", approvalId: "" });
      setPhoneError(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Entry failed");
    }
  }

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
        Log visitor entry and exit. Use a resident&apos;s approval code if the guest was pre-approved.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setPhoneError(null);
          setDialogError(null);
          setOpen(true);
        }}
        sx={{ alignSelf: "flex-start" }}
      >
        Log entry (new visitor)
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {unitsError && (
        <Alert severity="warning" onClose={() => setUnitsError(null)}>
          Units list failed to load (visitor entry form may be incomplete): {unitsError}
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
        open={open}
        onClose={() => {
          setPhoneError(null);
          setDialogError(null);
          setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleEntry}>
          <DialogTitle>Visitor entry</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Visitor name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <PhoneTextField
                value={form.phone}
                onPhoneChange={(phone) => {
                  setForm((f) => ({ ...f, phone }));
                  setPhoneError(null);
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
              <TextField
                select
                required
                label="Unit visiting"
                value={form.unitId}
                onChange={(ev) => setForm((f) => ({ ...f, unitId: ev.target.value }))}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Purpose"
                value={form.purpose}
                onChange={(ev) => setForm((f) => ({ ...f, purpose: ev.target.value }))}
              />
              <TextField
                label="Guest approval ID (optional)"
                value={form.approvalId}
                onChange={(ev) => setForm((f) => ({ ...f, approvalId: ev.target.value }))}
                helperText="Approval code from the resident (if the guest was pre-approved)"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setDialogError(null);
                setOpen(false);
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
    </Stack>
  );
}
