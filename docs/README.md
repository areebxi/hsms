# HSMS — Project documentation

Central index for all Housing Society Management System (HSMS) documentation. Start at the [repository README](../README.md) for setup and quick start.

---

## Quick links

| Document | Audience | Purpose |
|----------|----------|---------|
| [../README.md](../README.md) | Everyone | Install, run, configure, project overview |
| [plan.md](plan.md) | Developers | Master implementation blueprint (FR/NFR, architecture, phases) |
| [API.md](API.md) | Developers | REST API reference (`/api/v1`) |
| [TEST_TRACEABILITY.md](TEST_TRACEABILITY.md) | QA / viva | TC-01–TC-23 mapped to use cases, routes, and UI |
| [PROJECT_LOG.md](PROJECT_LOG.md) | Team | Implementation activity log |

---

## Specification documents

Formal FYP / SRS and design artifacts (`HSMS - *.md`):

| Document | Topic |
|----------|-------|
| [HSMS - Introduction and Scope of the Project.md](HSMS%20-%20Introduction%20and%20Scope%20of%20the%20Project.md) | Vision, scope, stakeholders |
| [HSMS - Functional and Non-Functional Requirements.md](HSMS%20-%20Functional%20and%20Non-Functional%20Requirements.md) | FR-1…FR-5, NFR tables |
| [HSMS - Tools and Technologies.md](HSMS%20-%20Tools%20and%20Technologies.md) | Stack and tooling |
| [HSMS - SRS Document - Usage Scenarios.md](HSMS%20-%20SRS%20Document%20-%20Usage%20Scenarios.md) | Use cases UC-01–UC-23 |
| [HSMS - SRS Document - Use Case Diagram.md](HSMS%20-%20SRS%20Document%20-%20Use%20Case%20Diagram.md) | Use-case relationships |
| [HSMS - Design Document - Architecture Design Diagram.md](HSMS%20-%20Design%20Document%20-%20Architecture%20Design%20Diagram.md) | System architecture |
| [HSMS - Design Document - Database Design.md](HSMS%20-%20Design%20Document%20-%20Database%20Design.md) | MongoDB collections |
| [HSMS - Design Document - Entity Relationship Diagram.md](HSMS%20-%20Design%20Document%20-%20Entity%20Relationship%20Diagram.md) | ERD |
| [HSMS - Design Document - Class Diagram.md](HSMS%20-%20Design%20Document%20-%20Class%20Diagram.md) | Domain model |
| [HSMS - Design Document - Sequence Diagrams.md](HSMS%20-%20Design%20Document%20-%20Sequence%20Diagrams.md) | Per–use-case flows |
| [HSMS - Design Document - Test Cases.md](HSMS%20-%20Design%20Document%20-%20Test%20Cases.md) | Acceptance tests TC-01–TC-23 |

---

## Implementation reference

### Roles and portals

| Role (API) | UI label | Portal route | Home after login |
|------------|----------|--------------|------------------|
| `Admin` | Admin | `/admin` | `/admin` |
| `Accountant` | Accountant | `/accountant` | `/accountant` |
| `Resident` | Resident | `/resident` | `/resident` |
| `SecurityGuard` | Security Guard | `/security` | `/security` |

Admin can access accountant and security screens via shared `ROLE_GROUPS` in `frontend/src/shared/constants/roles.js`.

### Backend modules

| Module | Path prefix | Responsibility |
|--------|-------------|----------------|
| `auth` | `/api/v1/auth` | Login, session profile, logout |
| `membersUnits` | `/api/v1/users`, `/units`, `/ownership-records`, `/my-units` | Members, units, ownership |
| `billingPayments` | `/api/v1/bills`, `/payments` | Billing, dummy card payment, defaulters |
| `complaintsCommunication` | `/api/v1/notices`, `/complaints`, `/polls`, `/votes` | Notices, complaints, polls |
| `securityVisitors` | `/api/v1/visitors`, `/guest-approvals`, `/visitor-logs`, `/gate-access`, `/staff`, `/staff-attendance`, `/sos`, `/patrols` | Security operations |
| `inventoryExpenses` | `/api/v1/expenses`, `/reports`, `/facilities`, `/bookings`, `/inventory` | Finance reports, facilities, inventory |

### Frontend route map

| Portal | Routes |
|--------|--------|
| **Admin** | `/admin` (overview), `members`, `units`, `ownership`, `notices`, `complaints`, `polls`, `staff`, `facilities`, `inventory` |
| **Accountant** | `/accountant` (overview), `bills`, `expenses`, `reports` |
| **Resident** | `/resident` (overview), `bills`, `notices`, `complaints`, `polls`, `guests`, `sos`, `bookings` |
| **Security** | `/security` (overview), `visitors`, `gate`, `staff-attendance`, `sos`, `patrols` |

### Integrations (stubbed for FYP)

| Integration | File | Notes |
|-------------|------|-------|
| Notifications | `backend/src/integrations/notificationProvider.js` | Bill alerts use `channel: "app"` |
| Dummy payment | `backend/src/integrations/dummyPaymentProvider.js` | Card flow via `POST /payments/card` |
| Gate access | `backend/src/integrations/gateAccessAdapter.js` | Called on gate events and staff checkout |

---

## Traceability at a glance

| Functional area | FR IDs | Primary module | Test cases |
|-----------------|--------|----------------|------------|
| Member & property | FR-1 | `membersUnits` | TC-01, TC-02, TC-03 |
| Finance | FR-2 | `billingPayments`, `inventoryExpenses` | TC-04–TC-06, TC-11, TC-12 |
| Communication | FR-3 | `complaintsCommunication` | TC-07, TC-09, TC-10, TC-13, TC-14, TC-17, TC-22 |
| Security | FR-4 | `securityVisitors` | TC-15, TC-18–TC-21, TC-23 |
| Amenities & assets | FR-5 | `inventoryExpenses`, `complaintsCommunication` | TC-08, TC-16 |

Full mapping: [TEST_TRACEABILITY.md](TEST_TRACEABILITY.md).

---

## Implementation status

All eight phases from [plan.md](plan.md) §16 are complete (see [PROJECT_LOG.md](PROJECT_LOG.md)):

1. Foundation — auth, models, RBAC  
2. Core admin — members, units, ownership  
3. Finance — bills, payments, expenses, reports  
4. Communication — notices, complaints, polls  
5. Security — visitors, gate, staff, SOS, patrols  
6. Amenities — facilities and bookings  
7. Inventory — CRUD  
8. Hardening — rate limits, smoke test, documentation  

---

## Suggested reading order

**For viva / presentation:** Introduction → Functional requirements → Usage scenarios → Architecture diagram → Test traceability.

**For development:** README → plan.md → API.md → relevant design doc for the module you are changing.

**For testing:** Test Cases doc → TEST_TRACEABILITY.md → smoke script (`npm run smoke`).
