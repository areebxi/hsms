/**
 * Send an emergency SOS alert to security with an optional location note,
 * and review recent alerts and their status.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { apiGet, apiPost } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function ResidentSOSPage() {
  const [items, setItems] = useState([]); // resident's past SOS alerts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(""); // optional location or situation text

  // Load recent SOS alerts raised by this resident.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/sos/alerts?limit=20");
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

  // SOS flow: post alert to security, clear the note, and reload history.
  async function triggerSOS(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/sos/alerts", {
        locationInfo: note.trim() || undefined,
      });
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "SOS failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Emergency SOS</Typography>
      <Typography variant="body2" color="text.secondary">
        Sends an immediate alert to security. Use this only for a real emergency or an authorised drill.
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card variant="outlined">
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={triggerSOS}>
            <TextField
              label="Location / situation note (optional)"
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              multiline
              minRows={2}
            />
            <Button type="submit" variant="contained" color="error">
              Send SOS alert
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Typography variant="subtitle2">Your recent alerts</Typography>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "alert")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.locationInfo || "—"}</TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">No SOS history.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
