/**
 * Bills management for accountants. Supports bulk maintenance bill generation,
 * one-off utility bills per unit, and tracking overdue unpaid bills (defaulters).
 * Residents pay bills from their own portal; this page is for issuing and monitoring.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { apiGet, apiPost } from "../../../shared/api/client.js";
import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { formatCount } from "../../../shared/formatCount.js";

function money(n) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function day(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

export function AccountantBillsPage() {
  const [bills, setBills] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);

  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ dueDate: "" });

  const [singleOpen, setSingleOpen] = useState(false);
  const [singleForm, setSingleForm] = useState({
    unitId: "",
    amount: "",
    dueDate: "",
  });

  const [units, setUnits] = useState([]);

  // Fetch recent bills, overdue defaulters, and unit list (needed for utility bill form).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bData, dData, uData] = await Promise.all([
        apiGet("/bills?limit=100"),
        apiGet("/bills/defaulters"),
        apiGet("/units?limit=200"),
      ]);
      setBills(bData.items ?? []);
      setDefaulters(dData.items ?? []);
      setUnits(uData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Bulk-create maintenance bills for every occupied unit using each unit's monthly charge.
  // The server skips duplicates for the same unit, bill type, and due date.
  async function handleGenerate(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/bills/generate", {
        billType: "Maintenance",
        dueDate: new Date(genForm.dueDate).toISOString(),
      });
      setGenOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Generate failed");
    }
  }

  // Create a single utility bill for one unit with a custom amount and due date.
  async function handleSingleCreate(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/bills", {
        unitId: singleForm.unitId,
        billType: "Utility",
        amount: Number(singleForm.amount),
        dueDate: new Date(singleForm.dueDate).toISOString(),
      });
      setSingleOpen(false);
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Bills & defaulters
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate maintenance bills for occupied units, add utility bills, and see what is overdue.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          onClick={() => {
            setDialogError(null);
            setGenOpen(true);
          }}
        >
          Generate maintenance bills
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setDialogError(null);
            setSingleOpen(true);
          }}
        >
          Add utility bill
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

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Defaulters (past due, unpaid)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            {loading ? "Loading…" : formatCount(defaulters.length, "overdue bill", "overdue bills")}
          </Typography>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Unit</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defaulters.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
                    <TableCell>{row.billType}</TableCell>
                    <TableCell>{money(row.amount)}</TableCell>
                    <TableCell>{day(row.dueDate)}</TableCell>
                    <TableCell>{row.effectiveStatus ?? row.status}</TableCell>
                  </TableRow>
                ))}
                {!loading && defaulters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No defaulters.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Recent bills
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Unit</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Effective</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
                    <TableCell>{row.billType}</TableCell>
                    <TableCell>{money(row.amount)}</TableCell>
                    <TableCell>{day(row.dueDate)}</TableCell>
                    <TableCell>{row.effectiveStatus ?? row.status}</TableCell>
                  </TableRow>
                ))}
                {!loading && bills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No bills yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={genOpen}
        onClose={() => {
          setDialogError(null);
          setGenOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleGenerate}>
          <DialogTitle>Generate maintenance bills for occupied units</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                label="Due date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={genForm.dueDate}
                onChange={(ev) => setGenForm((f) => ({ ...f, dueDate: ev.target.value }))}
                required
              />
              <Typography variant="caption" color="text.secondary">
                Creates one maintenance bill per occupied unit using its monthly maintenance charge. Duplicate bills for
                the same unit, type, and due date are skipped.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setGenOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Generate
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={singleOpen}
        onClose={() => {
          setDialogError(null);
          setSingleOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSingleCreate}>
          <DialogTitle>Add utility bill</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                select
                required
                label="Unit"
                value={singleForm.unitId}
                onChange={(ev) => setSingleForm((f) => ({ ...f, unitId: ev.target.value }))}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitNumber} ({u.unitType})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Amount"
                type="number"
                value={singleForm.amount}
                onChange={(ev) => setSingleForm((f) => ({ ...f, amount: ev.target.value }))}
                required
              />
              <TextField
                label="Due date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={singleForm.dueDate}
                onChange={(ev) => setSingleForm((f) => ({ ...f, dueDate: ev.target.value }))}
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setSingleOpen(false);
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
    </Stack>
  );
}
