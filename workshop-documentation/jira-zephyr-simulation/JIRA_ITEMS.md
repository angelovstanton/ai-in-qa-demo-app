# Jira Items - City Services Portal

## Epic: Municipal Service Request Platform
**Epic ID**: CSP-EPIC-001  
**Summary**: Develop comprehensive digital platform for municipal service request management  
**Status**: In Progress  
**Fix Version**: Release 1.0  

---

## User Stories

### Story: CSP-101 - Citizen Service request submission
**Type**: Story  
**Priority**: Critical  
**Story Points**: 8  
**Sprint**: Sprint 3  
**Status**: Done  
**Reporter**: Product Owner  
**Assignee**: Development Team  

**Description:**
As a citizen  
I want to submit service requests online  
So that I can report issues without visiting city offices  

**Acceptance Criteria:**
- [ ] Multi-step form with progress indicator
- [ ] Support for 5 categories (Roads, Parks, Utilities, Waste, Public Safety)
- [ ] Location selection with map integration
- [ ] File attachment support (max 5 files, 10MB each)
- [ ] Email confirmation upon submission
- [ ] Request tracking number generated

**Definition of Done:**
- Unit tests written (>80% coverage)
- Integration tests passing
- Code reviewed and approved
- Documentation updated
- Deployed to staging
- Accessibility validated (WCAG 2.1 AA)

---

### Story: CSP-102 - Clerk request processing dashboard
**Type**: Story  
**Priority**: High  
**Story Points**: 13  
**Sprint**: Sprint 4  
**Status**: In Progress  
**Reporter**: Product Owner  
**Assignee**: Frontend Team  

**Description:**
As a city clerk  
I want a split-view dashboard to process requests  
So that I can efficiently review and assign multiple requests  

**Acceptance Criteria:**
- [ ] Split-view interface with list and detail panels
- [ ] Quick action buttons for status updates
- [ ] Bulk selection and operations
- [ ] Advanced filtering (status, category, date, priority)
- [ ] Assignment to departments/agents
- [ ] Internal notes capability
- [ ] Keyboard shortcuts for common actions

**Sub-tasks:**
- CSP-102a: Design split-view layout
- CSP-102b: Implement filtering system
- CSP-102c: Add bulk operations
- CSP-102d: Create keyboard shortcuts

---

### Story: CSP-103 - Field agent mobile interface
**Type**: Story  
**Priority**: High  
**Story Points**: 8  
**Sprint**: Sprint 5  
**Status**: To Do  
**Reporter**: Product Owner  
**Assignee**: Mobile Team  

**Description:**
As a field agent  
I want to update service requests from my mobile device  
So that I can provide real-time status updates from the field  

**Acceptance Criteria:**
- [ ] Responsive design for mobile devices
- [ ] Offline capability with sync
- [ ] Photo capture from device camera
- [ ] GPS location for updates
- [ ] Digital signature for completion
- [ ] Voice notes support

---

### Story: CSP-104 - Supervisor performance dashboard
**Type**: Story  
**Priority**: Medium  
**Story Points**: 5  
**Sprint**: Sprint 6  
**Status**: To Do  
**Reporter**: Supervisor Lead  
**Assignee**: Analytics Team  

**Description:**
As a supervisor  
I want to view team performance metrics  
So that I can monitor service quality and efficiency  

**Acceptance Criteria:**
- [ ] Real-time KPI dashboard
- [ ] Agent performance metrics
- [ ] Department comparison charts
- [ ] SLA compliance tracking
- [ ] Export reports to PDF/Excel
- [ ] Custom date range selection

---

### Story: CSP-105 - Advanced search functionality
**Type**: Story  
**Priority**: Medium  
**Story Points**: 5  
**Sprint**: Sprint 4  
**Status**: In Review  
**Reporter**: Product Owner  
**Assignee**: Backend Team  

**Description:**
As a staff member  
I want to search requests using multiple criteria  
So that I can quickly find specific requests or patterns  

