import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { ROLES } from "../../../shared/constants/roles.js";

function formatDay(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

function isoToDateInput(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function OwnershipPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentOnly, setCurrentOnly] = useState(true);

  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    unitId: "",
    userId: "",
    ownershipType: "Owner",
    startDate: "",
    endDate: "",
  });

  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    unitId: "",
    userId: "",
    ownershipType: "Owner",
    startDate: "",
    endDate: "",
  });

  const loadLists = useCallback(async () => {
    try {
      const [uData, userData] = await Promise.all([
        apiGet("/units?limit=200"),
        apiGet(`/users?limit=200&role=${encodeURIComponent(ROLES.Resident)}`),
      ]);
      setUnits(uData.items ?? []);
      setUsers(userData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load picklists");
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (currentOnly) params.set("currentOnly", "true");
      const data = await apiGet(`/ownership-records?${params}`);
      setRecords(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ownership records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentOnly]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.unitId || !createForm.userId || !createForm.startDate) {
      setError("Unit, member, and start date are required.");
      return;
    }
    setError(null);
    try {
      const payload = {
        unitId: createForm.unitId,
        userId: createForm.userId,
        ownershipType: createForm.ownershipType,
        startDate: new Date(createForm.startDate).toISOString(),
      };
      if (createForm.endDate) {
        payload.endDate = new Date(createForm.endDate).toISOString();
      }
      await apiPost("/ownership-records", payload);
      setCreateOpen(false);
      setCreateForm({
        unitId: "",
        userId: "",
        ownershipType: "Owner",
        startDate: "",
        endDate: "",
      });
      await loadRecords();
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editRow || !editForm.unitId || !editForm.userId || !editForm.startDate) {
      setError("Unit, member, and start date are required.");
      return;
    }
    setError(null);
    try {
      const payload = {
        unitId: editForm.unitId,
        userId: editForm.userId,
        ownershipType: editForm.ownershipType,
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : null,
      };
      await apiPatch(`/ownership-records/${editRow.id}`, payload);
      setEditRow(null);
      await loadRecords();
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  function openEdit(row) {
    setEditRow(row);
    setEditForm({
      unitId: row.unit?.id ?? row.unitId ?? "",
      userId: row.user?.id ?? row.userId ?? "",
      ownershipType: row.ownershipType ?? "Owner",
      startDate: isoToDateInput(row.startDate),
      endDate: row.endDate ? isoToDateInput(row.endDate) : "",
    });
  }

  async function handleDelete(row) {
    if (!window.confirm("Delete this ownership record? Unit occupancy will be recalculated.")) return;
    setError(null);
    try {
      await apiDelete(`/ownership-records/${row.id}`);
      await loadRecords();
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function endTenancy(row) {
    if (!window.confirm("Set end date to today for this record?")) return;
    setError(null);
    try {
      await apiPatch(`/ownership-records/${row.id}`, {
        endDate: new Date().toISOString(),
      });
      await loadRecords();
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Ownership & tenancy</Typography>
      <Typography variant="body2" color="text.secondary">
        Track owner vs tenant and dates. Current records have no end date; closing a record updates unit occupancy.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={currentOnly}
              onChange={(ev) => setCurrentOnly(ev.target.checked)}
            />
          }
          label="Current records only"
        />
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Add ownership record
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${total} record(s)`}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Unit</TableCell>
            <TableCell>Member</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
              <TableCell>{row.user?.name ?? row.userId}</TableCell>
              <TableCell>{row.ownershipType}</TableCell>
              <TableCell>{formatDay(row.startDate)}</TableCell>
              <TableCell>{formatDay(row.endDate)}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button size="small" color="error" sx={{ ml: 0.5 }} onClick={() => handleDelete(row)}>
                  Delete
                </Button>
                {!row.endDate && (
                  <Button size="small" sx={{ ml: 0.5 }} onClick={() => endTenancy(row)}>
                    End tenancy
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && records.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary">No matching records.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleCreate}>
          <DialogTitle>Ownership / tenancy</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                required
                label="Unit"
                value={createForm.unitId}
                onChange={(ev) => setCreateForm((f) => ({ ...f, unitId: ev.target.value }))}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber} ({u.unitType})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                required
                label="Member"
                value={createForm.userId}
                onChange={(ev) => setCreateForm((f) => ({ ...f, userId: ev.target.value }))}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Relationship"
                value={createForm.ownershipType}
                onChange={(ev) => setCreateForm((f) => ({ ...f, ownershipType: ev.target.value }))}
              >
                <MenuItem value="Owner">Owner</MenuItem>
                <MenuItem value="Tenant">Tenant</MenuItem>
              </TextField>
              <TextField
                required
                label="Start date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={createForm.startDate}
                onChange={(ev) => setCreateForm((f) => ({ ...f, startDate: ev.target.value }))}
              />
              <TextField
                label="End date (optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={createForm.endDate}
                onChange={(ev) => setCreateForm((f) => ({ ...f, endDate: ev.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(editRow)} onClose={() => setEditRow(null)} fullWidth maxWidth="sm">
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit ownership record</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                required
                label="Unit"
                value={editForm.unitId}
                onChange={(ev) => setEditForm((f) => ({ ...f, unitId: ev.target.value }))}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber} ({u.unitType})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                required
                label="Member"
                value={editForm.userId}
                onChange={(ev) => setEditForm((f) => ({ ...f, userId: ev.target.value }))}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Relationship"
                value={editForm.ownershipType}
                onChange={(ev) => setEditForm((f) => ({ ...f, ownershipType: ev.target.value }))}
              >
                <MenuItem value="Owner">Owner</MenuItem>
                <MenuItem value="Tenant">Tenant</MenuItem>
              </TextField>
              <TextField
                required
                label="Start date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editForm.startDate}
                onChange={(ev) => setEditForm((f) => ({ ...f, startDate: ev.target.value }))}
              />
              <TextField
                label="End date (leave blank for current / open)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editForm.endDate}
                onChange={(ev) => setEditForm((f) => ({ ...f, endDate: ev.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setEditRow(null)}>
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
