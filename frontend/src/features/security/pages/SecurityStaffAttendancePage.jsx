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
import { apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";

export function SecurityStaffAttendancePage() {
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [open, setOpen] = useState(false);
  const [staffId, setStaffId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sData, aData] = await Promise.all([
        apiGet("/staff?limit=200"),
        apiGet("/staff-attendance?limit=100"),
      ]);
      setStaff(sData.items ?? []);
      setRows(aData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckIn(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/staff-attendance", { staffId });
      setOpen(false);
      setStaffId("");
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Check-in failed");
    }
  }

  async function handleCheckOut(id) {
    setError(null);
    try {
      await apiPatch(`/staff-attendance/${id}`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-out failed");
    }
  }

  const openRows = rows.filter((r) => !r.exitTime);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Staff attendance</Typography>
      <Typography variant="body2" color="text.secondary">
        Staff profiles are managed by Admin. Check residents&apos; domestic staff / vendors in and out.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setDialogError(null);
          setOpen(true);
        }}
        sx={{ alignSelf: "flex-start" }}
      >
        Check in
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${openRows.length} open visit(s)`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Staff</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>In</TableCell>
            <TableCell>Out</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.staffName ?? row.staffId}</TableCell>
              <TableCell>{row.staffRole ?? "—"}</TableCell>
              <TableCell>{row.entryTime ? new Date(row.entryTime).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.exitTime ? new Date(row.exitTime).toLocaleString() : "—"}</TableCell>
              <TableCell align="right">
                {!row.exitTime && (
                  <Button size="small" onClick={() => handleCheckOut(row.id)}>
                    Check out
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No attendance records.</Typography>
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
        maxWidth="xs"
      >
        <form onSubmit={handleCheckIn}>
          <DialogTitle>Check in staff</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                select
                required
                fullWidth
                label="Staff member"
                value={staffId}
                onChange={(ev) => setStaffId(ev.target.value)}
              >
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.role})
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
            <Button type="submit" variant="contained" disabled={staff.length === 0}>
              Check in
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
