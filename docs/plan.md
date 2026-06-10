# Housing Society Management System (HSMS) — Master Implementation Plan

This document consolidates the project’s `.txt` specifications (introduction, scope, functional/non-functional requirements, tools, SRS usage scenarios, use-case diagram, design artifacts, database design, architecture, class/ER diagrams, sequence diagrams, and test cases) into a single implementation blueprint. Terminology and behaviors match those sources unless an explicit reconciliation note appears below.

---

## 1. Vision and Purpose

**HSMS** is a web application that automates and streamlines daily administration of a residential community. Managing committees, residents, staff, and vendors use it for financial management, communication, security, and facility booking.

**Goals:** reduce manual workload, improve transparency, strengthen security, and increase community engagement.

**Constraints (from scope):** Some integrations are simulated for an FYP/demo—real payment processing is replaced by a **dummy payment** flow; **notifications** (email, SMS, app) should be modeled realistically but may use simulated delivery. **Gate access** follows functional requirements: integrate with gate access control systems for entry/exit control and monitoring—implement as a clear integration boundary (real hardware optional; simulation acceptable where hardware is unavailable).

---

## 2. Scope Summary

The system provides a **centralized web platform** for:

| Area | Capabilities |
|------|----------------|
| **Member & property** | Register members; searchable directory; ownership/tenancy history; unit types, floors, charges |
| **Financial** | Recurring maintenance/utility bills; dummy online payment; expense tracking; transparent reports (balance sheet, income/expense, defaulters) |
| **Communication** | Real-time notice board; complaints/suggestions with tracking; SOS to security; polling/elections |
| **Security** | Visitor logs; pre-approved guests; staff/vendor attendance; gate management with access-control integration; patrolling |
| **Amenities & assets** | Facility booking; society inventory and fixed assets |

**Out of scope for “live” production:** Real payment processor; full SMS/email infrastructure may be stubbed if documented as simulated.

---

## 3. Stakeholders and Roles

| Actor | Description |
|-------|-------------|
| **Admin** | Member/unit/inventory/notices/polls/billing initiation as per use cases |
| **Resident** | Bills (dummy pay), complaints, SOS, notices, polls, bookings, guest pre-approval |
| **Accountant** | Bills, expenses, financial reports |
| **Security Guard** | Visitors, staff attendance, gate access, SOS reception/ack, patrols |

**Naming convention (authoritative):**

- **Database / API stored role:** `SecurityGuard` (one word, camelCase).
- **UI copy / SRS actor name:** “Security Guard”.
- Other roles: `Admin`, `Resident`, `Accountant`.

---

## 4. Functional Requirements (Complete)

### 4.1 Member and Property Management

| ID | Requirement |
|----|-------------|
| FR-1a | **Member registration:** Administrators add residents with personal details, unit numbers, ownership status (owner or tenant). |
| FR-1b | **Member directory:** Searchable database of residents with contact info, family details, vehicle information. |
| FR-1c | **Ownership and tenancy tracking:** Records of flat/plot ownership and history of sales/transfers. |
| FR-1d | **Unit management:** Per-unit type (apartment, villa, plot), floor, associated charges. |

### 4.2 Financial Management and Billing

| ID | Requirement |
|----|-------------|
| FR-2a | **Automated billing:** Generate and send recurring maintenance and utility bills via email, SMS, or app notifications (delivery may be simulated per project constraints). |
| FR-2b | **Online payments:** Secure payment flow with multiple methods (card, net banking, etc.)—**dummy implementation** only (no real gateway). |
| FR-2c | **Expense tracking:** Record and categorize society expenditures (salaries, repairs, admin). |
| FR-2d | **Accounting and reports:** Maintain accounts; generate balance sheets, income/expense reports, defaulter lists. |

### 4.3 Communication and Collaboration

