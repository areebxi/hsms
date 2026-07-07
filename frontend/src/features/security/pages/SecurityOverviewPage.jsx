import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LINKS = [
  { to: "/security/visitors", title: "Visitor logs", desc: "Record when visitors arrive and leave." },
  { to: "/security/gate", title: "Gate access", desc: "Log who was allowed in or turned away at the gate." },
  { to: "/security/staff-attendance", title: "Staff attendance", desc: "Check domestic staff and vendors in and out." },
  { to: "/security/sos", title: "SOS alerts", desc: "View and acknowledge resident emergency alerts." },
  { to: "/security/patrols", title: "Patrols", desc: "Log patrol routes and checkpoints." },
];

export function SecurityOverviewPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Log visitors, manage gate access, handle SOS alerts, and record patrols.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {LINKS.map((a) => (
          <Card key={a.to} component={RouterLink} to={a.to} sx={{ textDecoration: "none" }}>
            <CardContent>
              <Typography variant="subtitle1" color="primary">
                {a.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {a.desc}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
