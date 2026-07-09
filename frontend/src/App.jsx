// Top-level route table — maps URLs to role portals and wraps each area with auth guards.
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./shared/layout/AppShell.jsx";
import { LoginPage } from "./features/auth/pages/LoginPage.jsx";
import { AdminLayout } from "./features/admin/AdminLayout.jsx";
import { AdminOverviewPage } from "./features/admin/pages/AdminOverviewPage.jsx";
import { AdminMembersPage } from "./features/admin/pages/AdminMembersPage.jsx";
import { AdminUnitsPage } from "./features/admin/pages/AdminUnitsPage.jsx";
import { AdminOwnershipPage } from "./features/admin/pages/AdminOwnershipPage.jsx";
import { AdminNoticesPage } from "./features/admin/pages/AdminNoticesPage.jsx";
import { AdminComplaintPage } from "./features/admin/pages/AdminComplaintPage.jsx";
import { AdminPollsPage } from "./features/admin/pages/AdminPollsPage.jsx";
import { AccountantLayout } from "./features/accountant/AccountantLayout.jsx";
import { AccountantOverviewPage } from "./features/accountant/pages/AccountantOverviewPage.jsx";
import { AccountantBillsPage } from "./features/accountant/pages/AccountantBillsPage.jsx";
import { AccountantExpensesPage } from "./features/accountant/pages/AccountantExpensesPage.jsx";
import { AccountantReportsPage } from "./features/accountant/pages/AccountantReportsPage.jsx";
import { ResidentLayout } from "./features/resident/ResidentLayout.jsx";
import { ResidentOverviewPage } from "./features/resident/pages/ResidentOverviewPage.jsx";
import { ResidentBillsPage } from "./features/resident/pages/ResidentBillsPage.jsx";
import { ResidentNoticesPage } from "./features/resident/pages/ResidentNoticesPage.jsx";
import { ResidentComplaintPage } from "./features/resident/pages/ResidentComplaintPage.jsx";
import { ResidentPollsPage } from "./features/resident/pages/ResidentPollsPage.jsx";
import { SecurityLayout } from "./features/security/SecurityLayout.jsx";
import { SecurityOverviewPage } from "./features/security/pages/SecurityOverviewPage.jsx";
import { SecurityVisitorLogsPage } from "./features/security/pages/SecurityVisitorLogsPage.jsx";
import { SecurityGatePage } from "./features/security/pages/SecurityGatePage.jsx";
import { SecurityStaffAttendancePage } from "./features/security/pages/SecurityStaffAttendancePage.jsx";
import { SecuritySOSPage } from "./features/security/pages/SecuritySOSPage.jsx";
import { SecurityPatrolsPage } from "./features/security/pages/SecurityPatrolsPage.jsx";
import { AdminStaffPage } from "./features/admin/pages/AdminStaffPage.jsx";
import { AdminFacilitiesPage } from "./features/admin/pages/AdminFacilitiesPage.jsx";
import { AdminInventoryPage } from "./features/admin/pages/AdminInventoryPage.jsx";
import { ResidentGuestApprovalPage } from "./features/resident/pages/ResidentGuestApprovalPage.jsx";
import { ResidentSOSPage } from "./features/resident/pages/ResidentSOSPage.jsx";
import { ResidentFacilityPage } from "./features/resident/pages/ResidentFacilityPage.jsx";
import { GuestRoute } from "./shared/auth/GuestRoute.jsx";
import { RequireRole } from "./shared/auth/RequireRole.jsx";
import { RootLanding } from "./shared/auth/RootLanding.jsx";
import { ROLE_GROUPS } from "./shared/constants/roles.js";

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* "/" sends logged-in users to their portal, everyone else to login */}
        <Route path="/" element={<RootLanding />} />
        {/* Login is guest-only — already signed in? GuestRoute bounces you to your home */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        {/* Each portal layout nests child routes; RequireRole checks JWT + role before rendering */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={ROLE_GROUPS.adminPortal}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="units" element={<AdminUnitsPage />} />
          <Route path="ownership" element={<AdminOwnershipPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />
          <Route path="complaints" element={<AdminComplaintPage />} />
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
          <Route path="bills" element={<AccountantBillsPage />} />
          <Route path="expenses" element={<AccountantExpensesPage />} />
          <Route path="reports" element={<AccountantReportsPage />} />
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
          <Route path="complaints" element={<ResidentComplaintPage />} />
          <Route path="polls" element={<ResidentPollsPage />} />
          <Route path="guests" element={<ResidentGuestApprovalPage />} />
          <Route path="sos" element={<ResidentSOSPage />} />
          <Route path="bookings" element={<ResidentFacilityPage />} />
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
          <Route path="patrols" element={<SecurityPatrolsPage />} />
        </Route>
        {/* Unknown paths fall back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppShell>
  );
}
