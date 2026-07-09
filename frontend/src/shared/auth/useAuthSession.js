// Hook that figures out whether the visitor is a guest or a signed-in user (and where to send them).
import { useEffect, useState } from "react";

import { apiGet, getStoredToken, setStoredToken } from "../api/client.js";
import { ROLE_HOME } from "../constants/roles.js";

/**
 * @typedef {{ kind: "loading" }} LoadingSession
 * @typedef {{ kind: "guest" }} GuestSession
 * @typedef {{ kind: "authenticated"; home: string }} AuthedSession
 * @typedef {LoadingSession | GuestSession | AuthedSession} AuthSessionState
 */

/**
 * Resolves JWT + GET /auth/me into guest vs authenticated (+ portal home path).
 * Clears stale token when /auth/me fails.
 * @returns {AuthSessionState}
 */
export function useAuthSession() {
  const [state, setState] = useState(
    /** @type {AuthSessionState} */ ({ kind: "loading" }),
  );

  useEffect(() => {
    // No token in localStorage — treat as guest right away.
    if (!getStoredToken()) {
      setState({ kind: "guest" });
      return;
    }
    // Token exists — verify it with the server and map role to a portal home path.
    apiGet("/auth/me")
      .then((u) => {
        const home = ROLE_HOME[u.role];
        if (home) setState({ kind: "authenticated", home });
        else setState({ kind: "guest" });
      })
      .catch(() => {
        // Expired or invalid token — clear it so the next visit starts fresh.
        setStoredToken(null);
        setState({ kind: "guest" });
      });
  }, []);

  return state;
}
