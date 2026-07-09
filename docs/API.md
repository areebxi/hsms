# REST API reference

HSMS exposes a JSON REST API under **`/api/v1`**. All protected routes require a Bearer JWT from `POST /auth/login`.

**Base URL (development):** `http://localhost:5002/api/v1` (or the `PORT` in `backend/.env`; Vite proxies `/api` in dev).

**Auth header:** `Authorization: Bearer <token>`

**Errors:** JSON body `{ "message": "..." }` with appropriate HTTP status. Validation errors from Zod return `400`.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | `{ "status": "ok", "service": "hsms-api" }` |

---

## Authentication (`/auth`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `POST` | `/auth/login` | No | — | Email + password → `{ token, user }`. Rate-limited. |
| `GET` | `/auth/me` | Yes | Any | Current user profile. |
| `POST` | `/auth/logout` | No | — | `204` (client clears token). |

---

## Members & units

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/users` | Admin | List/search (`?q=`, `?role=`, `?status=`). |
| `POST` | `/users` | Admin | Register member. |
| `GET` | `/users/:userId` | Admin | User detail. |
| `PATCH` | `/users/:userId` | Admin | Update profile / password. |
| `DELETE` | `/users/:userId` | Admin | Delete (guarded: not self, no ownership, etc.). |
| `GET` | `/my-units` | Resident | Units linked via current ownership. |
| `GET` | `/units` | Admin, Accountant, SecurityGuard | List units. |
| `POST` | `/units` | Admin | Create unit. |
| `GET` | `/units/:unitId` | Admin, Accountant, SecurityGuard | Unit detail. |
| `PATCH` | `/units/:unitId` | Admin | Update unit. |
| `DELETE` | `/units/:unitId` | Admin | Delete if no ownership rows. |
| `GET` | `/ownership-records` | Admin | List (`?currentOnly=true`, `?unitId=`, `?userId=`). |
| `POST` | `/ownership-records` | Admin | Create ownership/tenancy record. |
| `GET` | `/ownership-records/:recordId` | Admin | Record detail. |
| `PATCH` | `/ownership-records/:recordId` | Admin | Update (including `unitId` / `userId` change). |
| `DELETE` | `/ownership-records/:recordId` | Admin | Delete record; syncs unit occupancy. |

---

## Billing & payments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/bills` | Any | List bills (role-scoped). |
| `POST` | `/bills` | Admin, Accountant | Create single bill; triggers app notification. |
| `POST` | `/bills/generate` | Admin, Accountant | Bulk generate for occupied units. |
| `GET` | `/bills/defaulters` | Admin, Accountant | Defaulter summary. |
| `GET` | `/bills/:billId` | Any | Bill detail (role-scoped). |
| `PATCH` | `/bills/:billId` | Admin, Accountant | Update bill fields. |
| `POST` | `/payments/gateway` | Resident | Dummy gateway pay; body `{ billId, paymentMethod? }` (`Visa` \| `Mastercard` \| `NetBanking`). UI collects card/bank fields locally only; API marks bill paid. |
| `GET` | `/payments` | Any | List payments (role-scoped). |
| `GET` | `/notifications` | Resident | List in-app notifications (`?unreadOnly=true` default). Stored in `appNotifications`. |
| `PATCH` | `/notifications/:notificationId/read` | Resident | Mark notification read (dismiss). |

---

## Expenses & reports

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/expenses` | Admin, Accountant | List expenses. |
| `POST` | `/expenses` | Admin, Accountant | Create expense. |
| `GET` | `/expenses/:expenseId` | Admin, Accountant | Expense detail. |
| `PATCH` | `/expenses/:expenseId` | Admin, Accountant | Update expense. |
| `DELETE` | `/expenses/:expenseId` | Admin, Accountant | Delete expense. |
| `POST` | `/reports/generate` | Admin, Accountant | Generate snapshot (Income, Expense, BalanceSheet, Defaulters). |
| `GET` | `/reports` | Admin, Accountant | List reports. |
| `GET` | `/reports/:reportId` | Admin, Accountant | Report snapshot JSON. |

---

## Notices, complaints, polls

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/notices` | Any | List notices. |
| `POST` | `/notices` | Admin | Publish notice. |
| `GET` | `/notices/:noticeId` | Any | Notice detail. |
| `PATCH` | `/notices/:noticeId` | Admin | Edit notice. |
| `DELETE` | `/notices/:noticeId` | Admin | Delete notice. |
| `GET` | `/complaints` | Any | List (Resident: own; Admin: all). |
| `POST` | `/complaints` | Resident | Submit complaint. |
| `GET` | `/complaints/:complaintId` | Any | Complaint detail. |
| `PATCH` | `/complaints/:complaintId` | Admin | Update status. |
| `DELETE` | `/complaints/:complaintId` | Any | Admin: any; Resident: own Pending only. |
| `GET` | `/polls` | Any | List polls (`?status=Open\|Closed\|all`). |
| `POST` | `/polls` | Admin | Create poll. |
| `GET` | `/polls/:pollId` | Any | Poll with tallies, `myVote`, `canVote`. |
| `PATCH` | `/polls/:pollId` | Admin | Edit / close poll. |
| `DELETE` | `/polls/:pollId` | Admin | Delete poll and votes. |
| `POST` | `/votes` | Resident | Cast vote (one per poll). |

