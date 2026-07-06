# Architecture Design Diagram

## HSMS - Three-Tier Architecture Diagram

## Overall Structure

- Orientation: Vertical (Top to Bottom)
- Total Tiers: 3
- Title (Top Center): "Housing Society Management System (HSMS) - Three-Tier Architecture"

## TOP TIER - Presentation Layer (Frontend)

**Container Label: Presentation Layer (Web Interface - HTML, CSS, JavaScript, React.js with Material UI)**

## Inside This Box (Left to Right)

#### Admin Dashboard

- Member Management
- Unit Management
- Ownership & Tenancy
- Notice Publishing
- Polls
- Staff Registry
- Facilities
- Inventory Management

#### Resident Portal

- View & Pay Bills (Dummy)
- Submit Complaints
- SOS Alerts
- Facility Booking
- View Notices

#### Security Guard Panel

- Visitor Entry / Exit
- Staff Attendance
- Gate Access Control Integration
- Receive SOS Alerts
- Security Patrolling

#### Accountant Panel

- Generate Bills
- Record Expenses
- Financial Reports
- Defaulter Lists

Icons/Logos to Use

- React.js logo
- Material UI logo
- Browser icon (Web App)
- User icons for roles

Arrow Down (Label)

- HTTPS/REST API Requests

## MIDDLE TIER - Application Layer (Business Logic)

**Container Label: Application Layer (Node.js + Express.js)**

## Inside This Box (Stacked Modules)

#### Authentication & Authorization Module

- Role-Based Access Control
- Session Management

#### Member & Unit Management Module

- Residents
- Units
- Ownership/Tenancy

#### Billing & Payment Module

- Bill Generation
- Dummy Payment Processing
- Due Calculations

#### Complaint & Communication Module

- Complaints
- Notices
- Polling

#### Security & Visitor Management Module

- Visitors
- Staff Attendance
- SOS Handling

#### Inventory & Expense Management Module

- Inventory Items
- Society Assets
- Expenses

Icons/Logos to Use

- Node.js logo
- Express.js logo
- Gear/Logic icons

Arrow Down (Label)

- CRUD Operations (Create, Read, Update, Delete)

## BOTTOM TIER - Data Layer (Database)

**Container Label: Data Layer (MongoDB Database)**

## Inside This Box

- Database Collections (MongoDB; lowerCamelCase plural names):
users, units, ownershipRecords, bills, payments, expenses, financialReports,

complaints, notices, polls, votes, visitors, guestApprovals, visitorLogs,

gateAccessLogs, patrolLogs, staff, staffAttendance, sosAlerts, sosResponses,

facilities, facilityBookings, inventory

- Each document in users includes role: Admin | Resident | Accountant | SecurityGuard
(stored value SecurityGuard matches "Security Guard" in SRS/UI).

Icons/Logos

- MongoDB logo
- Database cylinder icon

## Arrow Directions Summary

```text
Frontend (HTML, CSS, JavaScript, React + Material UI)
      |
```

| HTTPS
```text
      v
Backend (Node + Express)
      |
```

| CRUD
```text
      v
Database (MongoDB)
```
