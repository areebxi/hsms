// Accountant portal layout — billing, expenses, and reports sections.
import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/accountant", label: "Overview", end: true },
  { to: "/accountant/bills", label: "Bills & defaulters" },
  { to: "/accountant/expenses", label: "Expenses" },
  { to: "/accountant/reports", label: "Financial reports" },
];

export function AccountantLayout() {
  return (
    <PortalLayout title="Accountant" subtitle="Billing, expenses, and reports" links={LINKS}>
      <Outlet />
    </PortalLayout>
  );
}
