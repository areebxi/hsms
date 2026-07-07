# Test traceability matrix

Maps acceptance test cases **TC-01 … TC-23** ([HSMS - Design Document - Test Cases.md](HSMS%20-%20Design%20Document%20-%20Test%20Cases.md)) to use cases, functional requirements, REST endpoints, and UI screens in the implemented system.

**Legend:** All API paths are prefixed with `/api/v1`. JWT required unless noted.

---

## Summary table

| TC | Use case | FR | Primary API | UI (role) | Status |
|----|----------|-----|-------------|-----------|--------|
| TC-01 | UC-01 Register Member | FR-1a | `POST /users` | `/admin/members` (Admin) | Pass |
| TC-02 | UC-02 Manage Units | FR-1d | `POST`, `PATCH`, `DELETE /units` | `/admin/units` (Admin) | Pass |
| TC-03 | UC-03 View Member Directory | FR-1b | `GET /users?q=` | `/admin/members` (Admin) | Pass |
| TC-04 | UC-04 Generate Bills | FR-2a | `POST /bills/generate`, `POST /bills` | `/accountant/bills` (Admin/Accountant) | Pass |
| TC-05 | UC-05 Expense Tracking | FR-2c | `POST /expenses` | `/accountant/expenses` (Admin/Accountant) | Pass |
| TC-06 | UC-06 Generate Financial Reports | FR-2d | `POST /reports/generate` | `/accountant/reports` (Admin/Accountant) | Pass |
| TC-07 | UC-07 View Notice Board | FR-3a | `GET /notices` | `/admin/notices`, `/resident/notices` | Pass |
| TC-08 | UC-08 Manage Inventory | FR-5 | `GET/POST/PATCH/DELETE /inventory` | `/admin/inventory` (Admin) | Pass |
| TC-09 | UC-09 Submit Complaint | FR-3b | `POST /complaints` | `/resident/complaints` (Resident) | Pass |
| TC-10 | UC-10 Track Complaint Status | FR-3b | `GET /complaints`, `PATCH /complaints/:id` | `/resident/complaints`, `/admin/complaints` | Pass |
| TC-11 | UC-11 Pay Bills | FR-2b | `GET /bills`, `POST /payments/card` | `/resident/bills` (Resident) | Pass |
| TC-12 | UC-12 Dummy Payment Processing | FR-2b | `POST /payments/card` | `/resident/bills` + `dummyPaymentProvider` | Pass |
| TC-13 | UC-13 SOS Alert | FR-3c | `POST /sos/alerts` | `/resident/sos` (Resident) | Pass |
| TC-14 | UC-14 Notify Security Guard | FR-3c | `POST /sos/alerts/:id/acknowledge` | `/security/sos` (Security/Admin) | Pass |
| TC-15 | UC-15 Pre-Approve Guest | FR-4b | `POST /guest-approvals` | `/resident/guests` (Resident) | Pass |
| TC-16 | UC-16 Facility Booking | FR-5 | `GET /facilities/:id/slots`, `POST /bookings` | `/resident/bookings` (Resident) | Pass |
| TC-17 | UC-17 Online Voting | FR-3d | `POST /votes`, `GET /polls/:id` | `/resident/polls` (Resident) | Pass |
| TC-18 | UC-18 Log Visitor Entry | FR-4a | `POST /visitor-logs` | `/security/visitors` (Security/Admin) | Pass |
| TC-19 | UC-19 Log Visitor Exit | FR-4a | `PATCH /visitor-logs/:logId` | `/security/visitors` (Security/Admin) | Pass |
| TC-20 | UC-20 Track Staff Attendance | FR-4c | `POST`, `PATCH /staff-attendance` | `/security/staff-attendance` (Security/Admin) | Pass |
| TC-21 | UC-21 Manage Gate Access | FR-4d | `POST /gate-access` | `/security/gate` (Security/Admin) | Pass |
| TC-22 | UC-22 Receive SOS Notification | FR-3c, FR-4 | `GET /sos/alerts`, acknowledge route | `/security/sos` (Security/Admin) | Pass |
| TC-23 | UC-23 Security Patrolling | FR-4e | `POST /patrols` | `/security/patrols` (Security/Admin) | Pass |