---

## Security & visitors

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/visitors` | SecurityGuard, Admin | List visitors. |
| `POST` | `/visitors` | SecurityGuard, Admin | Register visitor profile. |
| `GET` | `/guest-approvals` | Any | List (Resident: own). |
| `POST` | `/guest-approvals` | Resident | Pre-approve guest. |
| `GET` | `/visitor-logs` | SecurityGuard, Admin | List entry logs. |
| `POST` | `/visitor-logs` | SecurityGuard, Admin | Log entry (may create visitor inline). |
| `PATCH` | `/visitor-logs/:logId` | SecurityGuard, Admin | Record exit. |
| `GET` | `/gate-access` | SecurityGuard, Admin | Gate event log. |
| `POST` | `/gate-access` | SecurityGuard, Admin | Record gate event (adapter stub). |
| `GET` | `/staff` | SecurityGuard, Admin | List staff. |
| `POST` | `/staff` | Admin | Add staff member. |
| `PATCH` | `/staff/:staffId` | Admin | Update staff. |
| `DELETE` | `/staff/:staffId` | Admin | Delete staff. |
| `GET` | `/staff-attendance` | SecurityGuard, Admin | Attendance records. |
| `POST` | `/staff-attendance` | SecurityGuard, Admin | Check-in. |
| `PATCH` | `/staff-attendance/:attendanceId` | SecurityGuard, Admin | Check-out. |
| `GET` | `/sos/alerts` | Resident, SecurityGuard, Admin | List SOS alerts (scoped). |
| `POST` | `/sos/alerts` | Resident | Trigger SOS (rate-limited). |
| `POST` | `/sos/alerts/:alertId/acknowledge` | SecurityGuard, Admin | Acknowledge alert. |
| `GET` | `/patrols` | SecurityGuard, Admin | Patrol logs. |
| `POST` | `/patrols` | SecurityGuard, Admin | Create patrol log. |

---

## Facilities, bookings, inventory

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/facilities` | Any | List facilities (Residents: Active only). |
| `POST` | `/facilities` | Admin | Create facility. |
| `PATCH` | `/facilities/:facilityId` | Admin | Update facility. |
| `DELETE` | `/facilities/:facilityId` | Admin | Delete facility. |
| `GET` | `/facilities/:facilityId/slots` | Any | Occupied slots for date (`?date=YYYY-MM-DD`). |
| `GET` | `/bookings` | Admin, Accountant, Resident | List bookings (Resident: own). |
| `POST` | `/bookings` | Resident | Book slot (overlap → `409`). |
| `PATCH` | `/bookings/:bookingId` | Admin, Accountant, Resident | Cancel booking. |
| `GET` | `/inventory` | Admin | List inventory (`?q=`, `?category=`). |
| `POST` | `/inventory` | Admin | Add item. |
| `GET` | `/inventory/:itemId` | Admin | Item detail. |
| `PATCH` | `/inventory/:itemId` | Admin | Update item. |
| `DELETE` | `/inventory/:itemId` | Admin | Delete item. |

---

## Rate limiting

| Endpoint | Default | Env overrides |
|----------|---------|---------------|
| `POST /auth/login` | Per-IP window | `RATE_LIMIT_LOGIN_*` |
| `POST /sos/alerts` | Per-IP window | `RATE_LIMIT_SOS_*` |

Set `TRUST_PROXY=1` when behind a reverse proxy so limits use the client IP.

---

## Module source map

| Module | Routes file |
|--------|-------------|
| Auth | `backend/src/modules/auth/routes.js` |
| Members & units | `backend/src/modules/membersUnits/routes.js` |
| Billing | `backend/src/modules/billingPayments/routes.js` |
| Communication | `backend/src/modules/complaintsCommunication/routes.js` |
| Security | `backend/src/modules/securityVisitors/routes.js` |
| Expenses, facilities, inventory | `backend/src/modules/inventoryExpenses/routes.js` |

Request/response schemas are defined in each module’s `*.validation.js` files (Zod).

---

## Example: login and authenticated request

```bash
# Login
curl -s -X POST http://localhost:5002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hsms.local","password":"admin123"}'

# Use token from response
curl -s http://localhost:5002/api/v1/users \
  -H "Authorization: Bearer <token>"
```

See [TEST_TRACEABILITY.md](TEST_TRACEABILITY.md) for which endpoints back each acceptance test.
