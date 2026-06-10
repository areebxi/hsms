import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/security", label: "Overview", end: true },
  { to: "/security/visitors", label: "Visitors & logs" },
  { to: "/security/gate", label: "Gate access" },
  { to: "/security/staff-attendance", label: "Staff attendance" },
  { to: "/security/sos", label: "SOS" },
  { to: "/security/patrols", label: "Patrols" },
];

export function SecurityLayout() {
  return (
    <PortalLayout
      title="Security Guard"
      subtitle="Entry and exit, gate logs, attendance, SOS, and patrols"
      links={LINKS}
    >
      <Outlet />
    </PortalLayout>
  );
}
