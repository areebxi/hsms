# Usage Scenarios

## UC-01: Register Member

**Actors:** Admin

**Description:** Admin registers a new resident into the system.

**Pre-Condition:** Admin must be logged in.

**Post-Condition:** New member information is stored in the database.

**Actions:**

1. Admin clicks on "Add Member".
2. System displays registration form.
3. Admin enters resident details (personal info, family details, vehicle info, unit number, ownership).
4. Admin submits the form.
5. System validates the information.
6. System stores the details in the database.
7. Confirmation message is displayed.
**Exceptions:** Invalid or missing information triggers an error message. Database insertion failure.

**Author:** Areeb Yaqub

## UC-02: Manage Units

**Actors:** Admin

**Description:** Admin adds or updates unit information in the system.

**Pre-Condition:** Admin must be logged in.

**Post-Condition:** Unit details are updated in the database.

**Actions:**

1. Open "Unit Management" module.
2. Click "Add/Edit Unit".
3. Enter unit details (type, floor, charges).
4. Submit the form.
5. System validates data.
6. Save the unit information.
7. Display confirmation message.
**Exceptions:** Invalid or missing data triggers an error. Database failure.

**Author:** Areeb Yaqub

## UC-03: View Member Directory

**Actors:** Admin

**Description:** Search for resident information in the directory.

**Pre-Condition:** Admin must be logged in.

**Post-Condition:** Search results displayed.

**Actions:**

1. Open the member directory.
2. Enter search filters.
3. System queries the database.
4. Display matching results.
**Exceptions:** No results -> display "No Match Found". Database access error.

**Author:** Areeb Yaqub

## UC-04: Generate Bills

**Actors:** Admin/Accountant

**Description:** System generates recurring bills for residents.

**Pre-Condition:** Unit and resident records exist.

**Post-Condition:** Bills are generated and notifications sent.

**Actions:**

1. Open the Billing Module.
2. Load unit and resident details.
3. Calculate Charges (included use case).
4. System generates bills.
5. Save bills to the database.
6. Send notifications (email, SMS, or app).
**Exceptions:** Incorrect billing configuration triggers a warning. Database or calculation error.

**Author:** Areeb Yaqub

## UC-05: Expense Tracking

**Actors:** Admin/Accountant

**Description:** Record and categorize society expenses.

**Pre-Condition:** User logged in.

**Post-Condition:** Expenses recorded and stored.

**Actions:**

1. Open Expense Module.
2. Enter expense details (type, amount, date).
3. Categorize the expense.
4. Save to database.
5. Display confirmation.
**Exceptions:** Missing or invalid details -> error. Database failure.

**Author:** Areeb Yaqub

## UC-06: Generate Financial Reports

**Actors:** Admin/Accountant

**Description:** Generate financial and maintenance reports.

**Pre-Condition:** Relevant data exists.

**Post-Condition:** Reports generated and viewable.

**Actions:**

1. Select report type (Income, Expense, BalanceSheet, or Defaulters).
2. Fetch data and display on screen.
**Exceptions:** Database query failure. Data incomplete -> display warning.

**Author:** Areeb Yaqub

## UC-07: View Notice Board

**Actors:** Admin/Resident

**Description:** View society announcements and updates.

**Pre-Condition:** User logged in.

**Post-Condition:** Notices displayed to user.

**Actions:**

1. Open Notice Board.
2. Load notice list.
3. Display notices sorted by date/priority.
4. User reads notices.
**Exceptions:** Database failure. No notices -> display "No Notices".

**Author:** Areeb Yaqub

## UC-08: Manage Inventory

**Actors:** Admin

**Description:** Add, update, or delete society inventory and fixed assets.

**Pre-Condition:** Admin logged in.

**Post-Condition:** Inventory updated in the database.

**Actions:**

1. Open Inventory Module.
2. Add/Edit/Delete item.
3. Validate input data.
4. Save changes.
5. Display confirmation.
**Exceptions:** Database failure. Invalid input -> error.

**Author:** Areeb Yaqub

## UC-09: Submit Complaint

**Actors:** Resident

**Description:** Resident submits a maintenance or service complaint.

**Pre-Condition:** Resident logged in.

**Post-Condition:** Complaint stored and ticket generated.

**Actions:**

1. Open Complaint Module.
2. Enter complaint details.
3. Submit complaint.
4. System saves to database.
5. Generate ticket ID.
6. Display confirmation.
**Exceptions:** Missing details -> error.

**Author:** Areeb Yaqub

## UC-10: Track Complaint Status

**Actors:** Resident

**Description:** Resident checks status of submitted complaints.

**Pre-Condition:** Complaint submitted.

**Post-Condition:** Status displayed.

**Actions:**

1. Open "Track Complaint" module.
2. Select complaint by ticket ID.
3. System fetches current status (Pending/In Progress/Resolved).
4. Display status to resident.
**Exceptions:** Database failure. Complaint not found -> error.

**Author:** Areeb Yaqub

## UC-11: Pay Bills

**Actors:** Resident

**Description:** Resident pays bills using a dummy payment gateway.

**Pre-Condition:** Bill exists and resident logged in.

**Post-Condition:** Payment marked as completed.

**Actions:**

1. Open "Pay Bills" module.
2. Display outstanding bills.
3. Select bill to pay.
4. Open Dummy Payment Page (include: Dummy Payment Processing).
5. Enter dummy payment details.
6. System processes payment.
7. Display confirmation.
**Exceptions:** Server timeout or failure. Invalid dummy info -> error.