| ID | Requirement |
|----|-------------|
| FR-3a | **Notice board:** Announcements, meetings, updates visible in near real-time. |
| FR-3b | **Complaint and suggestion box:** Submit, track, receive updates on maintenance requests and complaints. |
| FR-3c | **Emergency alerts (SOS):** Residents trigger immediate alerts to security or designated emergency contacts. |
| FR-3d | **Polling:** Online voting for society matters or committee elections. |

### 4.4 Security and Visitor Management

| ID | Requirement |
|----|-------------|
| FR-4a | **Visitor entry/exit:** Log movements; residents may pre-approve guests for faster entry. |
| FR-4b | **Staff and vendor management:** Attendance and entry for domestic staff and third-party vendors. |
| FR-4c | **Gate management:** Integration with gate access systems to control and monitor entry/exit. |
| FR-4d | **Security patrolling:** Guards cover defined patrol routes effectively with logged checkpoints. |

### 4.5 Amenity and Inventory Management

| ID | Requirement |
|----|-------------|
| FR-5a | **Facility booking:** View availability; book shared facilities (clubhouse, pool, courts, etc.). |
| FR-5b | **Inventory management:** Track society inventory and fixed assets. |

---

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Pages load within **3–5 seconds**; support **~100 concurrent users** (FYP/demo). |
| **Security** | Role-based login (Admin, Resident, Accountant, Security Guard); **passwords hashed**; **HTTPS** for transmission. |
| **Reliability** | **99% uptime** target (design for maintainability and health checks); **session timeout** after inactivity. |
| **Usability** | Simple, intuitive UI for non-technical users; **responsive** (mobile and desktop); consistent navigation, clear labels, helpful errors. |
| **Maintainability** | **Modular code** (React components + backend routes); comments where they aid maintenance; **code documentation**. |

---

## 6. Tools and Technologies (Authoritative Stack)

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML, CSS, JavaScript; **React**; **Material UI** |
| **Backend** | **Node.js**; **Express.js** |
| **Database** | **MongoDB** |

Infrastructure assumptions: HTTPS in deployment; MongoDB connection string via environment configuration.

---

## 7. Use Case Diagram — Consolidated

**Actors:** Admin, Resident, Security Guard, Accountant.

**Functional grouping (from SRS Use Case Diagram):**

1. **Member & Property:** Register Member (Admin); Manage Units (Admin); View Member Directory (Admin).
2. **Financial:** Generate Bills (Admin, Accountant); Pay Bills (Resident); Expense Tracking (Admin, Accountant); Generate Financial Reports (Admin, Accountant).
3. **Communication:** View Notice Board (Admin, Resident); Submit Complaint (Resident); Track Complaint Status (Resident); SOS Alert (Resident); Online Voting (Resident).
4. **Security:** Log Visitor Entry/Exit (Security Guard); Track Staff Attendance (Security Guard); Manage Gate Access (Security Guard); Security Patrolling (Security Guard); Receive SOS Notification (Security Guard); Pre-Approve Guest (Resident).
5. **Amenity & Inventory:** Facility Booking (Resident); Manage Inventory (Admin).

**Relationships:**

| Relationship | Meaning |
|--------------|---------|
| **Pay Bills** *includes* **Dummy Payment Processing** | Payment flow always goes through dummy processor. |
| **Generate Bills** *includes* **Calculate Charges** | Bill run invokes charge calculation. |
| **SOS Alert** *includes* **Notify Security Guard** | SOS always triggers guard notification. |
| **Track Complaint Status** *extends* **Submit Complaint** | Tracking extends the base complaint submission capability. |

---

## 8. Usage Scenarios — Traceability Index

All **UC-01 … UC-23** from `SRS Document- Usage Scenarios` are in scope. Summary:

