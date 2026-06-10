import rateLimit from "express-rate-limit";

function num(envKey, fallback) {
  const v = Number(process.env[envKey]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Login brute-force mitigation (plan §14). Successful logins do not consume quota. */
export const loginRateLimiter = rateLimit({
  windowMs: num("RATE_LIMIT_LOGIN_WINDOW_MS", 15 * 60 * 1000),
  max: num("RATE_LIMIT_LOGIN_MAX", 40),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Try again later." },
});

/** SOS spam mitigation — authenticated residents only; limits POST bursts per IP. */
export const sosPostRateLimiter = rateLimit({
  windowMs: num("RATE_LIMIT_SOS_WINDOW_MS", 60 * 60 * 1000),
  max: num("RATE_LIMIT_SOS_MAX", 24),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many SOS requests. Contact security directly if urgent." },
});
