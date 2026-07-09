# HSMS — Project activity log

**Location:** repository root (`PROJECT_LOG.md`). Single running log of implementation work, decisions, and session notes. **Append new entries at the bottom** (newest last) with date and short bullets.

---

## 2026-05-09 — Planning document

- **Goal:** Consolidate all specification documents (`docs/HSMS - *.md`) into one implementation blueprint.
- **Deliverable:** `plan.md` at repo root (428 lines).
- **Sources merged:** Introduction/scope, functional & non-functional requirements, tools & technologies, SRS (usage scenarios UC-01–UC-23, use-case diagram), design docs (database, architecture, test cases, class diagram, ERD, sequence diagrams).
- **Contents:** Vision/scope, stakeholders & roles (`SecurityGuard` vs UI “Security Guard”), full FR/NFR tables, stack (React, MUI, Node, Express, MongoDB), use-case relationships (includes/extends), modular architecture doctrine (“Perfectly Modular Systems”), MongoDB collections & reconciliation notes (e.g. `Poll.createdBy`, `Expense.description`), REST outline, security, testing alignment TC-01–TC-23, phased roadmap, traceability matrix.

---

## 2026-05-09 — Repository scaffolding

- **Goal:** Monorepo aligned with `plan.md` §9.3 (domain modules + shared shell).
- **Root:** `package.json` npm workspaces (`backend`, `frontend`), `concurrently` script `npm run dev`, `.gitignore`.
- **Backend (`backend/`):**
  - Express (ESM), `src/server.js`, `src/app.js`, JSON error handler, Morgan, CORS.
  - `src/lib/db.js` — Mongoose connect when `MONGODB_URI` set; otherwise warns and continues.
  - **Modules:** `auth`, `membersUnits`, `billingPayments`, `complaintsCommunication`, `securityVisitors`, `inventoryExpenses` — stub `GET` routes under `/api/v1/...` per plan.
  - **Integrations:** `notificationProvider.js`, `gateAccessAdapter.js`, `dummyPaymentProvider.js` (stubs).
  - `backend/.env.example` — `PORT`, `MONGODB_URI`, `JWT_SECRET`, `SESSION_IDLE_TIMEOUT_MS`.
- **Frontend (`frontend/`):**
  - Vite + React 18 + MUI 6; `src/App.jsx` routes: `/login`, `/admin/*`, `/accountant/*`, `/resident/*`, `/security/*`.
  - `src/shared/` — `layout/AppShell.jsx`, `api/client.js`, `constants/roles.js`.
  - Feature placeholders under `src/features/{auth,admin,accountant,resident,security}/pages/`.
  - Login page polls `GET /api/v1/health` for connectivity feedback.
- **Docs:** `README.md` — install, env copy, dev commands, folder map.
- **Verify:** `npm install` at root succeeded; `npm run build -w frontend` succeeded.
- **Server:** `listen` error handler added for `EADDRINUSE` with clearer message.

---

## 2026-05-09 — Environment & dev workflow notes

- **Dev command:** From repo root, `npm run dev` runs backend + frontend together (recommended).
- **Alternative:** `npm run dev -w backend` or `npm run dev -w frontend` from root for one workspace only.

---

## 2026-05-09 / 2026-05-10 — Port conflicts & PORT change

- **Issue:** Backend failed with `EADDRINUSE` on port **5000** — another **node** process (orphan dev server) held the port.
- **Resolution:** Identified PID via `Get-NetTCPConnection -LocalPort 5000`; stopped the blocking **node** process so port 5000 could be freed.
- **User change:** Set backend **`PORT=5001`** in `backend/.env` (avoids conflict with other apps using 5000).
- **Frontend alignment:** `frontend/vite.config.js` proxy `target` updated to **`http://localhost:5001`** so browser `/api/*` requests reach the API.
- **Verify:** `npm run dev` — MongoDB connected, API listening on **5001**, Vite on **5173**, `GET /api/v1/health` returning 200/304 as expected.

