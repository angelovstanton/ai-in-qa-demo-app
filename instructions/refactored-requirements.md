# City Services Portal — Updated Cursor Tasks (Step?by?step, English)

This document contains **atomic, copy?paste tasks** for Cursor with clear **acceptance criteria**. Send the tasks to Cursor **one at a time**. The flow assumes **Node.js 20+, Express, Prisma (SQLite), React (Vite), MUI**, and **comprehensive form validation with security measures**.

---

## CURSOR TASK 0/18 — Update Details Page and Views

```tex
Update the details page and all views to include the following new fields:
- Date of Request
- Upvotes
- Comments
- Resolved Status
- Correspondence History (if applicable)

Acceptance:
- All views display the new fields with proper formatting.
- Ensure fields are accessible and have proper test IDs.
- Validation rules are applied where necessary.
```

---

## CURSOR TASK 1/18 — Add Date Input to New Request Flow

```text
Add a date input field to the new request creation flow:
- Validation: Date cannot be more than 1 month in the past.
- Frontend validation: Enforce realistic constraints for all fields:
  * Zip code: Minimum 5 symbols.
  * City: Minimum 3 symbols.
  * Follow best practices for all form fields.
- Update requirements documentation to specify exact constraints.

Acceptance:
- Date input field is added with proper validation.
- All form fields enforce realistic constraints.
- Requirements documentation is updated with validation rules.
```

---

## CURSOR TASK 2/18 — Edit Request Within 10 Minutes

```text
Add the ability to edit a created request within 10 minutes of submission:
- After 10 minutes, disable editing and display a tooltip explaining why.

Acceptance:
- Requests can be edited within 10 minutes.
- Tooltip is displayed after the time limit.
- Proper validation and test IDs are implemented.
```

---

## CURSOR TASK 3/18 — Prefill Buttons for Demo Accounts

```text
Add prefill buttons for demo accounts:
- Buttons should populate login fields with demo credentials.
- Ensure accessibility and proper test IDs.

Acceptance:
- Prefill buttons work as expected.
- Accessibility and test IDs are implemented.
```

---

## CURSOR TASK 4/18 — Edit Profile

```text
Add an Edit Profile feature:
- Allow users to update their name, email, and password.
- Implement validation for all fields.
- Include a password strength indicator.

Acceptance:
- Profile updates work with proper validation.
- Password strength indicator is functional.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 5/18 — Upload and Display Images

```text
Add the ability to upload images and display them in a predefined size:
- Store images in a local folder.
- Validate file type (JPG, PNG) and size (max 5MB).
- Display uploaded images in a consistent size.

Acceptance:
- Images are uploaded and displayed correctly.
- Validation rules are enforced.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 6/18 — Upvote and Comment on Requests

```text
Add the ability to upvote and comment on others' requests:
- Upvotes should be unique per user.
- Comments should be validated for length and XSS prevention.

Acceptance:
- Upvotes and comments work as expected.
- Validation rules are enforced.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 7/18 — Ranklist of Most Approved Requests

```text
Add a ranklist of users who published the most approved requests:
- Display rank, user name, and number of approved requests.

Acceptance:
- Ranklist is displayed correctly.
- Data is accurate and updated in real-time.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 8/18 — Resolved Cases Screen

```text
Add a screen to display resolved cases by the municipality:
- Include filters for category, date, and priority.

Acceptance:
- Resolved cases are displayed with proper filters.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 9/18 — Language Switcher

```text
Add a language switcher to the app:
- Support English and Bulgarian.
- Ensure all text is translated properly.

Acceptance:
- Language switcher works as expected.
- All text is translated.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 10/18 — Geolocation and Map Selection

```text
During issue logging, allow users to:
- Use geolocation to select their current location.
- Select a location on a map (JS Map).

Acceptance:
- Geolocation and map selection work as expected.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 11/18 — Map with Related Issues

```text
Display a map with all related issues when opened:
- Show markers for issues with coordinates.

Acceptance:
- Map displays related issues correctly.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 12/18 — Correspondence and Additional Statuses

```text
Add a new status for when the municipality requests more details:
- Display correspondence history and other statuses publicly.

Acceptance:
- New status and correspondence history are displayed correctly.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 13/18 — Dashboard Filters

```text
Add filters to the dashboard:
- Filter by status and other important fields.

Acceptance:
- Filters work as expected.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 14/18 — Mobile Responsiveness

```text
Ensure the app is fully mobile responsive:
- Test all pages and components on mobile devices.

Acceptance:
- App is fully responsive.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 15/18 — Feature Toggles for Bugs

```text
Add feature toggles for all functionalities:
- Simulate bugs and testing scenarios.

Acceptance:
- Feature toggles work as expected.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 16/18 — Spam and Hate Detection

```text
Automatically detect spam, hate, and security issues:
- Add an admin screen to review flagged content.
- Allow admins to delete or assign a special status to flagged content.
- Ensure flagged content is not publicly visible.

Acceptance:
- Detection and admin review work as expected.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 17/18 — Accessibility Best Practices

```text
Implement best practices for accessibility:
- Ensure WCAG 2.1 AA compliance.
- Add ARIA attributes and screen reader support.

Acceptance:
- App meets accessibility standards.
- Test IDs and accessibility are implemented.
```

---

## CURSOR TASK 18/18 — Unit Tests

```text
Add unit tests based on the updated requirements:
- Cover all new features and validation rules.

Acceptance:
- Unit tests are implemented and pass successfully.
- Test coverage meets project standards.
```