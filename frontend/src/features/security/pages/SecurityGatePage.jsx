import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
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

import { apiGet, apiPost } from "../../../shared/api/client.js";

export function SecurityGatePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    entityType: "Visitor",
    entityId: "",
    action: "Approved",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/gate-access?limit=80");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/gate-access", form);
      setForm((f) => ({ ...f, entityId: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Gate access</Typography>
      <Typography variant="body2" color="text.secondary">
        Manual events persist to <code>gateAccessLogs</code> and call the gate adapter stub (see server console).
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack component="form" spacing={2} direction={{ xs: "column", sm: "row" }} flexWrap="wrap" onSubmit={handleSubmit}>
        <TextField
          select
          label="Entity"
          value={form.entityType}
          onChange={(ev) => setForm((f) => ({ ...f, entityType: ev.target.value }))}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="Visitor">Visitor</MenuItem>
          <MenuItem value="Staff">Staff</MenuItem>
          <MenuItem value="Resident">Resident</MenuItem>
        </TextField>
        <TextField
          required
          label="Entity id"
          value={form.entityId}
          onChange={(ev) => setForm((f) => ({ ...f, entityId: ev.target.value }))}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Action"
          value={form.action}
          onChange={(ev) => setForm((f) => ({ ...f, action: ev.target.value }))}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Denied">Denied</MenuItem>
        </TextField>
        <Button type="submit" variant="contained">
          Record
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${logs.length} event(s)`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Entity id</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}</TableCell>
              <TableCell>{row.entityType}</TableCell>
              <TableCell>{row.entityId}</TableCell>
              <TableCell>{row.action}</TableCell>
            </TableRow>
          ))}
          {!loading && logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No gate events.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
