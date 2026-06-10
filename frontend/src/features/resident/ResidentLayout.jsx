import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/resident", label: "Overview", end: true },
  { to: "/resident/bills", label: "Bills & pay" },
  { to: "/resident/notices", label: "Notices" },
  { to: "/resident/complaints", label: "Complaints" },
  { to: "/resident/polls", label: "Polls" },
  { to: "/resident/guests", label: "Guest approval" },
  { to: "/resident/sos", label: "Emergency SOS" },
  { to: "/resident/bookings", label: "Facility booking" },
];

export function ResidentLayout() {
  return (
    <PortalLayout title="Resident" subtitle="Your society account and services" links={LINKS}>
      <Outlet />
    </PortalLayout>
  );
}
