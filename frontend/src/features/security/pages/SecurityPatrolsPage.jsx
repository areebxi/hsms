/**
 * Patrol workflow: define routes, start a session, log checkpoints along the route,
 * then complete the patrol. Only one in-progress session per guard at a time.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { formatCount } from "../../../shared/utils/formatCount.js";

export function SecurityPatrolsPage() {
  const [routes, setRoutes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeForm, setRouteForm] = useState({ routeId: "", checkpointCount: 3 });
  const [actionLoading, setActionLoading] = useState(false);

  // Load routes, past sessions, and any in-progress session (with its checkpoints).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesData, sessionsData, activeData] = await Promise.all([
        apiGet("/patrol-routes?limit=100"),
        apiGet("/patrol-sessions?limit=50&mine=true"),
        apiGet("/patrol-sessions?limit=1&mine=true&status=in_progress"),
      ]);
      const routeItems = routesData.items ?? [];
      const sessionItems = sessionsData.items ?? [];
      const active = (activeData.items ?? [])[0] ?? null;

      setRoutes(routeItems);
      setSessions(sessionItems);
      setActiveSession(active);
      setSelectedRouteId((prev) => prev || routeItems[0]?.routeId || "");

      if (active?.id) {
        const cpData = await apiGet(`/patrol-sessions/${active.id}/checkpoints`);
        setCheckpoints(cpData.items ?? []);
      } else {
        setCheckpoints([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddRoute(e) {
    e.preventDefault();
    setDialogError(null);
    try {
      await apiPost("/patrol-routes", {
        routeId: routeForm.routeId.trim(),
        checkpointCount: Number(routeForm.checkpointCount),
      });
      setRouteDialogOpen(false);
      setRouteForm({ routeId: "", checkpointCount: 3 });
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Failed to add route");
    }
  }

  // Begin a new patrol session for the chosen route.
  async function handleStartPatrol(e) {
    e.preventDefault();
    if (!selectedRouteId) return;
    setError(null);
    setSuccess(null);
    setActionLoading(true);
    try {
      await apiPost("/patrol-sessions", { routeId: selectedRouteId });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start patrol");
    } finally {
      setActionLoading(false);
    }
  }

  // Record the next checkpoint reached during the active patrol.
  async function handleLogCheckpoint() {
    if (!activeSession?.id) return;
    setError(null);
    setSuccess(null);
    setActionLoading(true);
    try {
      await apiPost(`/patrol-sessions/${activeSession.id}/checkpoints`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log checkpoint");
    } finally {
      setActionLoading(false);
    }
  }

  // End the patrol session; guard may confirm early if not all checkpoints were logged.
  async function handleCompletePatrol() {
    if (!activeSession?.id) return;
    const logged = activeSession.checkpointsLogged ?? 0;
    const total = activeSession.checkpointCount ?? 0;
    if (logged < total) {
      const ok = window.confirm(
        `Only ${logged} of ${total} checkpoints logged. Complete this patrol anyway?`
      );
      if (!ok) return;
    }
    setError(null);
    setSuccess(null);
    setActionLoading(true);
    try {
      const result = await apiPatch(`/patrol-sessions/${activeSession.id}/complete`, {});
      setSuccess(
        result.isComplete
          ? "Route completed — all checkpoints logged."
          : `Route completed with ${result.checkpointsLogged}/${result.checkpointCount} checkpoints logged.`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete patrol");
    } finally {
      setActionLoading(false);
    }
  }

  const checkpointsLogged = activeSession?.checkpointsLogged ?? 0;
  const checkpointTotal = activeSession?.checkpointCount ?? 0;
  // Disable further checkpoint logging once the route quota is met.
  const atMaxCheckpoints = checkpointsLogged >= checkpointTotal && checkpointTotal > 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Patrols</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Define patrol routes, start a patrol, log checkpoints, and complete the route.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">Patrol routes</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setDialogError(null);
              setRouteDialogOpen(true);
            }}
          >
            Add route
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Route ID</TableCell>
              <TableCell>Checkpoints</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {routes.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.routeId}</TableCell>
                <TableCell>{row.checkpointCount}</TableCell>
              </TableRow>
            ))}
            {!loading && routes.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography color="text.secondary">No routes defined yet. Add one to start patrolling.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Active patrol
          </Typography>
          {activeSession ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body1">
                  {activeSession.routeId} — checkpoint {checkpointsLogged}/{checkpointTotal}
                </Typography>
                <Chip label="In progress" size="small" color="primary" />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleLogCheckpoint}
                  disabled={actionLoading || atMaxCheckpoints}
                >
                  Log checkpoint
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleCompletePatrol}
                  disabled={actionLoading}
                >
                  Complete route
                </Button>
              </Stack>
              {checkpoints.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Checkpoint</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checkpoints.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.checkpointNumber ?? "—"}</TableCell>
                        <TableCell>
                          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          ) : (
            <Stack
              component="form"
              spacing={2}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "flex-start" }}
              onSubmit={handleStartPatrol}
            >
              <TextField
                select
                label="Route"
                value={selectedRouteId}
                onChange={(ev) => setSelectedRouteId(ev.target.value)}
                required
                disabled={routes.length === 0}
                sx={{ minWidth: 200 }}
              >
                {routes.map((r) => (
                  <MenuItem key={r.id} value={r.routeId}>
                    {r.routeId} ({r.checkpointCount} checkpoints)
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading || routes.length === 0 || !selectedRouteId}
              >
                Start patrol
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Patrol history
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {loading ? "Loading…" : formatCount(sessions.length, "patrol session", "patrol sessions")}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Route</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.routeId}</TableCell>
                <TableCell>
                  {row.checkpointsLogged ?? 0}/{row.checkpointCount}
                </TableCell>
                <TableCell>{row.startedAt ? new Date(row.startedAt).toLocaleString() : "—"}</TableCell>
                <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString() : "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status === "completed" ? "Completed" : "In progress"}
                    size="small"
                    color={row.status === "completed" ? "default" : "primary"}
                    variant={row.status === "completed" ? "outlined" : "filled"}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!loading && sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No patrol sessions yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog
        open={routeDialogOpen}
        onClose={() => {
          setDialogError(null);
          setRouteDialogOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <form onSubmit={handleAddRoute}>
          <DialogTitle>Add patrol route</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                label="Route ID"
                value={routeForm.routeId}
                onChange={(ev) => setRouteForm((f) => ({ ...f, routeId: ev.target.value }))}
                required
                fullWidth
                placeholder="e.g. Route-A"
              />
              <TextField
                label="Number of checkpoints"
                type="number"
                value={routeForm.checkpointCount}
                onChange={(ev) =>
                  setRouteForm((f) => ({ ...f, checkpointCount: ev.target.value }))
                }
                required
                fullWidth
                inputProps={{ min: 1, max: 100 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setRouteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Add route
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
