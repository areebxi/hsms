# HSMS — Test case ↔ use case traceability

Manual regression checklist for **TC-01 … TC-23** from `docs/HSMS - Design Document - Test Cases.txt`, mapped to **`plan.md`** use cases (UC-01 … UC-23) and the implemented surfaces.

**UI context:** The web app uses a **single light** Material UI theme (see repository **`README.md` → Frontend (UI)**). Authenticated portals expose **Log out** in the header; use it between role switches when manually testing RBAC.

**Traceability in the app:** End-user screens use **plain-language** descriptions only. **UC** / **FR** identifiers and **`plan.md`** references appear in documentation (this file, `plan.md`, SRS/design artifacts under `docs/`), not in portal copy.

| TC | Title (from design doc) | UC | Primary API / UI |
|----|-------------------------|-----|------------------|
| TC-01 | Register Member | UC-01 | `POST /api/v1/users`, Admin → Members |
| TC-02 | Manage Units | UC-02 | `GET/POST/PATCH /units`, Admin → Units |
| TC-03 | View Member Directory | UC-03 | `GET /users?q=`, Admin → Members |
| TC-04 | Generate Bills | UC-04 | `POST /bills/generate`, `POST /bills`, Accountant/Admin → Bills; **FR‑2a:** `sendNotification` **`channel: app`** to residents on the unit (`billing.service.js` + `notificationProvider.js`) |
| TC-05 | Expense Tracking | UC-05 | `POST /expenses`, Accountant → Expenses |
| TC-06 | Generate Financial Reports | UC-06 | `POST /reports/generate`, Accountant → Reports |
| TC-07 | View Notice Board | UC-07 | `GET /notices`, Admin/Resident → Notices |
| TC-08 | Manage Inventory | UC-08 | `GET/POST/PATCH/DELETE /inventory`, Admin → Inventory |
| TC-09 | Submit Complaint | UC-09 | `POST /complaints`, Resident → Complaints |
| TC-10 | Track Complaint Status | UC-10 | `GET /complaints`, Resident → Complaints |
| TC-11 | Pay Bills | UC-11 | `GET /bills`, `POST /payments/dummy`, Resident → Bills |
| TC-12 | Dummy Payment Processing | UC-12 | Same as TC-11 (dummy provider + bill status) |
| TC-13 | SOS Alert | UC-13 | `POST /sos/alerts`, Resident → SOS |
| TC-14 | Notify Security Guard | UC-14 | SOS list + acknowledge flow (`GET /sos/alerts`, `POST …/acknowledge`) |
| TC-15 | Pre-Approve Guest | UC-15 | `POST /guest-approvals`, Resident → Guest approval |
| TC-16 | Facility Booking | UC-16 | `POST /bookings`, overlap `409`, Resident → Facility booking |
| TC-17 | Online Voting | UC-17 | `POST /votes`, Resident → Polls |
| TC-18 | Log Visitor Entry | UC-18 | `POST /visitor-logs`, Security → Visitors & logs |
| TC-19 | Log Visitor Exit | UC-19 | `PATCH /visitor-logs/:id`, Security → Visitors & logs |
| TC-20 | Track Staff Attendance | UC-20 | `POST/PATCH /staff-attendance`, Security + Admin staff registry |
| TC-21 | Manage Gate Access | UC-21 | `POST /gate-access`, Security → Gate access |
| TC-22 | Receive SOS Notification | UC-22 | Security → SOS (open alerts + acknowledge) |
| TC-23 | Security Patrolling | UC-23 | `POST /patrols`, Security → Patrols |

**FR‑2a (billing notifications):** Issuing a bill triggers **in-app** notifications (`channel: app`, recipient = resident **user id**) for everyone on that unit with role Resident; delivery is **stubbed** in dev (console log). Real SMS/email can use the same helper with different `channel` / `to`.

**Extra scenarios called out in `plan.md` §15:** unique vote per poll, double-booking rejection, bill paid transition after dummy pay, SOS acknowledgment end-to-end.

**Automated smoke (API up):** from repo root, `npm run smoke` — hits `GET /api/v1/health`; optional `SMOKE_EMAIL` / `SMOKE_PASSWORD` for login + `GET /auth/me`. See `backend/src/scripts/smoke-test.js`.
