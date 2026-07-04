import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/units", label: "Units" },
  { to: "/admin/ownership", label: "Ownership & tenancy" },
  { to: "/admin/notices", label: "Notices" },
  { to: "/admin/complaints", label: "Complaint & suggestion box" },
  { to: "/admin/polls", label: "Polls" },
  { to: "/admin/staff", label: "Staff registry" },
  { to: "/admin/facilities", label: "Facilities" },
  { to: "/admin/inventory", label: "Inventory" },
];

export function AdminLayout() {
  return (
    <PortalLayout
      title="Admin"
      subtitle="Manage members, units, notices, and society operations"
      links={LINKS}
    >
      <Outlet />
    </PortalLayout>
  );
}
