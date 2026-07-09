/**
 * Renders a generated financial report snapshot. Each report type (Income, Expense,
 * BalanceSheet, Defaulters) has its own layout; unknown types fall back to raw JSON.
 */
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayDue(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

function MetricCard({ label, value, emphasize }) {
  return (
    <Card variant="outlined" sx={{ flex: "1 1 140px", minWidth: 140 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={emphasize ? 700 : 500} color={emphasize ? "primary" : "text.primary"}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Income report: total payments collected in the selected date range.
function IncomeView({ data }) {
  const totalIncome = typeof data?.totalIncome === "number" ? data.totalIncome : 0;
  const paymentCount = typeof data?.paymentCount === "number" ? data.paymentCount : 0;
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Total income (selected range)
          </Typography>
          <Typography variant="h4" component="p" sx={{ mt: 0.5 }}>
            {money(totalIncome)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {paymentCount} payment{paymentCount === 1 ? "" : "s"} recorded
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// Expense report: total society spending recorded in the ledger for the range.
function ExpenseView({ data }) {
  const totalExpenses = typeof data?.totalExpenses === "number" ? data.totalExpenses : 0;
  const expenseCount = typeof data?.expenseCount === "number" ? data.expenseCount : 0;
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Total expenses (selected range)
          </Typography>
          <Typography variant="h4" component="p" sx={{ mt: 0.5 }}>
            {money(totalExpenses)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {expenseCount} expense{expenseCount === 1 ? "" : "s"} in ledger
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// Balance snapshot: income vs expenses for the period, net operating result, and unpaid bills.
function BalanceSheetView({ data }) {
  const periodIncome = typeof data?.periodIncome === "number" ? data.periodIncome : 0;
  const periodExpenses = typeof data?.periodExpenses === "number" ? data.periodExpenses : 0;
  const netOperating = typeof data?.netOperating === "number" ? data.netOperating : periodIncome - periodExpenses;
  const outstandingBillsTotal =
    typeof data?.outstandingBillsTotal === "number" ? data.outstandingBillsTotal : 0;
  const sum = periodIncome + periodExpenses;
  const incomePct = sum > 0 ? (periodIncome / sum) * 100 : periodIncome > 0 ? 100 : periodExpenses > 0 ? 0 : 50;
  const expensePct = sum > 0 ? (periodExpenses / sum) * 100 : periodIncome > 0 ? 0 : periodExpenses > 0 ? 100 : 50;

  return (
    <Stack spacing={2}>
      <Stack direction="row" flexWrap="wrap" gap={1.5} useFlexGap>
        <MetricCard label="Period income" value={money(periodIncome)} />
        <MetricCard label="Period expenses" value={money(periodExpenses)} />
        <MetricCard label="Net operating" value={money(netOperating)} emphasize />
        <MetricCard label="Outstanding bills" value={money(outstandingBillsTotal)} />
      </Stack>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Income vs expenses (period)
        </Typography>
        <Stack direction="row" spacing={0} sx={{ height: 28, borderRadius: 1, overflow: "hidden" }}>
          <Box
            sx={{
              width: `${incomePct}%`,
              bgcolor: "primary.main",
              minWidth: periodIncome > 0 ? 4 : 0,
              transition: "width 0.2s ease",
            }}
            title={`Income ${money(periodIncome)}`}
          />
          <Box
            sx={{
              width: `${expensePct}%`,
              bgcolor: "warning.main",
              minWidth: periodExpenses > 0 ? 4 : 0,
              transition: "width 0.2s ease",
            }}
            title={`Expenses ${money(periodExpenses)}`}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Income {money(periodIncome)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Expenses {money(periodExpenses)}
          </Typography>
        </Stack>
      </Box>
      {data?.note ? (
        <Typography variant="caption" color="text.secondary">
          {data.note}
        </Typography>
      ) : null}
    </Stack>
  );
}

// Defaulters report: list of overdue unpaid bills as of the report date range.
function DefaultersView({ data }) {
  const count = typeof data?.count === "number" ? data.count : 0;
  const bills = Array.isArray(data?.bills) ? data.bills : [];

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary">
          Overdue / unpaid bills
        </Typography>
        <Chip size="small" label={`${count} bill${count === 1 ? "" : "s"}`} color={count > 0 ? "warning" : "default"} />
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Unit</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bills.map((row) => (
            <TableRow key={row.id ?? row._id}>
              <TableCell>{row.unit?.unitNumber ?? row.unitId ?? "—"}</TableCell>
              <TableCell>{row.billType ?? "—"}</TableCell>
              <TableCell align="right">{money(typeof row.amount === "number" ? row.amount : NaN)}</TableCell>
              <TableCell>{dayDue(row.dueDate)}</TableCell>
              <TableCell>{row.effectiveStatus ?? row.status ?? "—"}</TableCell>
            </TableRow>
          ))}
          {bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No defaulters.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

// Pick the right layout based on report type returned from the generate API.
export function ReportSnapshotView({ reportType, data }) {
  if (data == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        No snapshot data.
      </Typography>
    );
  }

  switch (reportType) {
    case "Income":
      return <IncomeView data={data} />;
    case "Expense":
      return <ExpenseView data={data} />;
    case "BalanceSheet":
      return <BalanceSheetView data={data} />;
    case "Defaulters":
      return <DefaultersView data={data} />;
    default:
      return (
        <Typography component="pre" variant="body2" sx={{ whiteSpace: "pre-wrap", m: 0 }}>
          {JSON.stringify(data, null, 2)}
        </Typography>
      );
  }
}
