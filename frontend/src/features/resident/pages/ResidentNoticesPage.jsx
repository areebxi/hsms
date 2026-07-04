import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import { apiGet } from "../../../shared/api/client.js";
import { formatCount } from "../../../shared/formatCount.js";

function priorityChipProps(priority) {
  const p = String(priority || "").toLowerCase();
  if (p.includes("high"))
    return { color: "error", variant: "outlined" };
  if (p.includes("medium"))
    return { color: "warning", variant: "outlined" };
  if (p.includes("low")) return { color: "success", variant: "outlined" };
  return { variant: "outlined" };
}

export function ResidentNoticesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/notices?limit=100");
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

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Notice board
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Announcements and updates posted by the society office.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : formatCount(items.length, "notice")}
      </Typography>
      <Stack spacing={2}>
        {items.map((n) => (
          <Card key={n.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} flexWrap="wrap">
                <Typography variant="subtitle1" fontWeight={600}>
                  {n.title}
                </Typography>
                {n.priority ? (
                  <Chip size="small" label={n.priority} {...priorityChipProps(n.priority)} />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, mb: 1 }}>
                {n.postedAt ? new Date(n.postedAt).toLocaleString() : ""}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {n.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
        {!loading && items.length === 0 && (
          <Typography color="text.secondary">No notices published.</Typography>
        )}
      </Stack>
    </Stack>
  );
}
