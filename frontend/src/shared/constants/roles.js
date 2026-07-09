// Role names, default landing paths, and which roles can open each portal.
/** Stored role values — match backend / MongoDB. */
export const ROLES = {
  Admin: "Admin",
  Resident: "Resident",
  Accountant: "Accountant",
  SecurityGuard: "SecurityGuard",
};

/** Default SPA path after sign-in for each role. */
export const ROLE_HOME = {
  [ROLES.Admin]: "/admin",
  [ROLES.Accountant]: "/accountant",
  [ROLES.Resident]: "/resident",
  [ROLES.SecurityGuard]: "/security",
};

/** Stable arrays for `RequireRole` (avoid new [] each render). */
export const ROLE_GROUPS = {
  adminPortal: [ROLES.Admin],
  accountantPortal: [ROLES.Admin, ROLES.Accountant],
  residentPortal: [ROLES.Resident],
  /** Backend security routes also allow Admin (operational parity). */
  securityPortal: [ROLES.Admin, ROLES.SecurityGuard],
};