**Acceptance Criteria:**
- [ ] Full-text search across title and description
- [ ] Multi-select filters for status, category, priority
- [ ] Date range picker
- [ ] Location-based search
- [ ] Save search preferences
- [ ] Search history
- [ ] Export search results

---

## Tasks

### Task: CSP-201 - Setup CI/CD pipeline
**Type**: Task  
**Priority**: High  
**Status**: Done  
**Sprint**: Sprint 1  
**Assignee**: DevOps Engineer  

**Description:**
Configure GitHub Actions for automated testing and deployment

**Checklist:**
- [x] Setup test runner
- [x] Configure build process
- [x] Setup staging deployment
- [x] Add code quality checks
- [x] Configure security scanning

---

### Task: CSP-202 - Database schema design
**Type**: Task  
**Priority**: Critical  
**Status**: Done  
**Sprint**: Sprint 1  
**Assignee**: Backend Lead  

**Description:**
Design and implement Prisma schema for service request system

**Checklist:**
- [x] User and role tables
- [x] Request management tables
- [x] File attachment support
- [x] Audit log structure
- [x] Feature flags table

---

### Task: CSP-203 - Implement JWT authentication
**Type**: Task  
**Priority**: Critical  
**Status**: Done  
**Sprint**: Sprint 2  
**Assignee**: Security Engineer  

**Description:**
Implement secure JWT-based authentication system

**Checklist:**
- [x] Token generation
- [x] Refresh token logic
- [x] Role-based authorization
- [x] Session management
- [x] Password reset flow

---

### Task: CSP-204 - Email notification service
**Type**: Task  
**Priority**: Medium  
**Status**: In Progress  
**Sprint**: Sprint 4  
**Assignee**: Backend Developer  

**Description:**
Setup email notification system for request lifecycle events

**Checklist:**
- [ ] SMTP configuration
- [ ] Email templates
- [ ] Queue system
- [ ] Retry logic
- [ ] Unsubscribe handling

---

## Bugs

### Bug: CSP-BUG-001 - File upload fails for PDF files over 5MB
**Type**: Bug  
**Priority**: High  
**Severity**: Major  
**Status**: Resolved  
**Sprint**: Sprint 3  
**Reporter**: QA Team  
**Assignee**: Backend Developer  
**Environment**: Production  
**Affects Version**: 0.9.0  
**Fix Version**: 0.9.1  

**Description:**
PDF files larger than 5MB fail to upload with timeout error, despite 10MB limit

**Steps to Reproduce:**
1. Login as citizen user
2. Create new service request
3. Attempt to upload PDF file larger than 5MB
4. Observe timeout error after 30 seconds

**Expected Result:**
File should upload successfully up to 10MB limit

**Actual Result:**
Upload times out and fails for PDFs over 5MB

**Root Cause:**
Multer configuration had incorrect MIME type handling for PDFs

**Resolution:**
Updated multer config to properly handle PDF MIME types and increased timeout

**Verification Steps:**
1. Upload 8MB PDF file
2. Verify successful upload
3. Download and verify file integrity

---

### Bug: CSP-BUG-002 - Duplicate request detection not working
**Type**: Bug  
**Priority**: Medium  
**Severity**: Minor  
**Status**: Resolved  
**Sprint**: Sprint 3  
**Reporter**: Customer Support  
**Assignee**: Backend Developer  
**Environment**: Staging  
**Affects Version**: 0.8.0  
**Fix Version**: 0.9.0  

**Description:**
System allows submission of identical requests within 5-minute window

**Steps to Reproduce:**
1. Submit a service request
2. Immediately submit identical request
3. Both requests are accepted

**Expected Result:**
System should detect and prevent duplicate submission

**Actual Result:**
Duplicate requests are created

**Root Cause:**
Hash comparison was case-sensitive and ignored whitespace

**Resolution:**
Normalized text before hashing for comparison

---

### Bug: CSP-BUG-003 - Incorrect sorting in request list
**Type**: Bug  
**Priority**: Low  
**Severity**: Minor  
**Status**: Resolved  
**Sprint**: Sprint 4  
**Reporter**: QA Team  
**Assignee**: Frontend Developer  
**Environment**: QA  
**Affects Version**: 0.9.0  
**Fix Version**: 0.9.2  
**Related Flag**: UI_WrongDefaultSort  