| UC | Name | Primary Actor(s) |
|----|------|------------------|
| UC-01 | Register Member | Admin |
| UC-02 | Manage Units | Admin |
| UC-03 | View Member Directory | Admin |
| UC-04 | Generate Bills | Admin / Accountant |
| UC-05 | Expense Tracking | Admin / Accountant |
| UC-06 | Generate Financial Reports | Admin / Accountant |
| UC-07 | View Notice Board | Admin / Resident |
| UC-08 | Manage Inventory | Admin |
| UC-09 | Submit Complaint | Resident |
| UC-10 | Track Complaint Status | Resident |
| UC-11 | Pay Bills | Resident |
| UC-12 | Dummy Payment Processing | Resident (included) |
| UC-13 | SOS Alert | Resident |
| UC-14 | Notify Security Guard | System / Security Guard |
| UC-15 | Pre-Approve Guest | Resident |
| UC-16 | Facility Booking | Resident |
| UC-17 | Online Voting | Resident |
| UC-18 | Log Visitor Entry | Security Guard |
| UC-19 | Log Visitor Exit | Security Guard |
| UC-20 | Track Staff Attendance | Security Guard |
| UC-21 | Manage Gate Access | Security Guard |
| UC-22 | Receive SOS Notification | Security Guard |
| UC-23 | Security Patrolling | Security Guard |

---

## 9. Architecture — Three-Tier + Perfectly Modular Systems

### 9.1 Logical Architecture (from Design Document)

**Presentation → Application → Data**

- **Presentation:** Web UI — HTML, CSS, JavaScript, React, Material UI.
- **Application:** Node.js + Express — business logic, validation, authorization.
- **Data:** MongoDB — collections listed in §10.

**Inter-tier:** HTTPS REST APIs between frontend and backend; CRUD and transactional operations between backend and MongoDB.

### 9.2 Role-Oriented UI Surfaces (from Architecture Diagram)

| Surface | Features |
|---------|----------|
| **Admin Dashboard** | User management, units, billing & reports, inventory, notice publishing (and polls per class diagram) |
| **Resident Portal** | View/pay bills (dummy), complaints, SOS, facility booking, notices |
| **Security Guard Panel** | Visitor entry/exit, staff attendance, gate access integration, SOS alerts, patrolling |
| **Accountant Panel** | Generate bills, record expenses, financial reports, defaulter lists |

### 9.3 Perfectly Modular Systems — Implementation Doctrine

**Objective:** Each domain is a **system module** with clear boundaries: own routes, controllers/services, data access, validation schemas, and React feature folders. Shared code is minimal and generic (auth, HTTP client, UI shell, design tokens).

#### Backend modules (Express)

Align Express **routers** one-to-one with application-layer modules from the design doc:

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, logout, session/JWT (as chosen), password hashing, role checks, session timeout |
| `membersUnits` | Users (resident-facing CRUD for admin), units, ownership records, directory search |
| `billingPayments` | Bill generation, calculate charges, payments, dummy gateway |
| `complaintsCommunication` | Notices, complaints, polls, votes |
| `securityVisitors` | Visitors, guest approvals, visitor logs, gate access logs, staff, staff attendance, SOS, patrol logs |
| `inventoryExpenses` | Inventory, expenses, financial report generation (and persistence if storing report metadata) |

Each module exposes **only** REST endpoints needed by the UI; shared middleware: authentication, role authorization, error formatter, request validation.

#### Frontend modules (React)

| Feature module | Route segment (example) | Roles |
|----------------|---------------------------|--------|
| `auth` | `/login` | All |
| `admin/members` | Admin | Admin |
| `admin/units` | Admin | Admin |
| `admin/inventory` | Admin | Admin |
| `admin/notices` | Admin | Admin |
| `accountant/billing` | Accountant / Admin | Accountant, Admin |
| `accountant/expenses` | … | Accountant, Admin |
| `accountant/reports` | … | Accountant, Admin |
| `resident/*` | Bills, complaints, SOS, bookings, polls, guest approval | Resident |
| `security/*` | Visitors, attendance, gate, SOS inbox, patrol | SecurityGuard |

Each feature folder owns: **pages**, **components**, **hooks**, **api clients** (calls to matching backend module), and **local types**.

#### Cross-cutting modules

