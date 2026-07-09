/**
 * Admin inventory tracking. The admin can search, add, edit, and delete
 * society equipment and fixed assets (quantity, condition, purchase date).
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

import { apiDelete, apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  // Search box input vs applied query (list reloads when appliedSearch changes).
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [form, setForm] = useState({
    itemName: "",
    category: "",
    quantity: "0",
    condition: "",
    purchaseDate: "",
    status: "",
  });

  // Fetch inventory items, optionally filtered by search query.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = appliedSearch.trim() ? `?limit=200&q=${encodeURIComponent(appliedSearch.trim())}` : "?limit=200";
      const data = await apiGet(`/inventory${q}`);
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch]);

  // Reload list when the page mounts or the search filter changes.
  useEffect(() => {
    load();
  }, [load]);

  // Reset form and open the dialog for a new inventory item.
  function openCreate() {
    setDialogError(null);
    setEdit(null);
    setForm({
      itemName: "",
      category: "",
      quantity: "0",
      condition: "",
      purchaseDate: "",
      status: "",
    });
    setOpen(true);
  }

  // Fill the form with an existing item's data for editing.
  function openEdit(row) {
    setDialogError(null);
    setEdit(row);
    const pd = row.purchaseDate ? String(row.purchaseDate).slice(0, 10) : "";
    setForm({
      itemName: row.itemName ?? "",
      category: row.category ?? "",
      quantity: row.quantity != null ? String(row.quantity) : "0",
      condition: row.condition ?? "",
      purchaseDate: pd,
      status: row.status ?? "",
    });
    setOpen(true);
  }

  // Create or update an inventory item depending on whether edit is set.
  async function handleSave(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      const payload = {
        itemName: form.itemName.trim(),
        category: form.category.trim() || undefined,
        quantity: Number(form.quantity) || 0,
        condition: form.condition.trim() || undefined,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate + "T12:00:00").toISOString() : undefined,
        status: form.status.trim() || undefined,
      };
      if (edit) {
        const patch = {
          itemName: form.itemName.trim(),
          category: form.category.trim(),
          quantity: Number(form.quantity) || 0,
          condition: form.condition.trim(),
          status: form.status.trim(),
          purchaseDate: form.purchaseDate ? new Date(`${form.purchaseDate}T12:00:00`).toISOString() : null,
        };
        await apiPatch(`/inventory/${edit.id}`, patch);
      } else {
        await apiPost("/inventory", payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Save failed");
    }
  }

  // Remove an inventory item after confirmation.
  async function handleDelete(row) {
    if (!window.confirm(`Remove “${row.itemName}” from inventory?`)) return;
    try {
      await apiDelete(`/inventory/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Inventory</Typography>
      <Typography variant="body2" color="text.secondary">
        Keep track of society equipment and fixed assets.
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <TextField
          size="small"
          label="Search"
          value={searchDraft}
          onChange={(ev) => setSearchDraft(ev.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Button variant="outlined" size="small" onClick={() => setAppliedSearch(searchDraft)}>
          Apply
        </Button>
        <Button variant="contained" onClick={openCreate}>
          Add item
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "item")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Condition</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Managed by</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.itemName}</TableCell>
              <TableCell>{row.category || "—"}</TableCell>
              <TableCell align="right">{row.quantity}</TableCell>
              <TableCell>{row.condition || "—"}</TableCell>
              <TableCell>{row.status || "—"}</TableCell>
              <TableCell>{row.managerName || row.managedBy}</TableCell>
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
              <TableCell colSpan={7}>
                <Typography color="text.secondary">No inventory rows.</Typography>
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
          <DialogTitle>{edit ? "Edit item" : "Add item"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Item name"
                value={form.itemName}
                onChange={(ev) => setForm((f) => ({ ...f, itemName: ev.target.value }))}
              />
              <TextField label="Category" value={form.category} onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))} />
              <TextField
                label="Quantity"
                type="number"
                inputProps={{ min: 0 }}
                value={form.quantity}
                onChange={(ev) => setForm((f) => ({ ...f, quantity: ev.target.value }))}
              />
              <TextField label="Condition" value={form.condition} onChange={(ev) => setForm((f) => ({ ...f, condition: ev.target.value }))} />
              <TextField
                label="Purchase date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.purchaseDate}
                onChange={(ev) => setForm((f) => ({ ...f, purchaseDate: ev.target.value }))}
              />
              <TextField label="Status (e.g. In use, Stored)" value={form.status} onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))} />
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
