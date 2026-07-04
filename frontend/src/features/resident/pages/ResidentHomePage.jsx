import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LINKS = [
  {
    to: "/resident/bills",
    title: "Bills & payments",
    desc: "See your bills and pay online.",
  },
  {
    to: "/resident/notices",
    title: "Notice board",
    desc: "Society announcements, meetings, and updates.",
  },
  {
    to: "/resident/complaints",
    title: "Complaint & suggestion box",
    desc: "Report a problem or share a suggestion, then follow its progress.",
  },
  {
    to: "/resident/polls",
    title: "Polls",
    desc: "Vote in society polls and elections.",
  },
  {
    to: "/resident/guests",
    title: "Guest approval",
    desc: "Tell security who is visiting and when.",
  },
  {
    to: "/resident/sos",
    title: "Emergency SOS",
    desc: "Send an urgent alert to security.",
  },
  {
    to: "/resident/bookings",
    title: "Facility booking",
    desc: "Book the clubhouse, courts, pool, and other shared facilities.",
  },
];

export function ResidentHomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Overview</Typography>
      <Typography color="text.secondary" variant="body2">
        Pay bills, read notices, raise complaints, vote in polls, approve guests, and book facilities.
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