- **Notification abstraction:** Service interface for email/SMS/app; concrete `ConsoleNotificationProvider` or similar for demo, swappable later.
- **Gate integration:** `GateAccessAdapter` interface; real hardware vs **simulator** behind the same API used by `Manage Gate Access` and visitor flows.
- **Payment:** `DummyPaymentProvider` only—validates dummy fields, returns success/failure, writes `payments` and updates `bills`.

This yields **consistent, testable units** that map directly to SRS use cases and test cases.

---

## 10. Data Layer — MongoDB

### 10.1 Collection Names (authoritative)

`users`, `units`, `ownershipRecords`, `bills`, `payments`, `expenses`, `financialReports`, `complaints`, `notices`, `polls`, `votes`, `visitors`, `guestApprovals`, `visitorLogs`, `gateAccessLogs`, `patrolLogs`, `staff`, `staffAttendance`, `sosAlerts`, `sosResponses`, `facilities`, `facilityBookings`, `inventory`

### 10.2 Schema Summary (from Database Design + ERD reconciliation)

**Users** — `userId`, name, email, phone, `passwordHash`, `role` (`Admin` | `Resident` | `Accountant` | `SecurityGuard`), `familyDetails`, `vehicleInfo`, `status` (`Active` | `Inactive`).  
*ERD adds:* `createdAt` — include for auditing.

**Units** — `unitId`, `unitNumber`, `unitType` (`Apartment` | `Villa` | `Plot`), floor, `monthlyCharges`, status (`Occupied` | `Vacant`).

**OwnershipRecords** — `recordId`, `unitId`, `userId`, `ownershipType` (`Owner` | `Tenant`), `startDate`, `endDate` (null if current). *Authoritative link for residency history and many-residents-per-unit.*

**Bills** — `billId`, `unitId`, `generatedBy`, `billType`, amount, `dueDate`, status.

**Payments** — `paymentId`, `billId`, `paidBy`, `amountPaid`, `paymentMethod`, `transactionRef`, `paidAt`.

**Expenses** — `expenseId`, category, amount, `expenseDate`, `recordedBy`.  
*ERD includes `description` — **include** for reporting clarity.

**FinancialReports** — `reportId`, `reportType` (`Income` | `Expense` | `BalanceSheet` | `Defaulters`), `generatedBy`, `dateRangeStart`, `dateRangeEnd`. Optional: store generated snapshot URI or JSON for audit.

**Notices** — `noticeId`, `postedBy`, title, description, priority, `postedAt`.

**Complaints** — `complaintId`, `ticketId`, `submittedBy`, `unitId`, category, description, status (`Pending` | `In Progress` | `Resolved`).

**Polls** — `pollId`, question, `options` (JSON array), `startDate`, `endDate`, status (`Open` | `Closed`).  
*ERD adds `createdBy` — **include** (Admin reference).

**Votes** — `voteId`, `pollId`, `votedBy`, `selectedOption`. **Unique compound index:** (`pollId`, `votedBy`).

**Visitors** — `visitorId`, name, phone, `idProofType`, `idProofNumber`.

**GuestApprovals** — `approvalId`, `approvedBy`, `visitorId`, `unitId`, `validDate`, status.

**VisitorLogs** — `logId`, `visitorId`, `unitId`, `loggedBy`, `entryTime`, `exitTime`, `approvalId` (nullable), purpose.

**GateAccessLogs** — `accessId`, `entityType` (`Staff` | `Visitor` | `Resident`), `entityId`, action (`Approved` | `Denied`), timestamp, `managedBy`.

**PatrolLogs** — `patrolId`, `guardId`, `routeId`, timestamp (and optional checkpoint id if needed by UC-23).

**Staff** — `staffId`, name, role (`Maid` | `Driver` | `Vendor` | `Other`), phone, `assignedUnitId` (nullable).

**StaffAttendance** — `attendanceId`, `staffId`, `entryTime`, `exitTime`, `recordedBy`.  
*ERD adds `date` — useful for daily queries.

