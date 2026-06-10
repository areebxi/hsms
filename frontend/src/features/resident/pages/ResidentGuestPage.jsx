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

import { PhoneTextField } from "../../../shared/components/PhoneTextField.jsx";
import { apiGet, apiPost } from "../../../shared/api/client.js";
import { optionalPhoneFieldError } from "../../../shared/validation/pkPhone.js";

export function ResidentGuestPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    unitId: "",
    validDate: "",
  });

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

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
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
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Guest pre-approval</Typography>
      <Typography variant="body2" color="text.secondary">
        Register an expected guest for security. Share the approval id with the guard if needed.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setPhoneError(null);
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
        {loading ? "Loading…" : `${items.length} approval(s)`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Guest</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Valid date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Approval id</TableCell>
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
          setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleCreate}>
          <DialogTitle>Pre-approve guest</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
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
