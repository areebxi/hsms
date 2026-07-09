/**
 * Admin page for society units (flats, villas, plots). The admin can list,
 * add, edit, and delete units and set type, floor, monthly charges, and status.
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
import { apiDelete, apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/formatCount.js";

const UNIT_TYPES = ["Apartment", "Villa", "Plot"];
const OCCUPANCY = ["Occupied", "Vacant"];

export function AdminUnitsPage() {
  // Unit list from the API and total count for the caption.
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);

  // Dialog visibility and which row is being edited.
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const emptyForm = {
    unitNumber: "",
    unitType: "Apartment",
    floor: "",
    monthlyCharges: "",
    status: "Vacant",
  };
  // Form fields for the create/edit dialog.
  const [form, setForm] = useState(emptyForm);

  // Fetch all units from the API.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/units");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load units");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load units when the page mounts.
  useEffect(() => {
    load();
  }, [load]);

  // Create a new unit and refresh the list.
  async function handleCreate(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/units", {
        unitNumber: form.unitNumber,
        unitType: form.unitType,
        floor: form.floor === "" ? undefined : Number(form.floor),
        monthlyCharges: form.monthlyCharges === "" ? undefined : Number(form.monthlyCharges),
        status: form.status,
      });
      setCreateOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Create failed");
    }
  }

  // Update the selected unit and refresh the list.
  async function handleEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    setDialogError(null);
    try {
      await apiPatch(`/units/${editRow.id}`, {
        unitNumber: form.unitNumber,
        unitType: form.unitType,
        floor: form.floor === "" ? undefined : Number(form.floor),
        monthlyCharges: form.monthlyCharges === "" ? undefined : Number(form.monthlyCharges),
        status: form.status,
      });
      setEditRow(null);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Update failed");
    }
  }

  // Fill the form with an existing unit's data for editing.
  function openEdit(row) {
    setDialogError(null);
    setEditRow(row);
    setForm({
      unitNumber: row.unitNumber ?? "",
      unitType: row.unitType ?? "Apartment",
      floor: row.floor ?? "",
      monthlyCharges: row.monthlyCharges ?? "",
      status: row.status ?? "Vacant",
    });
  }

  // Delete a unit after confirmation (only allowed if no ownership history).
  async function handleDelete(row) {
    if (
      !window.confirm(
        `Delete unit ${row.unitNumber}? Only allowed if there is no ownership history for this unit.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await apiDelete(`/units/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Units</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage unit details and monthly maintenance charges. Occupancy updates automatically from ownership records.
      </Typography>

      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          onClick={() => {
            setDialogError(null);
            setCreateOpen(true);
          }}
        >
          Add unit
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(total, "unit")}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Number</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Floor</TableCell>
            <TableCell>Monthly maintenance charges</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.unitNumber}</TableCell>
              <TableCell>{row.unitType}</TableCell>
              <TableCell>{row.floor ?? "—"}</TableCell>
              <TableCell>{row.monthlyCharges ?? 0}</TableCell>
              <TableCell>{row.status}</TableCell>
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
              <TableCell colSpan={6}>
                <Typography color="text.secondary">No units yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={createOpen}
        onClose={() => {
          setDialogError(null);
          setCreateOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleCreate}>
          <DialogTitle>Add unit</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Unit number"
                value={form.unitNumber}
                onChange={(ev) => setForm((f) => ({ ...f, unitNumber: ev.target.value }))}
              />
              <TextField
                select
                label="Unit type"
                value={form.unitType}
                onChange={(ev) => setForm((f) => ({ ...f, unitType: ev.target.value }))}
              >
                {UNIT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Floor"
                type="number"
                value={form.floor}
                onChange={(ev) => setForm((f) => ({ ...f, floor: ev.target.value }))}
              />
              <TextField
                label="Monthly maintenance charges"
                type="number"
                value={form.monthlyCharges}
                onChange={(ev) => setForm((f) => ({ ...f, monthlyCharges: ev.target.value }))}
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}
              >
                {OCCUPANCY.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setCreateOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editRow)}
        onClose={() => {
          setDialogError(null);
          setEditRow(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit unit</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Unit number"
                value={form.unitNumber}
                onChange={(ev) => setForm((f) => ({ ...f, unitNumber: ev.target.value }))}
              />
              <TextField
                select
                label="Unit type"
                value={form.unitType}
                onChange={(ev) => setForm((f) => ({ ...f, unitType: ev.target.value }))}
              >
                {UNIT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Floor"
                type="number"
                value={form.floor}
                onChange={(ev) => setForm((f) => ({ ...f, floor: ev.target.value }))}
              />
              <TextField
                label="Monthly maintenance charges"
                type="number"
                value={form.monthlyCharges}
                onChange={(ev) => setForm((f) => ({ ...f, monthlyCharges: ev.target.value }))}
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}
              >
                {OCCUPANCY.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setEditRow(null);
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