---

## 2026-05-10 — Log file location

- **Change:** Project activity log moved from `docs/PROJECT_LOG.md` to repository root as **`PROJECT_LOG.md`** (per user preference). Future session entries go here only.

---

## Maintenance note (for Cursor / future edits)

- Append below under a **`## YYYY-MM-DD — Title`** heading for each work session or milestone.
- Keep bullets factual: what changed, file paths, commands, env vars — no need for long prose.

---

<!-- New entries go below this line -->

## 2026-05-10 — Phase 1 foundation: Mongoose models + JWT auth + RBAC

- **Models:** `backend/src/models/*.js` — all collections from `plan.md` §10 (`users`, `units`, `ownershipRecords`, `bills`, `payments`, `expenses`, `financialReports`, `notices`, `complaints`, `polls`, `votes`, `visitors`, `guestApprovals`, `visitorLogs`, `gateAccessLogs`, `patrolLogs`, `staff`, `staffAttendance`, `sosAlerts`, `sosResponses`, `facilities`, `facilityBookings`, `inventory`); barrel `models/index.js` imported from `app.js`.
- **Auth:** bcrypt (`bcryptjs`) password hashing; JWT access tokens (`jsonwebtoken`) with expiry derived from `SESSION_IDLE_TIMEOUT_MS`; `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` (204). Helpers: `src/lib/httpError.js`, `src/lib/jwt.js`; middleware `authenticateJwt`, `requireDb`, `requireRoles` in `src/middleware/auth.js`.
- **RBAC sample:** `membersUnits` routes `GET /users`, `/units`, `/ownership-records` require DB + JWT + role **Admin** (per plan §9 route grouping).
- **Validation:** Zod 4 for login body; `errorHandler` maps `ZodError` → 400 using `.issues`.
- **Seed:** `npm run seed -w backend` → default Admin if missing (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.example`).
- **Frontend:** `shared/api/client.js` — Bearer token in `localStorage` (`hsms_token`); `apiPost`; `LoginPage` wired to `POST /auth/login` and redirects by role (`Admin` → `/admin`, … `SecurityGuard` → `/security`).
- **Verify:** `node -e "import './src/app.js'"` from `backend/`; `npm run build -w frontend` succeeded.

## 2026-05-10 — Phase 2: Core admin (members, units, ownership)

- **API (`membersUnits`):** Full CRUD-style REST for Admin — `GET/POST /users`, `GET/PATCH /users/:userId` (directory search `?q=`, optional `role`/`status`); `GET/POST /units`, `GET/PATCH/DELETE /units/:unitId` (delete only if no ownership rows); `GET/POST /ownership-records`, `GET/PATCH /ownership-records/:id` (filter `?currentOnly=true`, `unitId`, `userId`). Service: `membersUnits.service.js` (bcrypt on user create/patch password, unit occupancy sync from active `endDate: null` records, `HttpError` for conflicts). Validation: `membersUnits.validation.js` (Zod). `errorHandler` also maps Mongoose `CastError` → 400.
- **Middleware:** `asyncHandler` for async routes.
- **Frontend:** `RequireRole` + nested `/admin` routes — `AdminLayout` (nav), `AdminOverviewPage`, `MembersPage` (search, register, edit), `UnitsPage` (CRUD, delete with rules), `OwnershipPage` (list, add, end tenancy). `apiPatch` / `apiDelete` in `shared/api/client.js`. Removed placeholder `AdminDashboardPage.jsx` (replaced by layout + overview).
- **README:** layout table — `backend/src/models/*` row; features line mentions `admin/*`.

## 2026-05-10 — Phase 3: Finance (billing, dummy pay, expenses, reports)

- **Billing (`billingPayments`):** `billing.service.js` / `billing.validation.js` / `routes.js` — `GET/POST /bills`, `PATCH /bills/:billId`, `POST /bills/generate` (occupied units × `monthlyCharges`, duplicate guard per unit/type/due date), `GET /bills/defaulters`, `GET /bills/:billId`; payments `POST /payments/dummy` (Resident only; `dummyPaymentProvider`), `GET /payments`; bill `effectiveStatus` shows overdue when pending & past due; unique `{ billId }` on payments.
- **Expenses & reports (`inventoryExpenses`):** `expensesReports.service.js` / `expensesReports.validation.js` — full CRUD `/expenses`; `POST /reports/generate` (Income, Expense, BalanceSheet snapshot, Defaulters snapshot); `GET /reports`, `GET /reports/:reportId`; facilities/bookings/inventory GET stubs unchanged.
- **RBAC:** Bills/expenses/reports for **Admin + Accountant**; resident pays dummy; **GET `/units`** / **`GET /units/:unitId`** also allowed for Accountant (unit picker on accountant Bills page).
- **Frontend:** `ROLE_GROUPS` stable arrays for `RequireRole`; nested **`/accountant`** (`FinanceBillsPage`, `ExpensesPage`, `ReportsPage`) and **`/resident`** (`ResidentBillsPage`); security route guarded by `ROLE_GROUPS.securityPortal`.
- **Verify:** `npm run build -w frontend` OK.

## 2026-05-10 — Phase 4: Communication (notices, complaints, polls, votes)

- **Backend (`complaintsCommunication`):** `communication.service.js` / `communication.validation.js` / `routes.js` — **Notices:** CRUD-style (`GET/POST /notices`, `GET/PATCH/DELETE /notices/:noticeId`) Admin writes; all authenticated read. **Complaints:** `POST /complaints` (Resident only; unit must be in current ownership via `getCurrentUnitIdsForUser`); `GET /complaints` (Resident = own; Admin = all); `PATCH /complaints/:complaintId` status (Admin); unique `ticketId` (`TKT-…`). **Polls:** `POST /polls` (Admin); `GET /polls` (`?status=Open|Closed|all`); `GET /polls/:pollId` returns tallies, `myVote`, `canVote`; `PATCH /polls/:pollId`. **Votes:** `POST /votes` (Resident); one vote per poll; validates option ∈ poll.options and voting window.
- **Residents — unit picklist:** `GET /my-units` (Resident) on **`membersUnits`** → `listResidentUnits()` for complaint UI.
- **Frontend:** Admin — `AdminNoticesPage`, `AdminComplaintPage`, `AdminPollsPage`; Resident — `ResidentNoticesPage`, `ResidentComplaintPage`, `ResidentPollsPage`; layouts & home cards updated; routes wired in `App.jsx`.
- **Verify:** `npm run build -w frontend` OK.

## 2026-05-10 — Phase 5: Security (visitors, gate, staff, SOS, patrols)

- **Backend (`securityVisitors`):** Validation + service + routes — visitors; guest approvals (`GET` any auth with resident-scoped list; `POST` Resident); visitor logs with inline visitor + exit patch; gate access logs + `gateAccessAdapter.recordGateEvent`; staff (`GET` Admin/Security; `POST/PATCH/DELETE` Admin); staff attendance check-in/out + gate event on checkout; SOS (`GET` Resident/Security/Admin; `POST` Resident; `POST …/acknowledge` Security/Admin); patrols (`GET/POST` Security/Admin). **`membersUnits`:** `GET /units` readable by **SecurityGuard** for visitor logging picklists.
- **Frontend:** Nested **`/security`** under `SecurityLayout` — `SecurityOverviewPage`, `SecurityVisitorLogsPage`, `SecurityGatePage`, `SecurityStaffAttendancePage`, `SecuritySOSPage`, `SecurityPatrolPage`. **`ROLE_GROUPS.securityPortal`** includes **Admin** + **SecurityGuard** (matches API). Resident — **`ResidentGuestApprovalPage`**, **`ResidentSOSPage`** (`/resident/guests`, `/resident/sos`). Admin — **`AdminStaffPage`** (`/admin/staff`). Removed legacy `SecurityPanelPage.jsx`.
- **Verify:** `npm run build -w frontend` OK.

## 2026-05-10 — Phase 6: Amenities (facilities & bookings)

- **Backend (`inventoryExpenses`):** `facilitiesBookings.validation.js` + `facilitiesBookings.service.js` — facilities CRUD (Admin); list facilities (Residents see **Active** only; optional `?status=` for other roles); bookings (`GET`: Resident = own; Admin/Accountant = all); Resident **`POST /bookings`** with same-day overlap rejection (`409`); **`PATCH /bookings/:id`** cancel (owner or Admin); **`GET /facilities/:facilityId/slots?date=`** returns occupied intervals (no PII). **`Facility`** schema default **`status: Active`**.
- **Routes:** Real `/facilities` + `/bookings` in `routes.js`; inventory implemented in Phase 7.
- **Frontend:** **`AdminFacilitiesPage`** (`/admin/facilities`), **`ResidentFacilityPage`** (`/resident/bookings`); nav + home cards + **`App.jsx`** routes.
- **Verify:** `npm run build -w frontend` OK.

## 2026-05-10 — Phase 7: Inventory CRUD

- **Backend (`inventoryExpenses`):** `inventory.validation.js` + `inventory.service.js` — **`GET/POST /inventory`**, **`GET/PATCH/DELETE /inventory/:itemId`** (Admin only, UC-08); list supports **`?q=`** (name/category/condition/status) and **`?category=`**; create sets **`managedBy`** to current user and **`lastUpdated`**; patch refreshes **`lastUpdated`**; **`purchaseDate`** clearable with **`null`** in PATCH body.
- **Routes:** Replaced inventory stub in `routes.js` with full CRUD.
- **Frontend:** **`AdminInventoryPage`** (`/admin/inventory`) — search (Apply), table, add/edit/delete; admin nav + home card.
- **Verify:** `npm run build -w frontend` OK.

## 2026-05-10 — Phase 8: Hardening (NFR, smoke, documentation)

- **Rate limiting:** `express-rate-limit` — **`POST /auth/login`** (per-IP; successful logins do not count) and **`POST /sos/alerts`**; defaults overridable via **`RATE_LIMIT_*`** env (see `backend/.env.example`). Implementation: `backend/src/middleware/rateLimits.js`.
- **Proxy / deployment:** `app.set("trust proxy", 1)` when **`TRUST_PROXY=1`** (real client IP behind reverse proxy).
- **Smoke test:** `backend/src/scripts/smoke-test.js` — `npm run smoke` / `npm run smoke -w backend`; **`GET /health`**, optional **`SMOKE_EMAIL`/`SMOKE_PASSWORD`** for token path. Root **`package.json`** script **`smoke`**.
- **Documentation:** README “Hardening & operations”; **`docs/TEST_TRACEABILITY.md`** (TC-01…TC-23 ↔ UC + API/UI pointers). Session policy already env-driven via **`SESSION_IDLE_TIMEOUT_MS`** + `jwt.js` (no code change).
- **Verify:** `node -e "import './src/app.js'"` (backend); `npm run build -w frontend` OK.

## 2026-05-10 — FR‑2a in-app bill notifications + docs

- **Backend:** `billing.service.js` calls **`notifyResidentsNewBill`** after **`createBill`** and each bill in **`generateBills`** — **`sendNotification`** with **`channel: "app"`**, **`to`** = resident user id; **`notificationProvider.js`** documents channels (`app` / email / SMS).
- **Docs:** README section **Notifications — bills (FR‑2a)**; **`docs/TEST_TRACEABILITY.md`** TC‑04 + FR‑2a paragraph.

## 2026-05-11 — Documentation: frontend UI (theme, layout, logout)

- **README:** New section **Frontend (UI)** — MUI light-only theme (`frontend/src/theme.js`, `ThemeProvider`/`CssBaseline` in `main.jsx`), Inter font, `PortalLayout` + `LogoutButton`, `AppShell`; states explicitly that there is **no dark mode** in the product UI; notes removal of legacy `hsms_theme_mode` from `localStorage` on load.
- **Purpose:** Keep repo docs aligned with the current frontend so new contributors are not directed to removed features (e.g. color-mode toggle).

## 2026-05-11 — Auth UX: guest landing + remove login portal shortcuts

- **`ROLE_HOME`** moved to **`frontend/src/shared/constants/roles.js`** (single source for post-login paths); **`RequireRole.jsx`** and **`LoginPage.jsx`** import it (no duplicate maps).
- **New:** **`useAuthSession.js`** — `getStoredToken()` + **`GET /auth/me`**; maps role → home; clears **`hsms_token`** on `/auth/me` failure.
- **New:** **`GuestRoute.jsx`** — wraps **`LoginPage`** in **`App.jsx`**; shows brief spinner then **`Navigate`** to portal home if already authenticated, else renders children.
- **New:** **`RootLanding.jsx`** — **`/`** route: spinner → authenticated user’s portal home, or **`Navigate`** to **`/login`** (replaces unconditional redirect to login only).
- **`LoginPage.jsx`:** Removed **Portal entry** subtitle and role shortcut buttons (Admin / Accountant / Resident / Security Guard); sign-in still **`navigate(home)`** via **`ROLE_HOME`** after **`POST /auth/login`**.
- **Verify:** `npm run build` in **`frontend/`** OK.

## 2026-05-11 — Login UI: remove dev health probe and setup footer

- **`frontend/src/features/auth/pages/LoginPage.jsx`:** Removed **`GET /health`** on mount (`apiGet`, `useEffect`, `health` state); removed success **“API reachable”** alert and the **“API unreachable”** special-case copy (errors now only from sign-in). Removed **“First-time setup…”** footer text.
- **Note:** Backend **`GET /api/v1/health`** unchanged (smoke test / ops still valid). First-time env + seed steps remain in **`README.md`** / **`backend/.env.example`**.

## 2026-05-11 — Admin edit/delete coverage + resident complaint delete + ownership unit/member on PATCH

- **`membersUnits` (`backend/src/modules/membersUnits/`):**
  - **`DELETE /users/:userId`** — `deleteUser()` in `membersUnits.service.js` (guards: not self, not sole Admin, no `OwnershipRecord` for user, no `Complaint` as `submittedBy`; clears **`Vote`** rows for `votedBy` then deletes user). Route in `routes.js`.
  - **`DELETE /ownership-records/:recordId`** — `deleteOwnershipRecord()` + `syncUnitOccupancy` on that unit.
  - **`PATCH /ownership-records/:recordId`** — `patchOwnershipBody` extended with optional **`unitId`**, **`userId`** (`membersUnits.validation.js`); `updateOwnershipRecord()` validates unit/user exist, **`syncUnitOccupancy`** on original unit and on new unit when `unitId` changes (`membersUnits.service.js`).
- **`complaintsCommunication` (`backend/src/modules/complaintsCommunication/`):**
  - **`DELETE /polls/:pollId`** — `deletePoll()` removes votes then poll (`communication.service.js`); route `adminOnly`.
  - **`DELETE /complaints/:complaintId`** — `deleteComplaint()` — Admin: any; Resident: own only and **`status === "Pending"`**; route **`anyAuth`** (`communication.routes.js`).
- **Frontend (admin):** `MembersPage.jsx` — Delete; `OwnershipPage.jsx` — Edit (unit, member, type, dates) + Delete + End tenancy; `AdminNoticesPage.jsx` — Edit dialog + existing Delete; `AdminPollsPage.jsx` — Edit + Delete + Close; `AdminComplaintPage.jsx` — Edit dialog (status) + Delete (replaces inline status-only control).
- **Frontend (resident):** `ResidentComplaintPage.jsx` — Delete for **Pending** only + helper copy.
- **Verify:** `node --check` on touched backend files; `npm run build` in **`frontend/`** OK.

## 2026-07-07 — Portal overview pages renamed (`*HomePage` → `*OverviewPage`)

- **Frontend:** Renamed portal landing pages to match nav label **Overview** in each `*Layout`: `AdminHomePage` → **`AdminOverviewPage`**, `AccountantHomePage` → **`AccountantOverviewPage`**, `ResidentHomePage` → **`ResidentOverviewPage`**, `SecurityHomePage` → **`SecurityOverviewPage`**. Files under `frontend/src/features/{admin,accountant,resident,security}/pages/`; exports and **`App.jsx`** index-route imports updated. Route paths unchanged (`/admin`, `/accountant`, `/resident`, `/security`).

## 2026-07-07 — Resident guest page renamed (`ResidentGuestPage` → `ResidentGuestApprovalPage`)

- **Frontend:** `ResidentGuestPage.jsx` → **`ResidentGuestApprovalPage.jsx`**; export and **`App.jsx`** import/route updated. Route path unchanged (`/resident/guests`). Aligns with nav label **Guest approval**.

## 2026-07-07 — Resident facility page renamed (`ResidentBookingsPage` → `ResidentFacilityPage`)

- **Frontend:** `ResidentBookingsPage.jsx` → **`ResidentFacilityPage.jsx`**; export and **`App.jsx`** import/route updated. Route path unchanged (`/resident/bookings`).

## 2026-07-07 — Complaint pages renamed (`*ComplaintsPage` → `*ComplaintPage`)

- **Frontend:** `AdminComplaintsPage.jsx` → **`AdminComplaintPage.jsx`**, `ResidentComplaintsPage.jsx` → **`ResidentComplaintPage.jsx`**; exports and **`App.jsx`** imports/routes updated. Route paths unchanged (`/admin/complaints`, `/resident/complaints`).

## 2026-07-07 — Project documentation index and API reference

- **New:** **`docs/README.md`** — central documentation hub (spec docs, module map, route map, reading order).
- **New:** **`docs/TEST_TRACEABILITY.md`** — TC-01…TC-23 ↔ UC, FR, API, UI (referenced in root README since Phase 8; file was missing).
- **New:** **`docs/API.md`** — full REST reference for `/api/v1` endpoints and roles.
- **Updated:** Root **`README.md`** — documentation table links to docs index and API reference.

## 2026-07-09 — Frontend shared folder cleanup

- **Moved:** `frontend/src/theme.js` → **`frontend/src/shared/theme/theme.js`**; **`main.jsx`** import updated.
- **Moved:** `frontend/src/shared/formatCount.js` → **`frontend/src/shared/utils/formatCount.js`**; all feature-page imports updated.
- **Removed:** Empty placeholder folders **`shared/ui/`** and **`shared/units/`**.
- **Docs:** Root **`README.md`** — project structure and theme path aligned with new layout.

## 2026-07-09 — Backend model renames (`AppNotifications`, `Polls`)

- **Renamed:** `backend/src/models/AppNotification.js` → **`AppNotifications.js`** — Mongoose model **`AppNotifications`**; MongoDB collection **`appNotifications`** (was `app_notifications`). Updated **`notificationProvider.js`**, **`billing.service.js`**, **`models/index.js`**.
- **Renamed:** `backend/src/models/Poll.js` → **`Polls.js`** — Mongoose model **`Polls`**; collection name unchanged (`polls`). Updated **`communication.service.js`**, **`models/index.js`**, **`Vote.js`** (`ref: "Polls"`).
- **Docs:** **`docs/plan.md`** §10.1 + schema summary; **`docs/HSMS - Design Document - Database Design.md`**; **`docs/TEST_TRACEABILITY.md`**; **`docs/README.md`**; root **`README.md`** — collection and model names aligned.
- **DB migration (if needed):** `db.app_notifications.renameCollection("appNotifications")` when upgrading an existing database that already has the old collection name.
