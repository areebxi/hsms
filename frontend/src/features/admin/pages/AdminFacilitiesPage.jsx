/**
 * Admin facilities management. The admin can add, edit, and delete bookable
 * facilities (e.g. clubhouse, courts) and set capacity and status.
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

import { apiDelete, apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { formatCount } from "../../../shared/utils/formatCount.js";

const STATUSES = ["Active", "Maintenance", "Closed"];

export function AdminFacilitiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  // When set, the dialog is in edit mode for this facility.
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    capacity: "",
    status: "Active",
  });

  // Fetch all facilities from the API.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/facilities?limit=200");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load facilities when the page mounts.
  useEffect(() => {
    load();
  }, [load]);

  // Reset form and open the dialog for a new facility.
  function openCreate() {
    setDialogError(null);
    setEdit(null);
    setForm({ name: "", type: "", capacity: "", status: "Active" });
    setOpen(true);
  }

  // Fill the form with an existing facility's data for editing.
  function openEdit(row) {
    setDialogError(null);
    setEdit(row);
    setForm({
      name: row.name ?? "",
      type: row.type ?? "",
      capacity: row.capacity != null ? String(row.capacity) : "",
      status: row.status ?? "Active",
    });
    setOpen(true);
  }

  // Create or update a facility depending on whether edit is set.
  async function handleSave(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type.trim() || undefined,
        capacity: form.capacity === "" ? undefined : Number(form.capacity),
        status: form.status,
      };
      if (edit) {
        await apiPatch(`/facilities/${edit.id}`, payload);
      } else {
        await apiPost("/facilities", payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Save failed");
    }
  }

  // Delete a facility after confirmation.
  async function handleDelete(row) {
    if (!window.confirm(`Delete facility “${row.name}”?`)) return;
    try {
      await apiDelete(`/facilities/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Facilities</Typography>
      <Typography variant="body2" color="text.secondary">
        Set up facilities residents can book, such as the clubhouse or sports courts.
      </Typography>
      <Button variant="contained" onClick={openCreate} sx={{ alignSelf: "flex-start" }}>
        Add facility
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "facility", "facilities")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.type || "—"}</TableCell>
              <TableCell>{row.capacity ?? "—"}</TableCell>
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
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No facilities yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => {
          setDialogError(null);
          setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSave}>
          <DialogTitle>{edit ? "Edit facility" : "Add facility"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <TextField label="Type" value={form.type} onChange={(ev) => setForm((f) => ({ ...f, type: ev.target.value }))} />
              <TextField
                label="Capacity"
                type="number"
                value={form.capacity}
                onChange={(ev) => setForm((f) => ({ ...f, capacity: ev.target.value }))}
              />
              <TextField select label="Status" value={form.status} onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}>
                {STATUSES.map((s) => (
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
