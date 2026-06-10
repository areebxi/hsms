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

const BILL_TYPE_OPTIONS = [
  { value: "Maintenance", label: "Maintenance" },
  { value: "Utility", label: "Utility bill" },
];

export function FinanceBillsPage() {
  const [bills, setBills] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ billType: "Maintenance", dueDate: "" });

  const [singleOpen, setSingleOpen] = useState(false);
  const [singleForm, setSingleForm] = useState({
    unitId: "",
    billType: "Utility",
    amount: "",
    dueDate: "",
  });

  const [units, setUnits] = useState([]);

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

  async function handleGenerate(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/bills/generate", {
        billType: genForm.billType,
        dueDate: new Date(genForm.dueDate).toISOString(),
      });
      setGenOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    }
  }

  async function handleSingleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/bills", {
        unitId: singleForm.unitId,
        billType: singleForm.billType,
        amount: Number(singleForm.amount),
        dueDate: new Date(singleForm.dueDate).toISOString(),
      });
      setSingleOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Bills & defaulters
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate maintenance or utility bills, review overdue amounts, and track payment status.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={() => setGenOpen(true)}>
          Generate (occupied units)
        </Button>
        <Button variant="outlined" onClick={() => setSingleOpen(true)}>
          Add single bill
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
            {loading ? "Loading…" : `${defaulters.length} bill(s)`}
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

      <Dialog open={genOpen} onClose={() => setGenOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleGenerate}>
          <DialogTitle>Generate bills for occupied units</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                required
                label="Bill type"
                value={genForm.billType}
                onChange={(ev) => setGenForm((f) => ({ ...f, billType: ev.target.value }))}
              >
                {BILL_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Due date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={genForm.dueDate}
                onChange={(ev) => setGenForm((f) => ({ ...f, dueDate: ev.target.value }))}
                required
              />
              <Typography variant="caption" color="text.secondary">
                Uses each occupied unit&apos;s monthlyCharges as amount. Skips duplicates for same unit, type, and due
                date.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setGenOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Generate
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={singleOpen} onClose={() => setSingleOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleSingleCreate}>
          <DialogTitle>Add bill for one unit</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
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
                select
                required
                label="Bill type"
                value={singleForm.billType}
                onChange={(ev) => setSingleForm((f) => ({ ...f, billType: ev.target.value }))}
              >
                {BILL_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
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
            <Button type="button" onClick={() => setSingleOpen(false)}>
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