**SOSAlerts** — `alertId`, `triggeredBy`, `locationInfo`, status, `emergencyContacts` (JSON).

**SOSResponses** — `responseId`, `alertId`, `guardId`, `acknowledgedAt`.

**Facilities** — `facilityId`, name, type, capacity, status.

**FacilityBookings** — `bookingId`, `facilityId`, `bookedBy`, date, `timeSlotStart`, `timeSlotEnd`, status.

**Inventory** — Align Database Design with ERD: `itemId`, `itemName`, category, quantity, condition, `purchaseDate`, `lastUpdated`, `managedBy`; add `status` if fixed assets need lifecycle (per class diagram).

### 10.3 Indexes and Integrity (application-enforced)

- Unique email per user (or login identifier).
- Unique `ticketId` for complaints.
- Unique (`pollId`, `votedBy`) on votes.
- **No double booking:** query overlap for same `facilityId` and `date` where time ranges intersect.
- **Bill payment:** On successful dummy payment, update parent **Bill** status to paid (ERD: bill–payment integrity).
- **Visitor log:** `approvalId` nullable for walk-ins.

### 10.4 Business Rules (from ERD)

- One vote per resident per poll.
- No overlapping facility bookings for the same facility/time.
- Payment requires bill; update bill status on payment.
- SOS workflow notifies guards (and optional external contacts via `emergencyContacts`).
- Role enforcement: e.g. notices/polls creation Admin-only; complaints/SOS/booking Resident-facing as specified.

---

## 11. Domain Model (Class Diagram) — Mapping to Code

Abstract **User** with role subclasses is a **logical** model; implementation typically uses a single `users` collection with `role` field + **policy functions** per module (`canPublishNotice(user)`, etc.).

Key entities: `Unit`, `OwnershipRecord`, `Bill`, `Payment`, `Expense`, `FinancialReport`, `Notice`, `Complaint`, `Poll`, `Vote`, `Visitor`, `VisitorLog`, `GuestApproval`, `Staff`, `StaffAttendance`, `GateAccessLog`, `SOSAlert`, `SOSResponse`, `PatrolLog`, `Facility`, `FacilityBooking`, `Inventory`.

**Included use cases in behavior:** `calculateCharges` (billing service), `processDummyPayment` (payment service), `triggerAlert` / `notifySecurityGuard` (SOS pipeline).

---

## 12. Sequence Flows — Implementation Checklist

For each UC in §8, implement the steps and exceptions documented in `Design Document - Sequence Diagrams.txt`. Highlights:

- **UC-04 Generate Bills:** Load units/residents → calculate charges → persist bills → trigger notification abstraction.
- **UC-11 / UC-12:** Outstanding bills → dummy payment page → validate → update payment + bill status → confirm.
- **UC-13 / UC-14 / UC-22:** SOS creates `sosAlerts`, pushes to active guards (WebSocket/polling acceptable for FYP), `sosResponses` on acknowledge.
- **UC-15:** `guestApprovals` + notify guard path.
- **UC-16:** Availability check before save; transactional conflict handling for double booking.
- **UC-17:** Validate poll open + not yet voted; on close, compute results from `votes`.
- **UC-18–21, UC-23:** Visitor/staff/gate/patrol writes to respective collections; gate adapter invoked from gate module.

---

## 13. REST API Plan (Modular)

Prefix all APIs with `/api/v1` (example). Group by backend module:

- **`/auth/*`** — login, logout, refresh, current user, password change.
- **`/users/*`**, **`/units/*`**, **`/ownership-records/*`** — CRUD + directory search (Admin).
- **`/bills/*`**, **`/payments/*`** — generate, list, pay (dummy), defaulters data.
- **`/expenses/*`**, **`/reports/*`** — expenses CRUD; report generation by type.
- **`/notices/*`**, **`/complaints/*`**, **`/polls/*`**, **`/votes/*`**
- **`/visitors/*`**, **`/guest-approvals/*`**, **`/visitor-logs/*`**, **`/gate-access/*`**, **`/staff/*`**, **`/staff-attendance/*`**, **`/sos/*`**, **`/patrols/*`**
- **`/facilities/*`**, **`/bookings/*`**, **`/inventory/*`**

