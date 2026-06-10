import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LINKS = [
  { to: "/accountant/bills", title: "Bills", desc: "Generate recurring charges, manual bills, defaulters." },
  { to: "/accountant/expenses", title: "Expenses", desc: "Record society expenditures by category." },
  { to: "/accountant/reports", title: "Reports", desc: "Income, expense, balance snapshot, defaulters export." },
];

export function AccountantHomePage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Finance overview</Typography>
      <Typography color="text.secondary" variant="body2">
        Billing, expenses, and financial reports. Residents record card payments from their bills page.
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
