import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./shared/layout/AppShell.jsx";
import { LoginPage } from "./features/auth/pages/LoginPage.jsx";
import { AdminLayout } from "./features/admin/AdminLayout.jsx";
import { AdminOverviewPage } from "./features/admin/pages/AdminOverviewPage.jsx";
import { MembersPage } from "./features/admin/pages/MembersPage.jsx";
import { UnitsPage } from "./features/admin/pages/UnitsPage.jsx";
import { OwnershipPage } from "./features/admin/pages/OwnershipPage.jsx";
import { AdminNoticesPage } from "./features/admin/pages/AdminNoticesPage.jsx";
import { AdminComplaintsPage } from "./features/admin/pages/AdminComplaintsPage.jsx";
import { AdminPollsPage } from "./features/admin/pages/AdminPollsPage.jsx";
import { AccountantLayout } from "./features/accountant/AccountantLayout.jsx";
import { AccountantOverviewPage } from "./features/accountant/pages/AccountantOverviewPage.jsx";
import { FinanceBillsPage } from "./features/accountant/pages/FinanceBillsPage.jsx";
import { ExpensesPage } from "./features/accountant/pages/ExpensesPage.jsx";
import { ReportsPage } from "./features/accountant/pages/ReportsPage.jsx";
import { ResidentLayout } from "./features/resident/ResidentLayout.jsx";
import { ResidentOverviewPage } from "./features/resident/pages/ResidentOverviewPage.jsx";
import { ResidentBillsPage } from "./features/resident/pages/ResidentBillsPage.jsx";
import { ResidentNoticesPage } from "./features/resident/pages/ResidentNoticesPage.jsx";
import { ResidentComplaintsPage } from "./features/resident/pages/ResidentComplaintsPage.jsx";
import { ResidentPollsPage } from "./features/resident/pages/ResidentPollsPage.jsx";
import { SecurityLayout } from "./features/security/SecurityLayout.jsx";
import { SecurityOverviewPage } from "./features/security/pages/SecurityOverviewPage.jsx";
import { SecurityVisitorLogsPage } from "./features/security/pages/SecurityVisitorLogsPage.jsx";
import { SecurityGatePage } from "./features/security/pages/SecurityGatePage.jsx";
import { SecurityStaffAttendancePage } from "./features/security/pages/SecurityStaffAttendancePage.jsx";
import { SecuritySOSPage } from "./features/security/pages/SecuritySOSPage.jsx";
import { SecurityPatrolPage } from "./features/security/pages/SecurityPatrolPage.jsx";
import { AdminStaffPage } from "./features/admin/pages/AdminStaffPage.jsx";
import { AdminFacilitiesPage } from "./features/admin/pages/AdminFacilitiesPage.jsx";
import { AdminInventoryPage } from "./features/admin/pages/AdminInventoryPage.jsx";
import { ResidentGuestPage } from "./features/resident/pages/ResidentGuestPage.jsx";
import { ResidentSOSPage } from "./features/resident/pages/ResidentSOSPage.jsx";
import { ResidentBookingsPage } from "./features/resident/pages/ResidentBookingsPage.jsx";
import { GuestRoute } from "./shared/auth/GuestRoute.jsx";
import { RequireRole } from "./shared/auth/RequireRole.jsx";
import { RootLanding } from "./shared/auth/RootLanding.jsx";
import { ROLE_GROUPS } from "./shared/constants/roles.js";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<RootLanding />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole roles={ROLE_GROUPS.adminPortal}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="ownership" element={<OwnershipPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />
          <Route path="complaints" element={<AdminComplaintsPage />} />
          <Route path="polls" element={<AdminPollsPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="facilities" element={<AdminFacilitiesPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
        </Route>
        <Route
          path="/accountant"
          element={
            <RequireRole roles={ROLE_GROUPS.accountantPortal}>
              <AccountantLayout />
            </RequireRole>
          }
        >
          <Route index element={<AccountantOverviewPage />} />
          <Route path="bills" element={<FinanceBillsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route
          path="/resident"
          element={
            <RequireRole roles={ROLE_GROUPS.residentPortal}>
              <ResidentLayout />
            </RequireRole>
          }
        >
          <Route index element={<ResidentOverviewPage />} />
          <Route path="bills" element={<ResidentBillsPage />} />
          <Route path="notices" element={<ResidentNoticesPage />} />
          <Route path="complaints" element={<ResidentComplaintsPage />} />
          <Route path="polls" element={<ResidentPollsPage />} />
          <Route path="guests" element={<ResidentGuestPage />} />
          <Route path="sos" element={<ResidentSOSPage />} />
          <Route path="bookings" element={<ResidentBookingsPage />} />
        </Route>
        <Route
          path="/security"
          element={
            <RequireRole roles={ROLE_GROUPS.securityPortal}>
              <SecurityLayout />
            </RequireRole>
          }
        >
          <Route index element={<SecurityOverviewPage />} />
          <Route path="visitors" element={<SecurityVisitorLogsPage />} />
          <Route path="gate" element={<SecurityGatePage />} />
          <Route path="staff-attendance" element={<SecurityStaffAttendancePage />} />
          <Route path="sos" element={<SecuritySOSPage />} />
          <Route path="patrols" element={<SecurityPatrolPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppShell>
  );
}
