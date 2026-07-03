import { useCallback, useEffect, useMemo, useState } from "react";
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
import { EXPENSE_CATEGORY_OPTIONS } from "../../../shared/constants/expenseCategories.js";

function money(n) {
  return typeof n === "number"
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

function day(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

export function ExpensesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    expenseDate: "",
    description: "",
  });

  const categorySelectOptions = useMemo(() => {
    const cur = (form.category ?? "").trim();
    if (cur && !EXPENSE_CATEGORY_OPTIONS.includes(cur)) {
      return [cur, ...EXPENSE_CATEGORY_OPTIONS];
    }
    return EXPENSE_CATEGORY_OPTIONS;
  }, [form.category]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/expenses?limit=100");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setDialogError(null);
    setEditId(null);
    setForm({
      category: EXPENSE_CATEGORY_OPTIONS[0] ?? "",
      amount: "",
      expenseDate: "",
      description: "",
    });
    setOpen(true);
  }

  function openEdit(row) {
    setDialogError(null);
    setEditId(row.id);
    setForm({
      category: row.category ?? "",
      amount: String(row.amount ?? ""),
      expenseDate: row.expenseDate ? row.expenseDate.slice(0, 10) : "",
      description: row.description ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      const payload = {
        category: form.category,
        amount: Number(form.amount),
        expenseDate: new Date(form.expenseDate).toISOString(),
        description: form.description || undefined,
      };
      if (editId) {
        await apiPatch(`/expenses/${editId}`, payload);
      } else {
        await apiPost("/expenses", payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function handleDelete(row) {
    if (!window.confirm("Delete this expense?")) return;
    setError(null);
    try {
      await apiDelete(`/expenses/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Expenses</Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={openCreate}>
          Add expense
        </Button>
        <Button variant="outlined" onClick={load}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${items.length} record(s)`}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Recorded by</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{day(row.expenseDate)}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{row.description || "—"}</TableCell>
              <TableCell>{money(row.amount)}</TableCell>
              <TableCell>{row.recorderName ?? row.recordedBy}</TableCell>
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
                <Typography color="text.secondary">No expenses.</Typography>
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
          <DialogTitle>{editId ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                select
                required
                label="Category"
                value={form.category}
                onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))}
              >
                {categorySelectOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                required
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
              />
              <TextField
                required
                label="Expense date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.expenseDate}
                onChange={(ev) => setForm((f) => ({ ...f, expenseDate: ev.target.value }))}
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                multiline
                minRows={2}
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
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
