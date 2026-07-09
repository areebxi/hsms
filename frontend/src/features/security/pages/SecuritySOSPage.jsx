/**
 * Open SOS alerts raised by residents. Security reviews each alert and
 * acknowledges it once they have responded to the emergency.
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

import { apiGet, apiPost } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/utils/formatCount.js";

export function SecuritySOSPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only show alerts that still need a security response.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/sos/alerts?limit=50&status=Open");
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

  // Tell the system this alert has been seen and handled; it leaves the open list.
  async function acknowledge(id) {
    setError(null);
    try {
      await apiPost(`/sos/alerts/${id}/acknowledge`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Acknowledgement failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">SOS alerts</Typography>
      <Typography variant="body2" color="text.secondary">
        Open emergency alerts from residents. Acknowledge each one when you have responded.
      </Typography>
      <Button variant="outlined" onClick={load} sx={{ alignSelf: "flex-start" }}>
        Refresh
      </Button>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "open alert", "open alerts")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>When</TableCell>
            <TableCell>Resident</TableCell>
            <TableCell>Location / note</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.triggerName ?? row.triggerPhone ?? row.triggeredBy}</TableCell>
              <TableCell>{row.locationInfo || "—"}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="contained" color="warning" onClick={() => acknowledge(row.id)}>
                  Acknowledge
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No open SOS alerts.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
