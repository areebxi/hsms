# Sequence Diagrams

## UC-01: Register Member

**Actors:** Admin

**Flow:**

1. Admin clicks on "Add Member".
2. System displays registration form.
3. Admin enters resident details (personal info, family details, vehicle info, unit number, ownership).
4. Admin submits the form.
5. System validates the information.
6. System stores the details in the database.
7. Confirmation message is displayed.

**Sequence Diagram:**

```text
Admin         System          Database
 |              |                |
 |--Add Member->|                |
 |              |--Show Form---->|
 |              |                |
 |--Enter Details--------------->|
 |              |--Validate----->|
 |              |                |
 |              |--Save--------->|
 |              |                |
 |<--Confirmation Message--------|
```

## UC-02: Manage Units

**Actors:** Admin

**Flow:**

1. Open "Unit Management" module.
2. Click "Add/Edit Unit".
3. Enter unit details (type, floor, charges).
4. Submit the form.
5. System validates data.
6. Save the unit information.
7. Display confirmation message.

**Sequence Diagram:**

```text
Admin         System          Database
 |              |                |
 |-Open Module->|                |
 |              |--Display Form->|
 |--Enter Details--------------->|
 |              |--Validate----->|
 |              |--Save--------->|
 |<--Confirmation Message--------|
```

## UC-03: View Member Directory

**Actor:** Admin

**Flow:**

1. Open the member directory.
2. Enter search filters.
3. System queries the database.
4. Display matching results.

**Sequence Diagram:**

```text
Admin        System          Database
 |             |                |
 |--Open Dir-->|                |
 |             |-Fetch Records->|
 |             |                |
 |<--Display Results------------|
```

## UC-04: Generate Bills

**Actors:** Admin/Accountant

**Flow:**

1. Open the Billing Module.
2. Load unit and resident details.
3. Calculate Charges (included use case).
4. System generates bills.
5. Save bills to the database.
6. Send notifications (email, SMS, or app).

**Sequence Diagram:**

```text
User          System                  Database
 |              |                        |
 |----------Open Billing Module--------->|
 |              |--Load Units/Residents->|
 |              |                        |
 |              |--Calculate Charges---->|
 |              |--Generate Bills------->|
 |              |--Save Bills----------->|
 |<-----------Notify Residents-----------|
```

## UC-05: Expense Tracking

**Actors:** Admin/Accountant

**Flow:**

1. Open Expense Module.
2. Enter expense details (type, amount, date).
3. Categorize the expense.
4. Save to database.
5. Display confirmation.

**Sequence Diagram:**

```text
Admin/Accountant        System         Database
 |                        |               |
 |------------Open Expense Module-------->|
 |------------Enter Expense Details------>|
 |                        |--Validate---->|
 |                        |--Save-------->|
 |<-----------Confirmation Message--------|
```

## UC-06: Generate Financial Reports

**Actors:** Admin/Accountant

**Flow:**

1. Open Reports Module.
2. Select report type (Income, Expense, BalanceSheet, or Defaulters).
3. Fetch required data.
4. Format and display the report on the dashboard.
**Exceptions:** Database query failure. Data incomplete -> display warning.

**Sequence Diagram:**

```text
Admin/Accountant          System        Database
 |                          |              |
 |----------Open Reports Module----------->|
 |----------Select Report Type------------>|
 |                          |--Fetch Data->|
 |                          |--Format----->|
 |<-------Display Report-------------------|
```

## UC-07: View Notice Board

**Actors:** Admin/Resident

**Flow:**

1. Open Notice Board.
2. Load notice list.
3. Display notices sorted by date/priority.
4. User reads notices.
**Exceptions:** Database failure. No notices -> display "No Notices".

**Sequence Diagram:**

```text
Admin/Resident          System         Database
 |                        |                |
 |----Open Notice Board------------------->|
 |                        |-Fetch Notices->|
 |<---Display Notices----------------------|
```

## UC-08: Manage Inventory

**Actors:** Admin

**Flow:**

1. Open Inventory Module.
2. Add/Edit/Delete item.
3. Validate input data.
4. Save changes.
5. Display confirmation.

**Sequence Diagram:**

```text
Admin         System        Database
 |             |              |
 |--Open Inventory Module---->|
 |--Add/Edit/Delete Item----->|
 |             |--Validate--->|
 |             |--Save------->|
 |<--Confirmation Message-----|
```

## UC-09: Submit Complaint

**Actors:** Resident

**Flow:**

1. Open Complaint Module.
2. Enter complaint details.
3. Submit complaint.
4. System saves to database.
5. Generate ticket ID.
6. Display confirmation.

**Sequence Diagram:**

```text
Resident     System       Database
 |             |              |
 |--Open Complaint Module---->|
 |--Enter Complaint Details-->|
 |             |--Validate--->|
 |             |--Save------->|
 |<--Ticket ID Confirmation---|
```

## UC-10: Track Complaint Status

**Actor:** Resident

**Flow:**

1. Open "Track Complaint" module.
2. Select complaint by ticket ID.
3. System fetches current status (Pending/In Progress/Resolved).
4. Display status to resident.

**Sequence Diagram:**

```text
Resident      System        Database
 |             |               |
 |---Open Track Module-------->|
 |---Select Complaint--------->|
 |             |-Fetch Status->|
 |<--Display Status------------|
```

## UC-11 & UC-12: Pay Bills / Dummy Payment Processing

**Actor:** Resident

**Flow:**

1. Open "Pay Bills" module.
2. Display outstanding bills.
3. Select bill to pay.
4. Open Dummy Payment Page (include: Dummy Payment Processing).
5. Enter dummy payment details.
6. System processes payment.
7. Display confirmation.

