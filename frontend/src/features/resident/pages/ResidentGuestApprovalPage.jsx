/**
 * Pre-approve guests before they visit: register name, phone, unit, and date.
 * Security can use the approval id at the gate; residents can review past approvals.
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
import { apiGet, apiPost } from "../../../shared/api/client.js";
import { optionalPhoneFieldError } from "../../../shared/validation/pkPhone.js";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function ResidentGuestApprovalPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]); // units the resident may approve guests for
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false); // new approval dialog
  const [phoneError, setPhoneError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    unitId: "",
    validDate: "",
  });

  // Load existing guest approvals and linked units for the create form.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, u] = await Promise.all([apiGet("/guest-approvals?limit=50"), apiGet("/my-units")]);
      setItems(g.items ?? []);
      setUnits(u.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Guest approval flow: validate phone, post visitor + unit + date, then refresh the table.
  async function handleCreate(e) {
    e.preventDefault();
    setDialogError(null);
    const pe = optionalPhoneFieldError(form.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    try {
      await apiPost("/guest-approvals", {
        visitor: {
          name: form.name.trim(),
          phone: form.phone || undefined,
        },
        unitId: form.unitId,
        validDate: new Date(form.validDate).toISOString(),
      });
      setOpen(false);
      setForm({ name: "", phone: "", unitId: "", validDate: "" });
      setPhoneError(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Guest approval</Typography>
      <Typography variant="body2" color="text.secondary">
        Register a guest before they arrive. Share the approval code with security at the gate if asked.
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
        New approval
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "approval")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Guest</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Valid date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Approval ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.visitor?.name ?? row.visitorId}</TableCell>
              <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
              <TableCell>{row.validDate ? new Date(row.validDate).toLocaleDateString() : "—"}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
                  {row.id}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No approvals.</Typography>
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
        <form onSubmit={handleCreate}>
          <DialogTitle>Pre-approve guest</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Guest name"
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
                label="Unit"
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
                required
                label="Valid date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.validDate}
                onChange={(ev) => setForm((f) => ({ ...f, validDate: ev.target.value }))}
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
            <Button type="submit" variant="contained" disabled={units.length === 0}>
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
