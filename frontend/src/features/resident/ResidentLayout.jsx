// Resident portal layout — self-service pages for society members.
import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/resident", label: "Overview", end: true },
  { to: "/resident/bills", label: "Bills & payment" },
  { to: "/resident/notices", label: "Notice board" },
  { to: "/resident/complaints", label: "Complaint & suggestion box" },
  { to: "/resident/polls", label: "Polls & voting" },
  { to: "/resident/guests", label: "Guest approval" },
  { to: "/resident/sos", label: "Emergency SOS" },
  { to: "/resident/bookings", label: "Facility booking" },
];

export function ResidentLayout() {
  return (
    <PortalLayout title="Resident" subtitle="Bills, notices, complaints, and other resident services" links={LINKS}>
      <Outlet />
    </PortalLayout>
  );
}
