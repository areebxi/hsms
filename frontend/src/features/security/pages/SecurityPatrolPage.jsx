import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
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
import { formatCount } from "../../../shared/formatCount.js";

export function SecurityPatrolPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeId, setRouteId] = useState("Route-A");
  const [checkpointId, setCheckpointId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/patrols?limit=80&mine=true");
      setLogs(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLog(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/patrols", {
        routeId: routeId.trim(),
        checkpointId: checkpointId.trim() || undefined,
      });
      setCheckpointId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Log failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Security patrols</Typography>
      <Typography variant="body2" color="text.secondary">
        Log each checkpoint as you complete your patrol route.
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack component="form" spacing={2} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "flex-start" }} onSubmit={handleLog}>
        <TextField label="Route ID" value={routeId} onChange={(ev) => setRouteId(ev.target.value)} required />
        <TextField label="Checkpoint (optional)" value={checkpointId} onChange={(ev) => setCheckpointId(ev.target.value)} />
        <Button type="submit" variant="contained">
          Log checkpoint
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(logs.length, "patrol entry", "patrol entries")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Checkpoint</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.routeId}</TableCell>
              <TableCell>{row.checkpointId || "—"}</TableCell>
            </TableRow>
          ))}
          {!loading && logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">No patrol logs yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