Enforce **role middleware** per route group matching §3.

---

## 14. Security Design

- HTTPS; **hash passwords** (e.g. bcrypt with appropriate cost).
- **RBAC** on every route and mirrored in UI route guards.
- **Session timeout** for inactivity (configurable constant).
- Input validation (e.g. Zod/Joi) per module; sanitize outputs.
- Rate-limit login and SOS endpoints as feasible.

---

## 15. Testing — Alignment with Test Cases

Execute **TC-01 … TC-23** from `Design Document - Test Cases.txt` as acceptance criteria. Map each TC to the corresponding UC. Additional tests: unique vote, double-booking rejection, bill paid transition, SOS acknowledgment.

---

## 16. Implementation Phases (Suggested)

| Phase | Deliverables |
|-------|----------------|
| **1 — Foundation** | Repo layout (Perfectly Modular Systems), MongoDB connection, auth + RBAC, user seeding, HTTPS dev proxy |
| **2 — Core admin** | Members, units, ownership history, directory |
| **3 — Finance** | Bills, calculate charges, dummy payments, expenses, reports |
| **4 — Communication** | Notices, complaints + tracking, polls + votes |
| **5 — Security** | Visitors, approvals, logs, staff attendance, gate adapter, SOS + responses, patrol |
| **6 — Amenities** | Facilities, bookings with overlap validation |
| **7 — Inventory** | Inventory CRUD |
| **8 — Hardening** | NFR tuning (timeouts, load smoke), TC-01–TC-23 regression, documentation |

---

## 17. Traceability Matrix (Abbreviated)

| FR | Primary modules | Collections |
|----|-----------------|-------------|
| FR-1 | `membersUnits` | users, units, ownershipRecords |
| FR-2 | `billingPayments`, `inventoryExpenses` | bills, payments, expenses, financialReports |
| FR-3 | `complaintsCommunication` | notices, complaints, polls, votes, sosAlerts |
| FR-4 | `securityVisitors` | visitors, guestApprovals, visitorLogs, gateAccessLogs, staff, staffAttendance, patrolLogs, sosAlerts, sosResponses |
| FR-5 | `complaintsCommunication`, `inventoryExpenses` | facilities, facilityBookings, inventory |

---

## 18. Documentation Reconciliation Notes

These keep one coherent model across all `.txt` sources:

1. **Polls:** Database design lists polls/votes; ERD adds **`createdBy`** on polls — **retain `createdBy`**.
2. **Expenses:** ERD **`description`** field — **retain**.
3. **Users:** ERD **`createdAt`** — **retain**.
4. **StaffAttendance:** ERD **`date`** — **retain** for daily reporting.
5. **Bill vs Payment:** ERD states at most one payment record per bill for the modeled flow; partial payments are out of scope unless requirements change.
6. **Inventory:** Merge class diagram `status` with DB `condition`/quantity as separate fields—both allowed.
7. **Notifications:** Implement a **provider interface**; FYP uses simulated delivery while preserving FR-2a behavior in UX (show “notification queued/sent”).

---

## 19. Success Criteria

- All **functional** and **non-functional** requirements in §4–§5 addressed or explicitly simulated with the same user-visible workflows.
- All **UC-01–UC-23** realizable end-to-end.
- **MongoDB** collections and rules aligned with §10; **modular** frontend/backend structure per §9.3.
- **TC-01–TC-23** pass.
- Deployment-ready story: HTTPS, env-based config, hashed passwords, session policy.

---

*This plan is the single umbrella for building the Housing Society Management System as **Perfectly Modular Systems** on the documented React + Express + MongoDB stack.*
