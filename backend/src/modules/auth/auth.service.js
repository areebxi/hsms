/**
 * Core authentication logic: credential verification and user profile retrieval.
 * Inactive accounts are treated as non-existent to avoid leaking account status.
 */
import bcrypt from "bcryptjs";

import { HttpError } from "../../lib/httpError.js";
import { signAccessToken } from "../../lib/jwt.js";
import { User } from "../../models/User.js";

/**
 * Authenticate by email/password and issue a JWT.
 * Uses a generic error message so attackers cannot tell whether the email exists.
 */
export async function loginUser(email, password) {
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized }).select("+passwordHash");
  if (!user || user.status !== "Active") {
    throw new HttpError(401, "Invalid email or password");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/** Load profile for /me — includes family and vehicle info for resident self-service. */
export async function getUserProfile(userId) {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user || user.status !== "Active") {
    throw new HttpError(404, "User not found");
  }
  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    familyDetails: user.familyDetails ?? { members: [] },
    vehicleInfo: user.vehicleInfo ?? { vehicles: [] },
  };
}
