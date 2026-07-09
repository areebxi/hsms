/**
 * JWT sign/verify helpers for login sessions.
 * Token lifetime follows SESSION_IDLE_TIMEOUT_MS so it matches the idle logout policy.
 */
import jwt from "jsonwebtoken";

function jwtExpiresInSeconds() {
  const ms = Number(process.env.SESSION_IDLE_TIMEOUT_MS) || 30 * 60 * 1000;
  // JWT expects seconds; enforce at least one minute so tokens are not instant-expiry.
  return Math.max(60, Math.floor(ms / 1000));
}

/**
 * @param {{ sub: string; role: string; email: string }} payload
 */
export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: jwtExpiresInSeconds() });
}

/**
 * @param {string} token
 */
export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, secret);
}
