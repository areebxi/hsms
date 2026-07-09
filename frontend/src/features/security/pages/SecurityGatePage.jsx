/**
 * Manual gate access logging when automated gate hardware is not used.
 * Guards record whether a visitor, staff member, or resident was approved or denied.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { formatCount } from "../../../shared/utils/formatCount.js";

const LIST_LIMIT = 200;

export function SecurityGatePage() {
  const [logs, setLogs] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    entityType: "Visitor",
    entityId: "",
    action: "Approved",
  });

  // Load recent gate events plus lookup lists for the person picker.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gateData, visitorData, staffData, residentData] = await Promise.all([
        apiGet("/gate-access?limit=80"),
        apiGet(`/visitors?limit=${LIST_LIMIT}`),
        apiGet(`/staff?limit=${LIST_LIMIT}`),
        apiGet(`/users?role=Resident&limit=${LIST_LIMIT}`),
      ]);
      setLogs(gateData.items ?? []);
      setVisitors(visitorData.items ?? []);
      setStaff(staffData.items ?? []);
      setResidents(residentData.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Person dropdown changes based on whether the gate event is for a visitor, staff, or resident.
  const entityOptions = useMemo(() => {
    if (form.entityType === "Visitor") {
      return visitors.map((v) => ({
        id: v.id,
        label: v.phone ? `${v.name} (${v.phone})` : v.name,
      }));
    }
    if (form.entityType === "Staff") {
      return staff.map((s) => ({
        id: s.id,
        label: `${s.name} (${s.role})`,
      }));
    }
    return residents.map((r) => ({
      id: r.id,
      label: r.phone ? `${r.name} (${r.phone})` : r.name,
    }));
  }, [form.entityType, visitors, staff, residents]);

  const entityLabel =
    form.entityType === "Visitor"
      ? "Visitor"
      : form.entityType === "Staff"
        ? "Staff member"
        : "Resident";

  // Record an approve/deny decision for the selected person at the gate.
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiPost("/gate-access", form);
      setForm((f) => ({ ...f, entityId: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Gate access</Typography>
      <Typography variant="body2" color="text.secondary">
        Record gate access manually when the automated system is not in use.
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack
        component="form"
        spacing={2}
        direction={{ xs: "column", sm: "row" }}
        flexWrap="wrap"
        onSubmit={handleSubmit}
      >
        <TextField
          select
          label="Person type"
          value={form.entityType}
          onChange={(ev) =>
            setForm((f) => ({ ...f, entityType: ev.target.value, entityId: "" }))
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="Visitor">Visitor</MenuItem>
          <MenuItem value="Staff">Staff</MenuItem>
          <MenuItem value="Resident">Resident</MenuItem>
        </TextField>
        <TextField
          select
          required
          label={entityLabel}
          value={form.entityId}
          onChange={(ev) => setForm((f) => ({ ...f, entityId: ev.target.value }))}
          sx={{ minWidth: 220 }}
          disabled={entityOptions.length === 0}
          helperText={
            entityOptions.length === 0 ? `No ${entityLabel.toLowerCase()}s found` : undefined
          }
        >
          {entityOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
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
        <Button
          type="submit"
          variant="contained"
          disabled={!form.entityId}
        >
          Record
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(logs.length, "event")}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Person</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
              </TableCell>
              <TableCell>{row.entityType}</TableCell>
              <TableCell>{row.entityName ?? row.entityId}</TableCell>
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
