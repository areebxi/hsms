/**
 * Authentication HTTP routes: login, current-user profile, and logout.
 * Login is rate-limited to reduce brute-force attempts; protected routes require a valid JWT.
 */
import { Router } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/httpError.js";
import { authenticateJwt, requireDb } from "../../middleware/auth.js";
import { loginRateLimiter } from "../../middleware/rateLimits.js";
import { getUserProfile, loginUser } from "./auth.service.js";

const router = Router();

/** Validates email/password for login — rejects malformed input before hitting the database. */
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/** Public login — returns JWT and basic user info on success. */
router.post("/login", loginRateLimiter, requireDb, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body.email, body.password);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new HttpError(400, err.issues.map((e) => e.message).join("; ")));
      return;
    }
    next(err);
  }
});

/** Returns the authenticated user's full profile (any role). */
router.get("/me", requireDb, authenticateJwt, async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.auth.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/** Client-side logout hook — JWT is stateless, so the server just acknowledges. */
router.post("/logout", (_req, res) => {
  res.status(204).send();
});

export default router;