**Author:** Areeb Yaqub

## UC-12: Dummy Payment Processing

**Actors:** Resident

**Description:** Process dummy payment for testing purposes (included in Pay Bills).

**Pre-Condition:** Resident initiated payment.

**Post-Condition:** Payment status updated as completed.

**Actions:**

1. Receive payment request.
2. Validate dummy details.
3. Mark payment as complete.
4. Notify resident.
**Exceptions:** Server failure. Invalid input -> error.

**Author:** Areeb Yaqub

## UC-13: SOS Alert

**Actors:** Resident

**Description:** Resident triggers emergency alert.

**Pre-Condition:** Resident logged in.

**Post-Condition:** Security notified immediately.

**Actions:**

1. Resident taps SOS button.
2. System sends alert with resident location.
3. Includes Notify Security Guard use case.
4. Security Guard receives alert and responds.
**Exceptions:** Resident location unavailable. Network failure.

**Author:** Areeb Yaqub

## UC-14: Notify Security Guard

**Actors:** System, Security Guard

**Description:** System automatically pushes SOS notification to all active guards when a resident triggers an alert.

**Pre-Condition:** SOS triggered.

**Post-Condition:** Alert received and acknowledged.

**Actions:**

1. System receives an SOS event (from UC-13).
2. System sends notifications to active Security Guards.
3. Security Guard acknowledges.
**Exceptions:** Network failure. Alert fails -> system retries.

**Author:** Areeb Yaqub

## UC-15: Pre-Approve Guest

**Actors:** Resident

**Description:** Resident approves guest entry beforehand.

**Pre-Condition:** Resident logged in.

**Post-Condition:** Guest approved in system.

**Actions:**

1. Open pre-approval module.
2. Enter guest details (name, date, purpose).
3. Save and confirm.
4. Notify security guard.
**Exceptions:** Database failure. Missing info -> error.

**Author:** Areeb Yaqub

## UC-16: Facility Booking

**Actors:** Resident

**Description:** Resident books society facilities like clubhouse or pool.

**Pre-Condition:** Facility exists and resident logged in.

**Post-Condition:** Booking saved.

**Actions:**

1. Open "Facility Booking" module.
2. Check facility availability.
3. Select desired time slot.
4. Confirm booking.
5. Save booking in system.
6. Display confirmation.
**Exceptions:** Database failure. Double booking -> error message.

**Author:** Areeb Yaqub

## UC-17: Online Voting

**Actors:** Resident

**Description:** Residents vote for society matters or elections.

**Pre-Condition:** Poll exists and resident logged in.

**Post-Condition:** Vote recorded and results displayed after poll closure.

**Actions:**

1. Open poll module.
2. View poll question and options.
3. Cast vote.
4. System records vote.
5. Display final result after poll ends.
**Exceptions:** Database failure. Already voted -> error message.

**Author:** Areeb Yaqub

## UC-18: Log Visitor Entry

**Actors:** Security Guard

**Description:** Log visitor entry at society gate.

**Pre-Condition:** Visitor arrives.

**Post-Condition:** Visitor entry recorded.

**Actions:**

1. Open visitor log module.
2. Enter visitor info (name, flat, purpose).
3. Save entry.
4. Display confirmation.
**Exceptions:** Database failure. Missing info -> prompt.

**Author:** Areeb Yaqub

## UC-19: Log Visitor Exit

**Actors:** Security Guard

**Description:** Log visitor exit from society.

**Pre-Condition:** Entry exists.

**Post-Condition:** Exit recorded.

**Actions:**

1. Open visitor log module.
2. Select visitor.
3. Record exit time.
4. Save changes.
**Exceptions:** Database failure. Entry missing -> error.

**Author:** Areeb Yaqub

## UC-20: Track Staff Attendance

**Actors:** Security Guard

**Description:** Record entry/exit of staff members.

**Pre-Condition:** Staff registered in system.

**Post-Condition:** Attendance updated.

**Actions:**

1. Open staff attendance module.
2. Select staff member.
3. Mark entry/exit.
4. Save changes.
**Exceptions:** Database failure. Staff not found -> error.

**Author:** Areeb Yaqub

## UC-21: Manage Gate Access

**Actors:** Security Guard

**Description:** Control access to society gates.

**Pre-Condition:** Security guard logged in.

**Post-Condition:** Gate access recorded.

**Actions:**

1. Open Gate Management module.
2. View pending requests.
3. Approve or deny access.
4. Save changes.
**Exceptions:** Database failure. Missing info -> error.

**Author:** Areeb Yaqub

## UC-22: Receive SOS Notification

**Actors:** Security Guard

**Description:** Security Guard receives and acts on SOS alert.

**Pre-Condition:** SOS triggered.

**Post-Condition:** Alert received.

**Actions:**

1. System sends SOS notification to Security Guard (from UC-14).
2. Security Guard device alerts; Security Guard views resident location.
3. Security Guard confirms arrival.
**Exceptions:** Network failure.

**Author:** Areeb Yaqub

## UC-23: Security Patrolling

**Actors:** Security Guard

**Description:** Guard logs progress along defined patrol routes.

**Pre-Condition:** Security guard logged in.

**Post-Condition:** Patrol checkpoints and timestamps are stored for the route.

**Actions:**

1. Guard starts patrol.
2. Guard scans/logs checkpoints.
3. System stores timestamp and route ID.
**Exceptions:** Database failure -> error.

**Author:** Areeb Yaqub