**Description:**
Request list shows oldest items first instead of newest when feature flag enabled

**Steps to Reproduce:**
1. Enable UI_WrongDefaultSort flag
2. Navigate to request list
3. Observe default sort order

**Expected Result:**
Newest requests should appear first

**Actual Result:**
Oldest requests appear first

**Resolution:**
Fixed sort direction logic in DataGrid component

---

### Bug: CSP-BUG-004 - Session expires without warning
**Type**: Bug  
**Priority**: High  
**Severity**: Major  
**Status**: Resolved  
**Sprint**: Sprint 2  
**Reporter**: User Feedback  
**Assignee**: Frontend Developer  
**Environment**: Production  
**Affects Version**: 0.7.0  
**Fix Version**: 0.8.0  

**Description:**
User sessions expire after 30 minutes without warning, losing unsaved work

**Steps to Reproduce:**
1. Login and start creating request
2. Leave idle for 30 minutes
3. Attempt to submit
4. Session expired, data lost

**Expected Result:**
Warning before expiry and option to extend session

**Actual Result:**
Silent expiry with data loss

**Resolution:**
Added session warning modal at 5 minutes before expiry with refresh option

---

### Bug: CSP-BUG-005 - Special characters break search
**Type**: Bug  
**Priority**: Medium  
**Severity**: Major  
**Status**: Resolved  
**Sprint**: Sprint 4  
**Reporter**: QA Team  
**Assignee**: Backend Developer  
**Environment**: Staging  
**Affects Version**: 0.9.0  
**Fix Version**: 0.9.2  

**Description:**
Search queries with special characters cause 500 error

**Steps to Reproduce:**
1. Enter search query with quotes or backslash
2. Submit search
3. Observe 500 error

**Expected Result:**
Special characters should be properly escaped

**Actual Result:**
Server error due to SQL injection attempt

**Root Cause:**
Missing input sanitization in search endpoint

**Resolution:**
Added proper escaping and parameterized queries

---

### Bug: CSP-BUG-006 - Email notifications sent to wrong users
**Type**: Bug  
**Priority**: Critical  
**Severity**: Blocker  
**Status**: Resolved  
**Sprint**: Sprint 3  
**Reporter**: Security Audit  
**Assignee**: Backend Lead  
**Environment**: Production  
**Affects Version**: 0.8.5  
**Fix Version**: 0.8.6  

**Description:**
Status update emails occasionally sent to wrong citizen

**Steps to Reproduce:**
Intermittent issue during high load

**Expected Result:**
Emails only to request creator

**Actual Result:**
Emails sometimes to different users

**Root Cause:**
Race condition in async email queue processing

**Resolution:**
Fixed queue isolation and added recipient validation

---

### Bug: CSP-BUG-007 - Map widget not loading on Safari
**Type**: Bug  
**Priority**: Medium  
**Severity**: Minor  
**Status**: In Progress  
**Sprint**: Sprint 5  
**Reporter**: User Feedback  
**Assignee**: Frontend Developer  
**Environment**: Production  
**Affects Version**: 0.9.0  
**Browser**: Safari 15+  

**Description:**
Location selection map fails to load on Safari browsers

**Steps to Reproduce:**
1. Open app in Safari
2. Start creating new request
3. Reach location step
4. Map widget shows blank

**Expected Result:**
Map should load and allow location selection

**Actual Result:**
Blank map container

**Workaround:**
Users can manually enter address without map

---

### Bug: CSP-BUG-008 - Performance degradation with 1000+ requests
**Type**: Bug  
**Priority**: High  
**Severity**: Major  
**Status**: Open  
**Sprint**: Sprint 5  
**Reporter**: Performance Testing  
**Assignee**: Backend Team  
**Environment**: Load Testing  
**Affects Version**: 0.9.2  
**Related Flag**: PERF_SimulateHighLoad  