---

## Per–test-case detail

### TC-01 — Register Member (UC-01)

- **Precondition:** Admin logged in.
- **API:** `POST /users` — body validated in `membersUnits.validation.js`; password hashed in service.
- **UI:** `frontend/src/features/admin/pages/MembersPage.jsx` — Add Member dialog.
- **Collections:** `users`, optionally `ownershipRecords` when unit linked at registration.

### TC-02 — Manage Units (UC-02)

- **API:** `GET/POST /units`, `GET/PATCH/DELETE /units/:unitId`.
- **UI:** `UnitsPage.jsx` — create, edit, delete (delete blocked if ownership rows exist).
- **Collections:** `units`.

### TC-03 — View Member Directory (UC-03)

- **API:** `GET /users?q=&role=&status=` — search name, email, phone, vehicle fields.
- **UI:** `MembersPage.jsx` — search filter and results table.

### TC-04 — Generate Bills (UC-04)

- **API:** `POST /bills/generate` (bulk from occupied units × `monthlyCharges`); `POST /bills` (single).
- **Notifications (FR-2a):** After create/generate, `billing.service.js` calls `sendNotification` with `channel: "app"` per resident on the unit (`notificationProvider.js` logs stub).
- **UI:** `FinanceBillsPage.jsx` — generate and list bills.
- **Collections:** `bills`.

### TC-05 — Expense Tracking (UC-05)

- **API:** `POST /expenses` (and full CRUD under `/expenses`).
- **UI:** `ExpensesPage.jsx`.
- **Collections:** `expenses`.

### TC-06 — Generate Financial Reports (UC-06)

- **API:** `POST /reports/generate` — types: Income, Expense, BalanceSheet, Defaulters snapshots; `GET /reports`, `GET /reports/:reportId`.
- **UI:** `ReportsPage.jsx`, `ReportSnapshotView.jsx`.
- **Collections:** `financialReports`.

### TC-07 — View Notice Board (UC-07)

- **API:** `GET /notices` (all authenticated); Admin writes via `POST/PATCH/DELETE /notices`.
- **UI:** `AdminNoticesPage.jsx`, `ResidentNoticesPage.jsx`.

### TC-08 — Manage Inventory (UC-08)

- **API:** Full CRUD `/inventory` (Admin only).
- **UI:** `AdminInventoryPage.jsx`.
- **Collections:** `inventory`.

### TC-09 — Submit Complaint (UC-09)

- **API:** `POST /complaints` (Resident); unit must be in current ownership (`GET /my-units` for picker).
- **UI:** `ResidentComplaintPage.jsx` — generates `ticketId` (`TKT-…`).
- **Collections:** `complaints`.

### TC-10 — Track Complaint Status (UC-10)

- **API:** `GET /complaints` (Resident: own; Admin: all); `PATCH /complaints/:id` status (Admin).
- **UI:** Resident and admin complaint pages; admin can edit/delete.

### TC-11 — Pay Bills (UC-11)

- **API:** `GET /bills` (scoped by role); `POST /payments/card` (Resident).
- **UI:** `ResidentBillsPage.jsx` — pay action opens dummy card form.

### TC-12 — Dummy Payment Processing (UC-12)

- **API:** `POST /payments/card` → `dummyPaymentProvider` → bill status set to paid; unique payment per bill.
- **Service:** `billing.service.js` — `payBillWithCard`.
- **Rule:** One payment record per bill; bill `effectiveStatus` reflects overdue when pending past due date.

### TC-13 — SOS Alert (UC-13)

- **API:** `POST /sos/alerts` (Resident, rate-limited).
- **UI:** `ResidentSOSPage.jsx`.
- **Collections:** `sosAlerts`.

### TC-14 — Notify Security Guard (UC-14)

