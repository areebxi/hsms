import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LINKS = [
  {
    to: "/resident/bills",
    title: "Bills & payments",
    desc: "View and pay outstanding bills.",
  },
  {
    to: "/resident/notices",
    title: "Notice board",
    desc: "Announcements and meetings.",
  },
  {
    to: "/resident/complaints",
    title: "Complaints",
    desc: "Submit and track tickets.",
  },
  {
    to: "/resident/polls",
    title: "Polls",
    desc: "Vote on society matters.",
  },
  {
    to: "/resident/guests",
    title: "Guest pre-approval",
    desc: "Register expected visitors for the gate.",
  },
  {
    to: "/resident/sos",
    title: "Emergency SOS",
    desc: "Alert security (use responsibly).",
  },
  {
    to: "/resident/bookings",
    title: "Facility booking",
    desc: "Book shared society amenities.",
  },
];

export function ResidentHomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Welcome</Typography>
      <Typography color="text.secondary" variant="body2">
        Billing, announcements, maintenance, voting, visitors, safety, and amenities.
      </Typography>
      <Stack spacing={2}>
        {LINKS.map((a) => (
          <Card key={a.to} variant="outlined" component={RouterLink} to={a.to} sx={{ textDecoration: "none" }}>
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
