import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const AREAS = [
  { to: "/admin/members", title: "Members", desc: "Register residents, directory search, contact & vehicle details." },
  { to: "/admin/units", title: "Units", desc: "Unit types, floors, monthly charges, occupancy status." },
  { to: "/admin/ownership", title: "Ownership & tenancy", desc: "Link residents to units; history with start/end dates." },
  { to: "/admin/notices", title: "Notices", desc: "Publish announcements and notices on the notice board." },
  { to: "/admin/complaints", title: "Complaints", desc: "Track resident tickets and status." },
  { to: "/admin/polls", title: "Polls", desc: "Create general polls or elections/votings/surveys." },
  {
    to: "/admin/staff",
    title: "Staff registry",
    desc: "Maids, drivers, vendors — used by security attendance.",
  },
  {
    to: "/admin/facilities",
    title: "Facilities",
    desc: "Define bookable amenities for residents.",
  },
  {
    to: "/admin/inventory",
    title: "Inventory",
    desc: "Society assets and fixed stock (quantity, condition, status).",
  },
];

export function AdminHomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Overview</Typography>
      <Typography color="text.secondary">
        Members, units, ownership, society operations, and communication.
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