**Description:**
API response time increases significantly when database has 1000+ requests

**Steps to Reproduce:**
1. Seed database with 1000+ requests
2. Perform search operation
3. Measure response time

**Expected Result:**
Response time under 500ms

**Actual Result:**
Response time 3-5 seconds

**Investigation Notes:**
- Missing database indexes identified
- N+1 query problem in request list endpoint

---

### Bug: CSP-BUG-009 - Dark mode breaks print layout
**Type**: Bug  
**Priority**: Low  
**Severity**: Trivial  
**Status**: Open  
**Sprint**: Backlog  
**Reporter**: QA Team  
**Assignee**: Unassigned  
**Environment**: All  
**Affects Version**: 0.9.0  
**Related Flag**: FEATURE_DarkMode  

**Description:**
Printing pages in dark mode results in black background

**Steps to Reproduce:**
1. Enable dark mode
2. Try to print any page
3. Print preview shows black background

**Expected Result:**
Print layout should use light theme

**Actual Result:**
Dark theme applied to print

---

### Bug: CSP-BUG-010 - Rate limiting not working for file uploads
**Type**: Bug  
**Priority**: Medium  
**Severity**: Minor  
**Status**: Open  
**Sprint**: Sprint 5  
**Reporter**: Security Testing  
**Assignee**: Backend Developer  
**Environment**: Staging  
**Affects Version**: 0.9.2  
**Related Flag**: API_UploadIntermittentFail  

**Description:**
Rate limiting bypassed for file upload endpoint

**Steps to Reproduce:**
1. Upload 20 files rapidly
2. All uploads processed
3. No rate limit error

**Expected Result:**
Should limit to 10 uploads per 5 minutes

**Actual Result:**
No rate limiting applied

---

## Sub-tasks

### Sub-task: CSP-102a - Design split-view layout
**Parent**: CSP-102  
**Type**: Sub-task  
**Status**: Done  
**Assignee**: UI Designer  

**Description:**
Create mockups for split-view clerk dashboard

---

### Sub-task: CSP-102b - Implement filtering system
**Parent**: CSP-102  
**Type**: Sub-task  
**Status**: In Progress  
**Assignee**: Frontend Developer  

**Description:**
Build advanced filtering component with multi-select

---

### Sub-task: CSP-102c - Add bulk operations
**Parent**: CSP-102  
**Type**: Sub-task  
**Status**: To Do  
**Assignee**: Frontend Developer  

**Description:**
Implement bulk selection and status updates

---

### Sub-task: CSP-102d - Create keyboard shortcuts
**Parent**: CSP-102  
**Type**: Sub-task  
**Status**: To Do  
**Assignee**: Frontend Developer  

**Description:**
Add keyboard navigation and shortcuts for power users

---

## Test Execution Cycles

### Test Cycle: Release 0.9.0 - Regression Testing
**Status**: Completed  
**Test Cases**: 45  
**Passed**: 42  
**Failed**: 3  
**Blocked**: 0  

**Failed Tests:**
- File upload for large PDFs (CSP-BUG-001)
- Duplicate detection (CSP-BUG-002)
- Email notifications (CSP-BUG-006)

---

### Test Cycle: Release 0.9.2 - Smoke Testing
**Status**: In Progress  
**Test Cases**: 15  
**Passed**: 14  
**Failed**: 1  
**Blocked**: 0  

**Current Issues:**
- Performance test failing (CSP-BUG-008)

---

## Labels Used
- `bug` - Defect in functionality
- `enhancement` - Feature improvement
- `documentation` - Documentation updates
- `duplicate` - Duplicate issue
- `help wanted` - Extra attention needed
- `invalid` - Not a valid issue
- `question` - Further information requested
- `wontfix` - Will not be worked on
- `critical` - Critical priority
- `regression` - Regression from previous version
- `security` - Security related
- `performance` - Performance issue
- `accessibility` - Accessibility concern
- `mobile` - Mobile specific
- `browser-specific` - Browser compatibility

---
*Document Version: 1.0*
*Last Updated: 2025*
*For Workshop Training Use*