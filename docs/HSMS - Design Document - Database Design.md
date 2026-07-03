# Database Design

### 1. USERS (Core Actors)

userId (PK), name, email, phone, passwordHash, role (Admin | Resident | Accountant | SecurityGuard),

familyDetails, vehicleInfo, status (Active | Inactive)

Note: Stored role value SecurityGuard corresponds to the Security Guard actor in SRS and UI text.

### 2. UNITS (Property Management)

unitId (PK), unitNumber, unitType (Apartment | Villa | Plot), floor, monthlyCharges,

status (Occupied | Vacant)

### 3. OWNERSHIP_RECORDS (History Tracking)

recordId (PK), unitId (FK), userId (FK), ownershipType (Owner | Tenant), startDate,

endDate (Null if current)

### 4. BILLS & PAYMENTS

BILLS: billId (PK), unitId (FK), generatedBy (FK), billType, amount, dueDate, status

PAYMENTS: paymentId (PK), billId (FK), paidBy (FK), amountPaid, paymentMethod, transactionRef, paidAt

### 5. EXPENSES & FINANCIAL_REPORTS

EXPENSES: expenseId (PK), category, amount, expenseDate, recordedBy (FK)

FINANCIAL_REPORTS: reportId (PK), reportType (Income | Expense | BalanceSheet | Defaulters),

generatedBy (FK), dateRangeStart, dateRangeEnd

### 6. COMMUNICATION

NOTICES: noticeId (PK), postedBy (FK), title, description, priority, postedAt

COMPLAINTS: complaintId (PK), ticketId, submittedBy (FK), unitId (FK), category, description,

status (Pending | In Progress | Resolved)

POLLS: pollId (PK), question, options (JSON), startDate, endDate, status (Open | Closed)

VOTES: voteId (PK), pollId (FK), votedBy (FK), selectedOption

Constraint: Unique pollId + votedBy

### 7. SECURITY & VISITORS

VISITORS: visitorId (PK), name, phone, idProofType, idProofNumber

GUEST_APPROVALS: approvalId (PK), approvedBy (FK), visitorId (FK), unitId (FK), validDate, status

VISITOR_LOG: logId (PK), visitorId (FK), unitId (FK), loggedBy (FK), entryTime, exitTime,

approvalId (Nullable FK), purpose

GATE_ACCESS_LOGS: accessId (PK), entityType (Staff | Visitor | Resident), entityId,

action (Approved | Denied), timestamp, managedBy (FK)

PATROL_LOGS: patrolId (PK), guardId (FK), routeId, timestamp

### 8. STAFF & ATTENDANCE

STAFF: staffId (PK), name, role (Maid | Driver | Vendor | Other), phone, assignedUnitId (Nullable FK)

STAFF_ATTENDANCE: attendanceId (PK), staffId (FK), entryTime, exitTime, recordedBy (FK)

### 9. SOS ALERTS & RESPONSES

SOS_ALERTS: alertId (PK), triggeredBy (FK), locationInfo, status, emergencyContacts (JSON)

SOS_RESPONSES: responseId (PK), alertId (FK), guardId (FK), acknowledgedAt

### 10. AMENITIES & INVENTORY

FACILITIES: facilityId (PK), name, type, capacity, status

FACILITY_BOOKINGS: bookingId (PK), facilityId (FK), bookedBy (FK), date, timeSlotStart,

timeSlotEnd, status

INVENTORY: itemId (PK), itemName, quantity, condition, purchaseDate, lastUpdated, managedBy (FK)

## MongoDB Collection Names (lowerCamelCase plural, aligned with architecture)

users, units, ownershipRecords, bills, payments, expenses, financialReports, complaints, notices,

polls, votes, visitors, guestApprovals, visitorLogs, gateAccessLogs, patrolLogs, staff, staffAttendance,

sosAlerts, sosResponses, facilities, facilityBookings, inventory

## ASCII DATABASE DESIGN

This schema corrects the 1:M Resident-Unit relationship via OWNERSHIP_RECORDS, adds the missing

POLLS and VOTES tables, and includes the SOS_RESPONSES for security accountability.

```text
       +-----------------------+           +-----------------------+
       |         USERS         |           |         UNITS         |
       |-----------------------|           |-----------------------|
       | *userId (PK)          |           | *unitId (PK)          |
       | name, email, phone    |           | unitNumber, type      |
       | role, passwordHash    |           | floor, monthlyCharges |
       | status                |           | status (Occupied/Vac) |
       +-----------+-----------+           +-----------+-----------+
                   | 1                                 | 1
                   |                                   |
           +-------+-----------------------------------+-------+
           |               OWNERSHIP_RECORDS                   |
           |---------------------------------------------------|
           | *recordId (PK)                                    |
           | userId (FK), unitId (FK)                          |
           | ownershipType (Owner/Tenant), startDate, endDate  |
           +---------------------------------------------------+
```

[FINANCIALS]                           [COMMUNICATION]

```text
+-------------------+              +-----------------------------+
|       BILLS       |              |            POLLS            |
|-------------------|              |-----------------------------|
| *billId (PK)      |              | *pollId (PK)                |
| unitId, genBy(FK) |              | question, options (JSON)    |
| amount, status    +---+ 1        | startDate, endDate          |
+-------------------+   |          +--------------+--------------+
                        | 0..1                    | 1
+-------------------+   |          +--------------+--------------+
|     PAYMENTS      |   |          |            VOTES            |
|-------------------|   |          |-----------------------------|
| *paymentId (PK)   |   |          | *voteId (PK)                |
| billId (FK) <----+---+          | pollId (FK), userId (FK)    |
| paidBy, method    |              | selectedOption              |
+-------------------+              +-----------------------------+
```

[SECURITY]                             [STAFF]

```text
+-------------------+              +-----------------------------+
|    SOS_ALERTS     |              |            STAFF            |
|-------------------|              |-----------------------------|
| *alertId (PK)     |              | *staffId (PK)               |
| triggeredBy (FK) +---+ 1        | name, role, phone           |
| location, status  |   |          | assignedUnitId (FK)         |
+-------------------+   |          +--------------+--------------+
                        | M                       | 1
+-------------------+   |          +--------------+--------------+
|   SOS_RESPONSES   |   |          |      STAFF_ATTENDANCE       |
|-------------------|   |          |-----------------------------|
| *responseId (PK)  |   |          | *attendanceId (PK)          |
| alertId (FK) <---+---+          | staffId (FK), entryTime     |
| guardId (FK)      |              | exitTime, recordedBy (FK)   |
+-------------------+              +-----------------------------+
```

[GUESTS]

```text
+-------------------+      1       +-----------------------------+
| GUEST_APPROVALS   +--------------+        VISITOR_LOG          |
|-------------------|              |-----------------------------|
| *approvalId (PK)  |      0..1    | *logId (PK)                 |
| approvedBy (FK)   |              | visitorId (FK), unitId (FK) |
| visitorId, unitId |              | entry, exit, approvalId(FK) |
+-------------------+              +-----------------------------+
```
