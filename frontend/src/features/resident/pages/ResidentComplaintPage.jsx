/**
 * Submit complaints or suggestions for a linked unit, track status,
 * view details, and delete tickets that are still pending.
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
import { apiDelete, apiGet, apiPost } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function ResidentComplaintPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]); // resident's units for the submit form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false); // new submission dialog
  const [detailRow, setDetailRow] = useState(null); // ticket shown in the detail dialog
  const [form, setForm] = useState({ unitId: "", category: "", description: "" });

  // Load this resident's complaints and the units they can file under.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cData, uData] = await Promise.all([
        apiGet("/complaints?limit=100"),
        apiGet("/my-units"),
      ]);
      setItems(cData.items ?? []);
      setUnits(uData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Create a new complaint or suggestion, then refresh the list.
  async function handleSubmit(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/complaints", form);
      setOpen(false);
      setForm({ unitId: "", category: "", description: "" });
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Submit failed");
    }
  }

  // Remove a pending ticket after the resident confirms.
  async function handleDelete(c) {
    if (!window.confirm(`Delete ticket ${c.ticketId}?`)) return;
    setError(null);
    try {
      await apiDelete(`/complaints/${c.id}`);
      setDetailRow((row) => (row?.id === c.id ? null : row));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Complaint & suggestion box</Typography>
      <Typography variant="body2" color="text.secondary">
        Submit a complaint or suggestion for your unit and check its status here. You can remove it only while it is
        still pending.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setDialogError(null);
          setOpen(true);
        }}
        sx={{ alignSelf: "flex-start" }}
      >
        New submission
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "ticket")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ticket</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Category</TableCell>
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
              <TableCell>{c.status}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => setDetailRow(c)} sx={{ mr: 0.5 }}>
                  View
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={c.status !== "Pending"}
                  onClick={() => handleDelete(c)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No submissions yet.</Typography>
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
        <form onSubmit={handleSubmit}>
          <DialogTitle>New submission</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
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
                label="Category"
                value={form.category}
                onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))}
              />
              <TextField
                required
                label="Description"
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                multiline
                minRows={4}
              />
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
            <Button type="submit" variant="contained" disabled={units.length === 0}>
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(detailRow)} onClose={() => setDetailRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Submission details</DialogTitle>
        <DialogContent>
          {detailRow && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {detailRow.ticketId} · {detailRow.unit?.unitNumber ?? detailRow.unitId} · {detailRow.category} ·{" "}
                {detailRow.status}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {detailRow.description}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