- **API:** `POST /sos/alerts/:alertId/acknowledge` (SecurityGuard, Admin).
- **UI:** `SecuritySOSPage.jsx` — alert list and acknowledge.
- **Collections:** `sosAlerts`, `sosResponses`.

### TC-15 — Pre-Approve Guest (UC-15)

- **API:** `POST /guest-approvals` (Resident); `GET /guest-approvals` (scoped).
- **UI:** `ResidentGuestApprovalPage.jsx`.
- **Collections:** `guestApprovals`.

### TC-16 — Facility Booking (UC-16)

- **API:** `GET /facilities/:facilityId/slots?date=` (occupied intervals); `POST /bookings` — overlap returns `409`.
- **UI:** `ResidentFacilityPage.jsx`; admin manages facilities at `AdminFacilitiesPage.jsx`.
- **Collections:** `facilities`, `facilityBookings`.

### TC-17 — Online Voting (UC-17)

- **API:** `POST /votes` (one per resident per poll); `GET /polls/:pollId` returns tallies and `myVote`.
- **UI:** `ResidentPollsPage.jsx`, `AdminPollsPage.jsx`.
- **Collections:** `polls`, `votes`.

### TC-18 — Log Visitor Entry (UC-18)

- **API:** `POST /visitor-logs` (inline visitor creation supported).
- **UI:** `SecurityVisitorLogsPage.jsx`.
- **Collections:** `visitorLogs`, `visitors`.

### TC-19 — Log Visitor Exit (UC-19)

- **API:** `PATCH /visitor-logs/:logId` — record exit time.
- **UI:** `SecurityVisitorLogsPage.jsx`.

### TC-20 — Track Staff Attendance (UC-20)

- **API:** `POST /staff-attendance` (check-in), `PATCH /staff-attendance/:id` (check-out); staff CRUD under `/staff` (Admin).
- **UI:** `SecurityStaffAttendancePage.jsx`, `AdminStaffPage.jsx`.
- **Collections:** `staff`, `staffAttendance`.

### TC-21 — Manage Gate Access (UC-21)

- **API:** `POST /gate-access` — invokes `gateAccessAdapter.recordGateEvent`.
- **UI:** `SecurityGatePage.jsx`.
- **Collections:** `gateAccessLogs`.

### TC-22 — Receive SOS Notification (UC-22)

- **API:** `GET /sos/alerts` (Resident/Security/Admin with scoping); acknowledge as in TC-14.
- **UI:** `SecuritySOSPage.jsx`.

### TC-23 — Security Patrolling (UC-23)

- **API:** `GET/POST /patrols`.
- **UI:** `SecurityPatrolPage.jsx`.
- **Collections:** `patrolLogs`.

---

## Additional regression checks

Beyond the formal TC list, verify these application-enforced rules ([plan.md](plan.md) §10.3):

| Rule | How to verify |
|------|----------------|
| One vote per poll | Second `POST /votes` for same poll → error |
| No double facility booking | Overlapping `POST /bookings` → `409` |
| Bill paid on payment | After `POST /payments/card`, bill status is Paid |
| SOS rate limit | Excessive `POST /sos/alerts` → `429` |
| Login rate limit | Excessive failed `POST /auth/login` → `429` |

**Automated smoke:** `npm run smoke` — `GET /api/v1/health`; optional login with `SMOKE_EMAIL` / `SMOKE_PASSWORD`.

---

## Ownership records (supporting TC-01, TC-04, TC-09)

Not standalone test cases but required for billing and complaints:

| Action | API | UI |
|--------|-----|-----|
| Assign owner/tenant | `POST /ownership-records` | `/admin/ownership` |
| End tenancy | `PATCH /ownership-records/:id` (`endDate`) | `OwnershipPage.jsx` |
| Resident unit list | `GET /my-units` | Complaint and booking forms |

---

*Last aligned with implementation through Phase 8 ([PROJECT_LOG.md](PROJECT_LOG.md)).*
