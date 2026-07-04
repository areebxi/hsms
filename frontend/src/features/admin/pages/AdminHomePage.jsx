import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const AREAS = [
  { to: "/admin/members", title: "Members", desc: "Add residents and search the member directory with contact and vehicle details." },
  { to: "/admin/units", title: "Units", desc: "Set up flats and plots — type, floor, charges, and who lives there." },
  { to: "/admin/ownership", title: "Ownership & tenancy", desc: "Record who owns or rents each unit, including past assignments." },
  { to: "/admin/notices", title: "Notices", desc: "Post announcements and meeting updates for residents." },
  { to: "/admin/complaints", title: "Complaint & suggestion box", desc: "Review complaints and suggestions from residents and update their status." },
  { to: "/admin/polls", title: "Polls", desc: "Create polls and elections for society decisions." },
  {
    to: "/admin/staff",
    title: "Staff registry",
    desc: "Register domestic staff and vendors for gate check-in.",
  },
  {
    to: "/admin/facilities",
    title: "Facilities",
    desc: "Set up facilities residents can book.",
  },
  {
    to: "/admin/inventory",
    title: "Inventory",
    desc: "Track society equipment and assets.",
  },
];

export function AdminHomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Overview</Typography>
      <Typography color="text.secondary">
        Register members, manage units and ownership, and run day-to-day society operations.
      </Typography>
      <Stack spacing={2}>
        {AREAS.map((a) => (
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
