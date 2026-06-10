import { Navigate } from "react-router-dom";
import { CircularProgress, Stack } from "@mui/material";

import { useAuthSession } from "./useAuthSession.js";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function GuestRoute({ children }) {
  const session = useAuthSession();

  if (session.kind === "loading") {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
      </Stack>
    );
  }

  if (session.kind === "authenticated") {
    return <Navigate to={session.home} replace />;
  }

  return children;
}
