import jwt from "jsonwebtoken";

function jwtExpiresInSeconds() {
  const ms = Number(process.env.SESSION_IDLE_TIMEOUT_MS) || 30 * 60 * 1000;
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
