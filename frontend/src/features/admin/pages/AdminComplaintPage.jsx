/**
 * Admin complaint and suggestion inbox. The admin can review resident
 * submissions, update their status (Pending / In Progress / Resolved),
 * or delete them.
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

import { apiDelete, apiGet, apiPatch } from "../../../shared/api/client.js";
import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { formatCount } from "../../../shared/utils/formatCount.js";

const STATUSES = ["Pending", "In Progress", "Resolved"];

export function AdminComplaintPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [editRow, setEditRow] = useState(null);
  // Status chosen in the edit dialog before saving.
  const [statusDraft, setStatusDraft] = useState("Pending");

  // Fetch all complaints and suggestions from the API.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/complaints?limit=200");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load submissions when the page mounts.
  useEffect(() => {
    load();
  }, [load]);

  // Open the status-update dialog for a submission.
  function openEdit(c) {
    setDialogError(null);
    setEditRow(c);
    setStatusDraft(c.status ?? "Pending");
  }

  // Save the new status for the selected submission.
  async function handleEditSave(e) {
    e.preventDefault();
    if (!editRow) return;
    setDialogError(null);
    try {
      await apiPatch(`/complaints/${editRow.id}`, { status: statusDraft });
      setEditRow(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Update failed");
    }
  }

  // Delete a submission after confirmation.
  async function handleDelete(c) {
    if (!window.confirm(`Delete submission ${c.ticketId}? This cannot be undone.`)) return;
    try {
      await apiDelete(`/complaints/${c.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Complaint & suggestion box</Typography>
      <Typography variant="body2" color="text.secondary">
        Review resident complaints and suggestions, and update their status.
      </Typography>
      <Button variant="outlined" onClick={load} sx={{ alignSelf: "flex-start" }}>
        Refresh
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "submission")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ticket</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Resident</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.ticketId}</TableCell>
              <TableCell>{c.unit?.unitNumber ?? c.unitId}</TableCell>
              <TableCell>{c.category}</TableCell>
              <TableCell sx={{ maxWidth: 320, verticalAlign: "top" }}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {c.description}
                </Typography>
              </TableCell>
              <TableCell>{c.submitterName ?? c.submitterEmail ?? "—"}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button size="small" color="error" sx={{ ml: 0.5 }} onClick={() => handleDelete(c)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary">No submissions yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={Boolean(editRow)}
        onClose={() => {
          setDialogError(null);
          setEditRow(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleEditSave}>
          <DialogTitle>Update submission</DialogTitle>
          <DialogContent>
            {editRow && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
                <Typography variant="body2" color="text.secondary">
                  {editRow.ticketId} · {editRow.unit?.unitNumber ?? editRow.unitId} · {editRow.category}
                </Typography>
                <Typography variant="body2">{editRow.description}</Typography>
                <TextField
                  select
                  label="Status"
                  value={statusDraft}
                  onChange={(ev) => setStatusDraft(ev.target.value)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            )}
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