**Sequence Diagram:**

```text
Resident      System              Database
 |              |                     |
 |-------Open Pay Bills Module------->|
 |----------Select Bill-------------->|
 |-------Open Dummy Payment Page----->|
 |--------Enter Dummy Details-------->|
 |              |------Validate------>|
 |              |--Process Payment--->|
 |              |-Update Bill Status->|
 |<-------Confirmation Message--------|
```

## UC-13: SOS Alert

**Actors:** Resident

**Flow:**

1. Resident taps SOS button.
2. System sends alert with resident location.
3. Includes Notify Security Guard use case.
4. Security Guard receives alert and responds.

**Sequence Diagram:**

```text
Resident       System      Security Guard
 |               |               |
 |--Trigger SOS->|               |
 |               |--Send Alert-->|
 |               |               |
 |               |<--Acknowledge--|
 |<--Notification Sent-----------|
```

## UC-14: Notify Security Guard

**Actors:** System, Security Guard

**Flow:**

1. System receives an SOS event (from UC-13).
2. System sends notifications to active Security Guards.
3. Security Guard acknowledges.

**Sequence Diagram:**

```text
System         Security Guard
 |                |
 |---Notify SOS--->|
 |                |
 |<--Acknowledge---|
```

## UC-15: Pre-Approve Guest

**Actor:** Resident

**Flow:**

1. Open pre-approval module.
2. Enter guest details (name, date, purpose).
3. Save and confirm.
4. Notify security guard.

**Sequence Diagram:**

```text
Resident      System      Security Guard
 |             |                |
 |---Open Pre-Approval Module-->|
 |----Enter Guest Details------>|
 |             |---Save-------->|
 |             |--Notify Guard->|
 |<----Confirmation Message-----|
```

## UC-16: Facility Booking

**Actor:** Resident

**Flow:**

1. Open "Facility Booking" module.
2. Check facility availability.
3. Select desired time slot.
4. Confirm booking.
5. Save booking in system.
6. Display confirmation.

**Sequence Diagram:**

```text
Resident      System        Database
 |             |               |
 |--Open Facility Module------>|
 |--Check Availability-------->|
 |--Select Slot--------------->|
 |             |--Validate---->|
 |             |--Save-------->|
 |<---Confirmation Message-----|
```

## UC-17: Online Voting

**Actor:** Resident

**Flow:**

1. Open poll module.
2. View poll question and options.
3. Cast vote.
4. System records vote.
5. Display final result after poll ends.

**Sequence Diagram:**

```text
Resident      System        Database
 |             |               |
 |-----Open Poll Module------->|
 |-----View Options----------->|
 |-----Cast Vote-------------->|
 |             |--Validate---->|
 |             |--Save Vote--->|
 |<---Vote Confirmation--------|
 |<------Display Result--------|
```

## UC-18: Log Visitor Entry

**Actor:** Security Guard

**Flow:**

1. Open visitor log module.
2. Enter visitor info (name, flat, purpose).
3. Save entry.
4. Display confirmation.

**Sequence Diagram:**

```text
Guard        System       Database
 |             |             |
 |--Open Visitor Log-------->|
 |--Enter Visitor Info------>|
 |             |--Validate-->|
 |             |-Save Entry->|
 |<--Confirmation Message----|
```

## UC-19: Log Visitor Exit

**Actor:** Security Guard

**Flow:**

1. Open visitor log module.
2. Select visitor.
3. Record exit time.
4. Save changes.

**Sequence Diagram:**

```text
Guard        System       Database
 |             |             |
 |-----Open Visitor Log----->|
 |------Select Visitor------>|
 |             |--Validate-->|
 |             |--Save Exit->|
 |<--Confirmation Message----|
```

## UC-20: Track Staff Attendance

**Actor:** Security Guard

**Flow:**

1. Open staff attendance module.
2. Select staff member.
3. Mark entry/exit.
4. Save changes.

**Sequence Diagram:**

```text
Guard        System        Database
 |            |               |
 |--Open Attendance Module--->|
 |--Select Staff------------->|
 |--Mark Entry/Exit---------->|
 |            |----Save------>|
 |<--Confirmation Message-----|
```

## UC-21: Manage Gate Access

**Actors:** Security Guard

**Flow:**

1. Open Gate Management module.
2. View pending requests.
3. Approve or deny access.
4. Save changes.

**Sequence Diagram:**

```text
Guard        System        Database
 |            |               |
 |---Open Gate Management---->|
 |--View Requests------------>|
 |--Approve/Deny------------->|
 |            |---Save------->|
 |<--Confirmation Message-----|
```

## UC-22: Receive SOS Notification

**Actors:** Security Guard

**Flow:**

1. System sends SOS notification to Security Guard (from UC-14).
2. Security Guard device alerts; Security Guard views resident location.
3. Security Guard confirms arrival.

**Sequence Diagram:**

```text
Guard        System       Database
 |            |               |
 |<-----Receive SOS Alert-----|
 |--Confirm Receipt---------->|
 |--Respond if required------>|
```

## UC-23: Security Patrolling

**Actors:** Security Guard

**Flow:**

1. Security Guard starts patrol on a defined route.
2. Security Guard scans/logs checkpoints.
3. System records the timestamp and route ID.
4. System stores the activity in the database.
5. Confirmation message is displayed.

**Sequence Diagram:**

```text
Guard        System       Database
  |            |             |
  |--Start Patrol----------->|
  |            |             |
  |--Log Checkpoint--------->|
  |            |--Validate-->|
  |            |--Save Log-->|
  |            |             |
  |<--Confirmation Message---|
```
