# Functional and Non-Functional Requirements

## Functional Requirements

### 1. Member and property management

   - Member registration: Allow administrators to add new residents, including personal details, unit numbers, and ownership status (owner or tenant).
   - Member directory: Maintain a searchable database of all residents with contact information, family details, and vehicle information.
   - Ownership and tenancy tracking: Keep a record of flat and plot ownership, along with the history of sales and transfers.
   - Unit management: Manage details of each unit, including its type (apartment, villa, plot), floor, and associated charges.

### 2. Financial management and billing

   - Automated billing: Generate and send recurring maintenance and utility bills automatically to residents via email, SMS, or app notifications.
   - Online payments: Provide a secure payment gateway for residents to pay bills and fees using various methods (e.g., credit/debit card, net banking). No need to implement real-payment method. Use dummy number.
   - Expense tracking: Record and categorize all society expenditures, such as staff salaries, repairs, and administrative costs.
   - Accounting and reports: Maintain proper financial accounts and generate transparent reports, such as balance sheets, income/expense reports, and defaulter lists.

### 3. Communication and collaboration

   - Notice board: Publish important announcements, meeting schedules, and updates for all residents to see in real-time.
   - Complaint and suggestion box: Provide a system for residents to submit, track, and receive updates on maintenance requests and complaints.
   - Emergency alerts (SOS): Implement a feature for residents to trigger an immediate alert to security personnel or designated emergency contacts.
   - Polling: Enable online voting for important society matters or committee elections to boost resident participation.

### 4. Security and visitor management

   - Visitor entry and exit tracking: Log all visitor movements, with options for residents to pre-approve guests for faster entry.
   - Staff and vendor management: Track the attendance and entry of domestic staff (e.g., maids, drivers) and third-party vendors.
   - Gate management: Integrate with gate access control systems to control and monitor building entry and exit.
   - Security patrolling: Ensure security guards cover their patrol routes effectively.

### 5. Amenity and inventory management

   - Facility booking: Allow residents to view availability and book common facilities like clubhouses, swimming pools, and sports courts.
   - Inventory management: Maintain and track society inventory and fixed assets.

## Non-Functional Requirements

### 1. Performance

   - App should load pages within 3–5 seconds.
   - Can support up to ~100 concurrent users comfortably (for FYP/demo purposes).

### 2. Security

   - Role-based login (Admin, Resident, Accountant, Security Guard).
   - Passwords stored securely (hashed).
   - HTTPS for data transmission.

### 3. Reliability

   - 99% uptime.
   - Automatic session timeout should occur after a period of inactivity for security.

### 4. Usability Requirements

   - The user interface should be simple, intuitive, and easy to use for non-technical residents.
   - Mobile and desktop responsive.
   - Navigation be consistent, with clear labels and error messages.

### 5. Maintainability

   - Code organized in modules (React components + backend routes).
   - Clear comments in code for understanding and future modifications.
   - Code documentation.
