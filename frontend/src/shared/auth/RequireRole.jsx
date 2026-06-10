import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";

import { apiGet, getStoredToken } from "../api/client.js";
import { ROLE_HOME } from "../constants/roles.js";

/**
 * @param {{ children: import("react").ReactNode; roles: string[] }} props
 */
export function RequireRole({ children, roles }) {
  const [phase, setPhase] = useState("loading");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const allowed = roles ?? [];
    if (!getStoredToken()) {
      setPhase("no-token");
      return;
    }
    apiGet("/auth/me")
      .then((u) => {
        setUserRole(u.role);
        if (allowed.includes(u.role)) setPhase("ok");
        else setPhase("wrong-role");
      })
      .catch(() => setPhase("fail"));
  }, [roles]);

  if (phase === "loading") {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
      </Stack>
    );
  }

  if (phase === "no-token" || phase === "fail") {
    return <Navigate to="/login" replace />;
  }

  if (phase === "wrong-role") {
    const dest = ROLE_HOME[userRole] ?? "/login";
    return <Navigate to={dest} replace />;
  }

  return children;
}
