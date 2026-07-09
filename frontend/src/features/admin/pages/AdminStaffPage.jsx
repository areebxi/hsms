/**
 * Admin staff and vendors registry. The admin can register domestic staff
 * and vendors (with optional unit assignment) for gate check-in.
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
import { apiDelete, apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { optionalPhoneFieldError, sanitizePkPhoneInput } from "../../../shared/validation/pkPhone.js";
import { formatCount } from "../../../shared/formatCount.js";

const ROLES = ["Maid", "Driver", "Vendor", "Other"];

export function AdminStaffPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  // When set, the dialog is in edit mode for this staff row.
  const [edit, setEdit] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    role: "Other",
    phone: "",
    assignedUnitId: "",
  });

  // Fetch staff list and units (for the optional unit assignment dropdown).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([apiGet("/staff?limit=200"), apiGet("/units?limit=200")]);
      setItems(s.items ?? []);
      setUnits(u.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load staff and units when the page mounts.
  useEffect(() => {
    load();
  }, [load]);

  // Reset form and open the dialog for a new staff member.
  function openCreate() {
    setEdit(null);
    setPhoneError(null);
    setDialogError(null);
    setForm({ name: "", role: "Other", phone: "", assignedUnitId: "" });
    setOpen(true);
  }

  // Fill the form with an existing staff member's data for editing.
  function openEdit(row) {
    setEdit(row);
    setPhoneError(null);
    setDialogError(null);
    setForm({
      name: row.name ?? "",
      role: row.role ?? "Other",
      phone: sanitizePkPhoneInput(row.phone ?? ""),
      assignedUnitId: row.assignedUnitId ?? "",
    });
    setOpen(true);
  }

  // Create or update a staff member depending on whether edit is set.
  async function handleSave(e) {
    e.preventDefault();
    setDialogError(null);
    const pe = optionalPhoneFieldError(form.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        phone: form.phone || undefined,
        assignedUnitId: form.assignedUnitId || null,
      };
      if (edit) {
        await apiPatch(`/staff/${edit.id}`, payload);
      } else {
        await apiPost("/staff", payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Save failed");
    }
  }

  // Remove a staff member after confirmation.
  async function handleDelete(row) {
    if (!window.confirm(`Remove staff ${row.name}?`)) return;
    try {
      await apiDelete(`/staff/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Staff & vendors registry</Typography>
      <Typography variant="body2" color="text.secondary">
        Staff or vendors listed here can be checked in at the gate.
      </Typography>
      <Button variant="contained" onClick={openCreate} sx={{ alignSelf: "flex-start" }}>
        Add staff
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "staff member", "staff members")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>{row.phone || "—"}</TableCell>
              <TableCell>{row.assignedUnitId || "—"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No staff.</Typography>
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
        <form onSubmit={handleSave}>
          <DialogTitle>{edit ? "Edit staff" : "Add staff"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <TextField select label="Role" value={form.role} onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Assigned unit (optional)"
                value={form.assignedUnitId}
                onChange={(ev) => setForm((f) => ({ ...f, assignedUnitId: ev.target.value }))}
              >
                <MenuItem value="">— None —</MenuItem>
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber}
                  </MenuItem>
                ))}
              </TextField>
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
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
