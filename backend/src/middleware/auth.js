/**
 * Authentication and authorization middleware for protected API routes.
 */
import mongoose from "mongoose";

import { HttpError } from "../lib/httpError.js";
import { verifyAccessToken } from "../lib/jwt.js";

/**
 * Attaches `req.auth` from a valid Bearer JWT. Returns 401 on missing/invalid token.
 */
export function authenticateJwt(req, _res, next) {
  const header = req.headers.authorization;
  const token =
    typeof header === "string" && header.startsWith("Bearer ")
      ? header.slice(7).trim()
      : null;

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    // Reject tokens missing the fields we put in at login — prevents malformed payloads.
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.sub !== "string" ||
      typeof decoded.role !== "string"
    ) {
      next(new HttpError(401, "Invalid token payload"));
      return;
    }
    req.auth = {
      userId: decoded.sub,
      role: decoded.role,
      email: typeof decoded.email === "string" ? decoded.email : "",
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

/**
 * Requires MongoDB to be connected (e.g. login and DB-backed routes).
 */
export function requireDb(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) {
    next(new HttpError(503, "Database unavailable"));
    return;
  }
  next();
}

/**
 * @param {...string} allowedRoles
 */
/** Role gate — use after authenticateJwt, e.g. requireRoles("Admin", "Accountant"). */
export function requireRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new HttpError(401, "Authentication required"));
      return;
    }
    // 403 (not 401) — user is logged in but their role cannot access this action.
    if (!allowedRoles.includes(req.auth.role)) {
      next(new HttpError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}
