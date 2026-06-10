import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LINKS = [
  { to: "/security/visitors", title: "Visitors & logs", desc: "Log entry and exit." },
  { to: "/security/gate", title: "Gate access", desc: "Manual gate events and access records." },
  { to: "/security/staff-attendance", title: "Staff attendance", desc: "Check-in / check-out." },
  { to: "/security/sos", title: "SOS inbox", desc: "Acknowledge resident alerts." },
  { to: "/security/patrols", title: "Patrols", desc: "Route checkpoints." },
];

export function SecurityHomePage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Quick links for guard workflows and society coverage areas.
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
