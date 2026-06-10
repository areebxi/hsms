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
    if (!getStoredToken()) {
      setState({ kind: "guest" });
      return;
    }
    apiGet("/auth/me")
      .then((u) => {
        const home = ROLE_HOME[u.role];
        if (home) setState({ kind: "authenticated", home });
        else setState({ kind: "guest" });
      })
      .catch(() => {
        setStoredToken(null);
        setState({ kind: "guest" });
      });
  }, []);

  return state;
}
