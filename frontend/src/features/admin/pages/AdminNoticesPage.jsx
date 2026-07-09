/**
 * Admin notice board. The admin can publish, edit, and delete notices that
 * residents see on their notice board.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { formatCount } from "../../../shared/utils/formatCount.js";

export function AdminNoticesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  // Fields for the publish-notice dialog.
  const [form, setForm] = useState({ title: "", description: "", priority: "" });

  const [editRow, setEditRow] = useState(null);
  // Fields for editing an existing notice.
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "" });

  // Fetch all notices from the API.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/notices?limit=100");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notices when the page mounts.
  useEffect(() => {
    load();
  }, [load]);

  // Publish a new notice and refresh the list.
  async function handleCreate(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/notices", {
        title: form.title,
        description: form.description,
        priority: form.priority || undefined,
      });
      setOpen(false);
      setForm({ title: "", description: "", priority: "" });
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Create failed");
    }
  }

  // Open the edit dialog with the selected notice's data.
  function openEdit(n) {
    setDialogError(null);
    setEditRow(n);
    setEditForm({
      title: n.title ?? "",
      description: n.description ?? "",
      priority: n.priority ?? "",
    });
  }

  // Save changes to an existing notice.
  async function handleEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    setDialogError(null);
    try {
      const body = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority.trim() || undefined,
      };
      await apiPatch(`/notices/${editRow.id}`, body);
      setEditRow(null);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Update failed");
    }
  }

  // Delete a notice after confirmation.
  async function handleDelete(id) {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await apiDelete(`/notices/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Notice board</Typography>
      <Typography variant="body2" color="text.secondary">
        Post notices that appear on the resident notice board.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setDialogError(null);
          setOpen(true);
        }}
        sx={{ alignSelf: "flex-start" }}
      >
        Publish notice
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "notice")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Posted</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((n) => (
            <TableRow key={n.id}>
              <TableCell>{n.title}</TableCell>
              <TableCell>{n.priority || "—"}</TableCell>
              <TableCell>{n.postedAt ? new Date(n.postedAt).toLocaleString() : "—"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openEdit(n)}>
                  Edit
                </Button>
                <Button size="small" color="error" sx={{ ml: 0.5 }} onClick={() => handleDelete(n.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No notices yet.</Typography>
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
        <form onSubmit={handleCreate}>
          <DialogTitle>New notice</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Title"
                value={form.title}
                onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
              />
              <TextField
                required
                label="Description"
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                multiline
                minRows={4}
              />
              <TextField
                label="Priority"
                value={form.priority}
                onChange={(ev) => setForm((f) => ({ ...f, priority: ev.target.value }))}
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
            <Button type="submit" variant="contained">
              Publish
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
          <DialogTitle>Edit notice</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Title"
                value={editForm.title}
                onChange={(ev) => setEditForm((f) => ({ ...f, title: ev.target.value }))}
              />
              <TextField
                required
                label="Description"
                value={editForm.description}
                onChange={(ev) => setEditForm((f) => ({ ...f, description: ev.target.value }))}
                multiline
                minRows={4}
              />
              <TextField
                label="Priority"
                value={editForm.priority}
                onChange={(ev) => setEditForm((f) => ({ ...f, priority: ev.target.value }))}
              />
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
