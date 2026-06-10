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

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const t = d.getTime() - d.getTimezoneOffset() * 60000;
    return new Date(t).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function AdminPollsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    question: "",
    optionsText: "Yes\nNo",
    startDate: "",
    endDate: "",
  });

  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    question: "",
    optionsText: "Yes\nNo",
    startDate: "",
    endDate: "",
    status: "Open",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/polls?limit=100&status=all");
      setItems(data.items ?? []);
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
    const options = form.optionsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) {
      setError("Enter at least two options (one per line).");
      return;
    }
    setError(null);
    try {
      await apiPost("/polls", {
        question: form.question,
        options,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      setOpen(false);
      setForm({ question: "", optionsText: "Yes\nNo", startDate: "", endDate: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  function openEdit(p) {
    setEditRow(p);
    setEditForm({
      question: p.question ?? "",
      optionsText: (p.options || []).join("\n"),
      startDate: isoToDatetimeLocal(p.startDate),
      endDate: isoToDatetimeLocal(p.endDate),
      status: p.status ?? "Open",
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    const options = editForm.optionsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) {
      setError("Enter at least two options (one per line).");
      return;
    }
    setError(null);
    try {
      await apiPatch(`/polls/${editRow.id}`, {
        question: editForm.question,
        options,
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: new Date(editForm.endDate).toISOString(),
        status: editForm.status,
      });
      setEditRow(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete poll “${p.question}”? All votes will be removed.`)) return;
    setError(null);
    try {
      await apiDelete(`/polls/${p.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function closePoll(id) {
    if (!window.confirm("Close this poll? No further votes.")) return;
    setError(null);
    try {
      await apiPatch(`/polls/${id}`, { status: "Closed" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Close failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Polls & voting</Typography>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ alignSelf: "flex-start" }}>
        Create poll
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${items.length} poll(s)`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Question</TableCell>
            <TableCell>Window</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.question}</TableCell>
              <TableCell>
                {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button size="small" color="error" sx={{ ml: 0.5 }} onClick={() => handleDelete(p)}>
                  Delete
                </Button>
                {p.status === "Open" && (
                  <Button size="small" color="warning" sx={{ ml: 0.5 }} onClick={() => closePoll(p.id)}>
                    Close
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No polls.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleCreate}>
          <DialogTitle>New poll</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                required
                label="Question"
                value={form.question}
                onChange={(ev) => setForm((f) => ({ ...f, question: ev.target.value }))}
              />
              <TextField
                required
                label="Options (one per line)"
                value={form.optionsText}
                onChange={(ev) => setForm((f) => ({ ...f, optionsText: ev.target.value }))}
                multiline
                minRows={3}
              />
              <TextField
                required
                label="Start"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(ev) => setForm((f) => ({ ...f, startDate: ev.target.value }))}
              />
              <TextField
                required
                label="End"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(ev) => setForm((f) => ({ ...f, endDate: ev.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(editRow)} onClose={() => setEditRow(null)} fullWidth maxWidth="sm">
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit poll</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                required
                label="Question"
                value={editForm.question}
                onChange={(ev) => setEditForm((f) => ({ ...f, question: ev.target.value }))}
              />
              <TextField
                required
                label="Options (one per line)"
                value={editForm.optionsText}
                onChange={(ev) => setEditForm((f) => ({ ...f, optionsText: ev.target.value }))}
                multiline
                minRows={3}
              />
              <TextField
                required
                label="Start"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editForm.startDate}
                onChange={(ev) => setEditForm((f) => ({ ...f, startDate: ev.target.value }))}
              />
              <TextField
                required
                label="End"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editForm.endDate}
                onChange={(ev) => setEditForm((f) => ({ ...f, endDate: ev.target.value }))}
              />
              <TextField
                select
                label="Status"
                value={editForm.status}
                onChange={(ev) => setEditForm((f) => ({ ...f, status: ev.target.value }))}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </TextField>
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
