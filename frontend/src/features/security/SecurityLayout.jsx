import { Outlet } from "react-router-dom";
import { PortalLayout } from "../../shared/layout/PortalLayout.jsx";

const LINKS = [
  { to: "/security", label: "Overview", end: true },
  { to: "/security/visitors", label: "Visitor logs" },
  { to: "/security/gate", label: "Gate access" },
  { to: "/security/staff-attendance", label: "Staff attendance" },
  { to: "/security/sos", label: "SOS alerts" },
  { to: "/security/patrols", label: "Security patrols" },
];

export function SecurityLayout() {
  return (
    <PortalLayout
      title="Security Guard"
      subtitle="Visitors, gate access, staff check-in, SOS alerts, and patrols"
      links={LINKS}
    >
      <Outlet />
    </PortalLayout>
  );
}
