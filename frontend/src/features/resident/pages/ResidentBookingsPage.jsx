import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
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

import { apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";

export function ResidentBookingsPage() {
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [occupied, setOccupied] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    facilityId: "",
    date: "",
    timeSlotStart: "",
    timeSlotEnd: "",
  });

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, b] = await Promise.all([apiGet("/facilities?limit=100"), apiGet("/bookings?limit=50")]);
      setFacilities(f.items ?? []);
      setBookings(b.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  const loadSlots = useCallback(async () => {
    if (!form.facilityId || !form.date) {
      setOccupied([]);
      return;
    }
    try {
      const q = encodeURIComponent(`${form.date}T12:00:00`);
      const data = await apiGet(`/facilities/${form.facilityId}/slots?date=${q}`);
      setOccupied(data.slots ?? []);
    } catch {
      setOccupied([]);
    }
  }, [form.facilityId, form.date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  async function submitBooking(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/bookings", {
        facilityId: form.facilityId,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        timeSlotStart: formatTimeForApi(form.timeSlotStart),
        timeSlotEnd: formatTimeForApi(form.timeSlotEnd),
      });
      setForm((f) => ({ ...f, timeSlotStart: "", timeSlotEnd: "" }));
      await loadCore();
      await loadSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this booking?")) return;
    setError(null);
    try {
      await apiPatch(`/bookings/${id}`, { status: "Cancelled" });
      await loadCore();
      await loadSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Facility booking</Typography>
      <Typography variant="body2" color="text.secondary">
        Book shared facilities; overlapping times are rejected by the server.
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            New booking
          </Typography>
          <Stack component="form" spacing={2} onSubmit={submitBooking}>
            <TextField
              select
              required
              label="Facility"
              value={form.facilityId}
              onChange={(ev) => setForm((f) => ({ ...f, facilityId: ev.target.value }))}
            >
              {facilities.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                  {x.type ? ` (${x.type})` : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              label="Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(ev) => setForm((f) => ({ ...f, date: ev.target.value }))}
            />
            <TextField
              required
              label="Start"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.timeSlotStart}
              onChange={(ev) => setForm((f) => ({ ...f, timeSlotStart: ev.target.value }))}
            />
            <TextField
              required
              label="End"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.timeSlotEnd}
              onChange={(ev) => setForm((f) => ({ ...f, timeSlotEnd: ev.target.value }))}
            />
            {occupied.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Already booked that day:{" "}
                {occupied.map((s) => `${s.timeSlotStart}–${s.timeSlotEnd}`).join("; ")}
              </Typography>
            )}
            <Button type="submit" variant="contained" disabled={facilities.length === 0}>
              Request booking
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="subtitle2">My bookings</Typography>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${bookings.length} record(s)`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Facility</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Slot</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.facilityName ?? row.facilityId}</TableCell>
              <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                {row.timeSlotStart} – {row.timeSlotEnd}
              </TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell align="right">
                {row.status === "Confirmed" && (
                  <Button size="small" color="warning" onClick={() => cancelBooking(row.id)}>
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && bookings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No bookings yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

/** Normalize HTML time (often HH:MM:SS) to HH:mm for API */
function formatTimeForApi(v) {
  const s = String(v).trim();
  const parts = s.split(":");
  const h = String(Number(parts[0])).padStart(2, "0");
  const m = String(Number(parts[1] ?? 0)).padStart(2, "0");
  return `${h}:${m}`;
}
