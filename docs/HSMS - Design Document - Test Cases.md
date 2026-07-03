# Test Cases

## TC-01: Register Member

**Precondition:** Admin must be logged in.

**Actions:**

1. Admin clicks on "Add Member".
2. System displays registration form.
3. Admin enters resident details.
4. Admin submits the form.
5. System validates the information.
6. System stores the details.
7. Confirmation message is displayed.

**Expected Result:** New member information is stored in the database.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-02: Manage Units

**Precondition:** Admin must be logged in.

**Actions:**

1. Open Unit Management module.
2. Click Add/Edit Unit.
3. Enter unit details.
4. Submit the form.
5. System validates data.
6. Save the unit information.
7. Display confirmation message.

**Expected Result:** Unit details are updated in the database.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-03: View Member Directory

**Precondition:** Admin must be logged in.

**Actions:**

1. Open the member directory.
2. Enter search filters.
3. System queries the database.
4. Display matching results.

**Expected Result:** Results display personal info, family details, and vehicle information.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-04: Generate Bills

**Precondition:** Unit and resident records exist.

**Actions:**

1. Open Billing Module.
2. Load unit and resident details.
3. Calculate charges.
4. Generate bills.
5. Save bills.
6. Send notifications.

**Expected Result:** Bills are generated and notifications are sent successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-05: Expense Tracking

**Precondition:** User must be logged in.

**Actions:**

1. Open Expense Module.
2. Enter expense details.
3. Categorize expense.
4. Save to database.
5. Display confirmation.

**Expected Result:** Expense details are stored successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-06: Generate Financial Reports

**Precondition:** Relevant financial data exists.

**Actions:**

1. Open Reports Module.
2. Select report type.
3. Fetch data.
4. Format and display report.

**Expected Result:** Financial report is generated successfully on the user interface.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-07: View Notice Board

**Precondition:** User must be logged in.

**Actions:**

1. Open Notice Board.
2. Load notice list.
3. Display notices.
4. User reads notices.

**Expected Result:** Notices are displayed successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-08: Manage Inventory

**Precondition:** Admin must be logged in.

**Actions:**

1. Open Inventory Module.
2. Add/Edit/Delete item.
3. Validate input.
4. Save changes.
5. Display confirmation.

**Expected Result:** Inventory records are updated successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-09: Submit Complaint

**Precondition:** Resident must be logged in.

**Actions:**

1. Open Complaint Module.
2. Enter complaint details.
3. Submit complaint.
4. Save complaint.
5. Generate ticket ID.
6. Display confirmation.

**Expected Result:** Complaint is stored and correctly linked to both the Resident and the Unit.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-10: Track Complaint Status

**Precondition:** Complaint must already exist.

**Actions:**

1. Open Track Complaint module.
2. Select complaint by ticket ID.
3. Fetch current status.
4. Display status.

**Expected Result:** Complaint status is displayed successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-11: Pay Bills

**Precondition:** Bill exists and resident is logged in.

**Actions:**

1. Open Pay Bills module.
2. Display bills.
3. Select bill.
4. Open Dummy Payment Page.
5. Enter payment details.
6. Process payment.
7. Display confirmation.

**Expected Result:** Payment is completed successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-12: Dummy Payment Processing

**Precondition:** Resident initiated payment.

**Actions:**

1. Receive payment request.
2. Validate details.
3. Mark payment complete.
4. Notify resident.

**Expected Result:** Payment status is updated as completed.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-13: SOS Alert

**Precondition:** Resident must be logged in.

**Actions:**

1. Resident taps SOS button.
2. System sends alert with resident location.
3. System runs included Notify Security Guard flow (UC-14).
4. Security Guard receives alert and responds; resident receives confirmation as applicable.

**Expected Result:** SOS alert is delivered successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-14: Notify Security Guard

**Precondition:** SOS alert must be triggered.

**Actions:**

1. System receives an SOS event (from UC-13).
2. System sends notifications to active Security Guards.
3. Security Guard acknowledges.

**Expected Result:** Security Guard receives the SOS notification and acknowledges it.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-15: Pre-Approve Guest

**Precondition:** Resident must be logged in.

**Actions:**

1. Open pre-approval module.
2. Enter guest details.
3. Save and confirm.
4. Notify security guard.

**Expected Result:** Guest approval information is saved successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-16: Facility Booking

**Precondition:** Facility exists and resident is logged in.

**Actions:**

1. Open Facility Booking module.
2. Check availability.
3. Select time slot.
4. Confirm booking.
5. Save booking.
6. Display confirmation.

**Expected Result:** Booking confirmed only if no time-slot overlap exists.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-17: Online Voting

**Precondition:** Poll exists and resident is logged in.

**Actions:**

1. Open poll module.
2. View options.
3. Cast vote.
4. Record vote.
5. Display result.

**Expected Result:** Vote is recorded successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-18: Log Visitor Entry

**Precondition:** Visitor arrives at the gate.

**Actions:**

1. Open visitor log module.
2. Enter visitor info.
3. Save entry.
4. Display confirmation.

**Expected Result:** Visitor entry is recorded successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-19: Log Visitor Exit

**Precondition:** Visitor entry must already exist.

**Actions:**

1. Open visitor log module.
2. Select visitor.
3. Record exit time.
4. Save changes.

**Expected Result:** Visitor exit is recorded successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-20: Track Staff Attendance

**Precondition:** Staff member must be registered.

**Actions:**

1. Open staff attendance module.
2. Select staff member.
3. Mark entry/exit.
4. Save changes.

**Expected Result:** Staff attendance is updated successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-21: Manage Gate Access

**Precondition:** Security guard must be logged in.

**Actions:**

1. Open Gate Management module.
2. View requests.
3. Approve/Deny access.
4. Save changes.

**Expected Result:** Gate access permissions are updated successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-22: Receive SOS Notification

**Precondition:** SOS alert must be triggered.

**Actions:**

1. System sends SOS notification to Security Guard (from UC-14).
2. Security Guard confirms receipt on device.
3. Security Guard responds as required (e.g., confirms arrival).

**Expected Result:** Security Guard receives the SOS notification successfully.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass

## TC-23: Security Patrolling

**Precondition:** Security Guard is logged in.

**Actions:**

1. Security Guard selects route.
2. Security Guard logs patrol activity.

**Expected Result:** PatrolLog is created with guardId and timestamp.

**Tested By:** BC220410826, Areeb Yaqub

**Result:** Pass
