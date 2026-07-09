/**
 * Accountant portal home page. Links to the three main finance areas:
 * billing, expense logging, and financial reports.
 */
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// Quick navigation cards for each accountant workflow.
const LINKS = [
  { to: "/accountant/bills", title: "Bills & defaulters", desc: "Generate maintenance bills, add utility bills, and see who has not paid." },
  { to: "/accountant/expenses", title: "Expenses", desc: "Log society spending by category." },
  { to: "/accountant/reports", title: "Financial reports", desc: "Generate income, expense, and balance reports." },
];

export function AccountantOverviewPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Overview</Typography>
      <Typography color="text.secondary" variant="body2">
        Issue bills, record expenses, and run financial reports. Residents pay from their own bills page.
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
