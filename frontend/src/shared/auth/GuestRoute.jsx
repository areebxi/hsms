// Wraps pages that should only be visible when logged out (e.g. login).
import { Navigate } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";

import { useAuthSession } from "./useAuthSession.js";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function GuestRoute({ children }) {
  const session = useAuthSession();

  // Wait until we know if a stored token is still valid.
  if (session.kind === "loading") {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
      </Stack>
    );
  }

  // Signed in already — no need to see the login page again.
  if (session.kind === "authenticated") {
    return <Navigate to={session.home} replace />;
  }

  return children;
}
