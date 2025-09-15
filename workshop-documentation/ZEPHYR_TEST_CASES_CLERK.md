# Zephyr Test Cases - Clerk Mode Functionality

## Test Suite: Clerk Dashboard and Request Processing
**Project**: CSRP (City Service Requests Portal)  
**Test Cycle**: Release 1.0 - Sprint 4  
**Component**: Clerk Portal  
**Priority**: Critical  

---

## Test Case: TC-CSP-CLERK-001 - Clerk Login and Dashboard Access
**Priority**: Critical  
**Type**: Functional  
**Component**: Authentication & Authorization  
**Preconditions**: 
- Clerk account exists (mary.clerk@city.gov / password123)
- Browser: Chrome/Firefox/Edge latest version
- Test environment accessible

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to login page | URL: https://portal.city.gov/login | Login page displays with email and password fields, "Login" button visible |
| 2 | Enter invalid credentials | Email: wrong@city.gov<br>Password: wrongpass | Error message: "Invalid email or password" displayed |
| 3 | Enter valid clerk credentials | Email: mary.clerk@city.gov<br>Password: password123 | Fields accept input, password is masked with dots |
| 4 | Click "Login" button | - | Loading spinner appears for 1-2 seconds |
| 5 | Wait for redirect | - | User redirected to /clerk/dashboard within 3 seconds |
| 6 | Verify clerk menu items | - | Menu shows: "Clerk Inbox", "All Requests", "Reports"<br>Does NOT show: "Admin", "Field Tasks" |
| 7 | Verify dashboard elements | - | Split-view interface visible with:<br>- Request list on left (50% width)<br>- Detail panel on right (50% width)<br>- Filter panel at top<br>- User name "Mary Johnson" in header |
| 8 | Check role indicator | - | Role badge shows "CLERK" next to username |

**Post-conditions**: 
- User logged in with clerk role
- Session active (JWT token stored)
- Dashboard fully loaded

**Test Result**: Pass/Fail  
**Execution Time**: ___  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-002 - Split-View Request Processing Interface
**Priority**: Critical  
**Type**: Functional  
**Component**: Request Management UI  
**Preconditions**: 
- Logged in as clerk (mary.clerk@city.gov)
- At least 10 requests exist in SUBMITTED status
- Test data includes various categories and priorities

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Load clerk inbox | Navigate to /clerk/inbox | Split-view interface loads with request list on left |
| 2 | Verify list columns | - | Columns visible: ID, Title, Category, Priority, Status, Created Date, Citizen |
| 3 | Check default sorting | - | Requests sorted by Created Date (newest first) |
| 4 | Count displayed items | - | Shows 20 requests initially with "Load More" button |
| 5 | Click on request REQ-2024-0001 | - | Request details load in right panel within 500ms |
| 6 | Verify detail panel content | - | Shows:<br>- Full title and description<br>- Citizen contact info<br>- Location details<br>- Attachments (if any)<br>- Status change dropdown<br>- Priority selector<br>- Assignment fields<br>- Internal notes section |
| 7 | Resize split panels | Drag divider left/right | Panels resize smoothly, minimum 30% width maintained |
| 8 | Select different request | Click REQ-2024-0002 | Previous request unselected, new details load |
| 9 | Use keyboard navigation | Press Arrow keys | Can navigate list with keyboard |
| 10 | Check responsive behavior | Resize window < 768px | Panels stack vertically on mobile |

**Test Result**: Pass/Fail  
**Performance Metrics**: List load time: ___ms, Detail load time: ___ms  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-003 - Process New Service Request
**Priority**: High  
**Type**: Functional  
**Component**: Request Processing  
**Preconditions**: 
- Logged in as clerk
- New request REQ-2024-0010 in SUBMITTED status exists
- Departments and agents available for assignment

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Select new request | Click REQ-2024-0010 in list | Request details display, status shows "SUBMITTED" |
| 2 | Review request details | - | All fields populated:<br>- Title: "Pothole on Main Street"<br>- Category: "Roads"<br>- Priority: "MEDIUM"<br>- Description visible |
| 3 | Change status to IN_REVIEW | Select from dropdown | Dropdown shows available statuses, "IN_REVIEW" selectable |
| 4 | Set priority | Change to "HIGH" | Priority dropdown updates, color changes to orange |
| 5 | Select department | Choose "Public Works" | Department dropdown populated with options |
| 6 | Assign to agent | Select "Agent One" | Agent dropdown shows only Public Works agents |
| 7 | Add internal note | Type: "Urgent repair needed, heavy traffic area" | Note field accepts text, character count shows |
| 8 | Click "Save Changes" | - | - Loading indicator appears<br>- Success toast: "Request updated successfully"<br>- Status badge updates to "IN_REVIEW"<br>- History log shows status change |
| 9 | Verify email sent | Check logs | Notification email sent to citizen |
| 10 | Check audit trail | View history tab | Shows: User, timestamp, all changes made |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-004 - Advanced Filtering and Search
**Priority**: High  
**Type**: Functional  
**Component**: Search & Filter  
**Preconditions**: 
- Logged in as clerk
- Database contains 50+ requests in various states
- Mix of categories, priorities, and dates

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Open filter panel | Click "Filters" button | Filter panel expands showing all options |
| 2 | Filter by status | Select: SUBMITTED | List updates showing only SUBMITTED requests, count displayed |
| 3 | Add category filter | Select: Roads, Parks | Combined filters applied (AND logic), list updates |
| 4 | Set priority filter | Select: HIGH, URGENT | List shows only high priority items in selected categories |
| 5 | Apply date range | From: 7 days ago<br>To: Today | Date pickers work, calendar displays, range applied |
| 6 | Enter search term | Type: "pothole" | Search executes after 300ms delay (debounced) |
| 7 | Verify search results | - | - Results highlight "pothole" in yellow<br>- Shows matches in title and description<br>- Result count updates |
| 8 | Test wildcard search | Type: "pot*" | Matches pothole, pottery, potential |
| 9 | Clear individual filter | Click X on "Roads" chip | Roads filter removed, list updates |
| 10 | Clear all filters | Click "Clear All" | All filters removed, full list displayed |

**Expected Results Summary**:
- Filters apply instantly (<500ms)
- Multiple filters work together
- Search is case-insensitive
- Results accurate to filter criteria

**Test Result**: Pass/Fail  
**Performance**: Filter response time: ___ms  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-005 - Bulk Operations on Multiple Requests
**Priority**: Medium  
**Type**: Functional  
**Component**: Bulk Operations  
**Preconditions**: 
- Logged in as clerk
- At least 10 requests in SUBMITTED status
- Bulk operations feature enabled

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Enable selection mode | Click "Select" button or checkbox header | Checkboxes appear next to each request |
| 2 | Select 5 requests | Click checkboxes for REQ-0001 through REQ-0005 | - Requests highlighted<br>- Counter shows "5 selected"<br>- Bulk action toolbar appears |
| 3 | Open bulk assign modal | Click "Bulk Assign" | Modal opens with department and agent dropdowns |
| 4 | Select department | Choose "Public Works" | Department selected, agent dropdown populates |
| 5 | Select agent | Choose "Agent Two" | Agent selected |
| 6 | Add bulk note | Type: "Assigned for routine maintenance schedule" | Note field accepts input |
| 7 | Preview changes | Click "Preview" | Shows summary of changes to be applied |
| 8 | Apply bulk assignment | Click "Apply to Selected" | - Progress bar shows 0-100%<br>- Each request updates sequentially<br>- Success message: "5 requests updated" |
| 9 | Verify updates | Check each request | All 5 show:<br>- Assigned to Agent Two<br>- Note in history<br>- Status changed to ASSIGNED |
| 10 | Test bulk status change | Select 3 requests, change status | Status updates for all selected |

**Test Result**: Pass/Fail  
**Bulk Operation Time**: ___ seconds for 5 requests  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-006 - Add Internal Notes and Comments
**Priority**: Medium  
**Type**: Functional  
**Component**: Communication  
**Preconditions**: 
- Logged in as clerk
- Request REQ-2024-0015 selected
- Request has existing citizen comment

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to comments section | Click "Comments" tab | Comments section displays with existing comments |
| 2 | View citizen comment | - | Shows: "When will this be fixed?" with timestamp and citizen name |
| 3 | Click "Add Reply" | - | Reply text field appears with formatting toolbar |
| 4 | Type response | "Your request has been assigned. Estimated completion: 3 business days" | Text appears, character count shows (500 max) |
| 5 | Mark as public response | Check "Visible to citizen" | Checkbox checked, indicator shows "Public" |
| 6 | Submit comment | Click "Post Comment" | - Comment posted<br>- Timestamp added<br>- Shows "Clerk Response" badge |
| 7 | Add internal note | Click "Internal Note" | Private note field appears |
| 8 | Type internal note | "Contacted utility company for clearance" | Text field accepts input |
| 9 | Submit internal note | Click "Save Note" | - Note saved<br>- Shows lock icon (internal)<br>- Only visible to staff |
| 10 | Verify comment history | - | All comments in chronological order with proper attribution |

**Test Result**: Pass/Fail  
**Comments Load Time**: ___ms  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-007 - Quick Actions and Status Updates
**Priority**: Medium  
**Type**: Functional  
**Component**: Quick Actions  
**Preconditions**: 
- Logged in as clerk
- Various requests in different states available
- Quick actions toolbar enabled

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Select SUBMITTED request | Click REQ-2024-0020 | Request loads with quick action buttons visible |
| 2 | Click "Triage" button | - | - Confirmation dialog: "Mark as TRIAGED?"<br>- Shows impact summary |
| 3 | Confirm triage | Click "Yes" | - Status changes to TRIAGED<br>- Success notification<br>- Audit log updated |
| 4 | Select another request | Click REQ-2024-0021 | New request loads |
| 5 | Click "Reject" button | - | Rejection modal opens with reason field (required) |
| 6 | Enter rejection reason | "Duplicate of REQ-2024-0019" | Text field accepts input |
| 7 | Submit rejection | Click "Reject Request" | - Status changes to REJECTED<br>- Email sent to citizen<br>- Request moves to rejected filter |
| 8 | Test "Escalate" button | Click on MEDIUM priority request | Escalation dialog appears |
| 9 | Select escalation level | Change to URGENT | Priority and visual indicator update |
| 10 | Add escalation note | "Safety hazard identified" | Note added to request history |

**Test Result**: Pass/Fail  
**Quick Action Response**: ___ms average  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-008 - Request Assignment Validation
**Priority**: High  
**Type**: Functional  
**Component**: Assignment Logic  
**Preconditions**: 
- Logged in as clerk
- Multiple departments configured
- Agents with different specializations

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Select Roads category request | Click REQ-2024-0025 | Request details show Category: Roads |
| 2 | Open assignment dropdown | Click "Assign to Department" | Shows relevant departments: Public Works, Infrastructure |
| 3 | Select Public Works | - | Department selected, agent dropdown enabled |
| 4 | View available agents | Click agent dropdown | Shows only Public Works agents with availability status |
| 5 | Check agent workload | Hover over "Agent One (5 active)" | Tooltip shows current assignments |
| 6 | Assign to busy agent | Select agent with 10+ tasks | Warning: "Agent has high workload. Continue?" |
| 7 | Try invalid assignment | Manually edit to wrong dept | Validation error: "Agent not in selected department" |
| 8 | Assign to available agent | Select "Agent Three (2 active)" | Assignment successful |
| 9 | Verify notification sent | Check system logs | Assignment email sent to agent |
| 10 | Check agent's queue | View agent dashboard | New request appears in agent's task list |

**Test Result**: Pass/Fail  
**Assignment Validation**: All rules enforced: Yes/No  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-009 - Attachment and File Handling
**Priority**: Medium  
**Type**: Functional  
**Component**: File Management  
**Preconditions**: 
- Logged in as clerk
- Request with attachments available
- Test files prepared (images, PDFs)

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Select request with attachments | Click REQ-2024-0030 | Attachments section shows "3 files attached" |
| 2 | View attachment thumbnails | - | Thumbnails display for images, icon for PDFs |
| 3 | Click image thumbnail | Click "damage-photo.jpg" | - Image opens in modal/lightbox<br>- Zoom controls available<br>- Download button visible |
| 4 | Download PDF attachment | Click download on "report.pdf" | File downloads successfully |
| 5 | Add new attachment | Click "Add File" | File upload dialog opens |
| 6 | Upload large file | Select 9MB PDF | - Upload progress bar shows<br>- File uploads successfully |
| 7 | Try oversized file | Select 11MB file | Error: "File size exceeds 10MB limit" |
| 8 | Upload invalid type | Select .exe file | Error: "File type not supported" |
| 9 | Add file description | Type: "Additional damage photos" | Description saved with file |
| 10 | Delete attachment | Click delete icon | Confirmation dialog, file removed after confirm |

**Test Result**: Pass/Fail  
**Upload Performance**: ___MB/second  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-CLERK-010 - Performance Under Load
**Priority**: High  
**Type**: Performance  
**Component**: System Performance  
**Preconditions**: 
- Logged in as clerk
- Database contains 1000+ requests
- Multiple filters available

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Load inbox with no filters | Navigate to /clerk/inbox | Initial 20 requests load in <2 seconds |
| 2 | Scroll to load more | Click "Load More" 5 times | Each batch (20 requests) loads in <1 second |
| 3 | Apply complex filter | Status: SUBMITTED, IN_REVIEW<br>Category: Roads, Parks<br>Priority: HIGH, URGENT<br>Date: Last 30 days | Filter applies in <500ms |
| 4 | Search with filters active | Type: "emergency" | Search completes in <500ms with filters maintained |
| 5 | Open/close 10 requests rapidly | Click different requests quickly | Each detail load <500ms, no UI freezing |
| 6 | Perform bulk operation | Select 20 requests, bulk assign | Operation completes in <5 seconds |
| 7 | Export filtered results | Click "Export CSV" | Export generates in <3 seconds for 100 records |
| 8 | Test with slow network | Throttle to 3G speed | Graceful degradation, loading indicators shown |
| 9 | Multiple tab test | Open 3 clerk tabs | All tabs remain responsive |
| 10 | Monitor memory usage | Check browser dev tools | No memory leaks after 30 min use |

**Performance Metrics**:
- Initial Load: ___ms
- Filter Application: ___ms
- Search Response: ___ms
- Bulk Operation (20 items): ___s
- Memory Usage Start: ___MB
- Memory Usage After 30min: ___MB

**Test Result**: Pass/Fail  
**Performance Issues**: [Document any slowness]  

---

## Test Case: TC-CSP-CLERK-011 - Error Handling and Recovery
**Priority**: High  
**Type**: Negative Testing  
**Component**: Error Handling  
**Preconditions**: 
- Logged in as clerk
- Network throttling available
- Can simulate errors

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Trigger network timeout | Disable network mid-request | Error message: "Network connection lost. Retrying..." |
| 2 | Wait for auto-retry | Wait 5 seconds | System attempts reconnection 3 times |
| 3 | Submit with network off | Try to save changes | Changes queued locally, "Will sync when online" message |
| 4 | Restore network | Enable network | Queued changes sync automatically |
| 5 | Session timeout test | Wait 31 minutes idle | Warning at 25 min, redirect to login at 30 min |
| 6 | Invalid data submission | Inject SQL in search: '; DROP TABLE; | Input sanitized, no SQL execution |
| 7 | Concurrent edit conflict | Edit same request in 2 tabs | Conflict detected: "Request updated by another user" |
| 8 | API 500 error | Trigger server error | User-friendly error: "Temporary issue. Please try again" |
| 9 | Rate limit exceeded | Submit 100 requests/second | Rate limit message with retry time |
| 10 | Browser back button | Use back after changes | Confirmation: "Unsaved changes will be lost" |

**Test Result**: Pass/Fail  
**Error Recovery**: Successful/Failed  
**Security Issues**: None/Found: ___  

---

## Test Case: TC-CSP-CLERK-012 - Accessibility Compliance
**Priority**: High  
**Type**: Accessibility  
**Component**: UI/UX Accessibility  
**Preconditions**: 
- Screen reader software installed (NVDA/JAWS)
- Keyboard navigation enabled
- High contrast mode available

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate with Tab key | Press Tab repeatedly | All interactive elements reachable in logical order |
| 2 | Check focus indicators | - | Visible focus outline on all focused elements |
| 3 | Use screen reader | Enable NVDA/JAWS | All elements have descriptive labels announced |
| 4 | Test form labels | Navigate to filters | Each input has associated label announced |
| 5 | Check color contrast | Use contrast analyzer | Text contrast ratio ≥ 4.5:1 for normal text |
| 6 | Test without mouse | Complete full workflow | All functions accessible via keyboard |
| 7 | Check ARIA attributes | Inspect elements | Proper ARIA roles, states, and properties |
| 8 | Test error announcements | Trigger validation error | Errors announced to screen reader immediately |
| 9 | Check skip links | Press Tab on page load | "Skip to main content" link available |
| 10 | Test high contrast mode | Enable high contrast | UI remains usable, all text visible |

**Accessibility Compliance**:
- WCAG 2.1 Level AA: Pass/Fail
- Keyboard Navigation: Complete/Incomplete
- Screen Reader Compatible: Yes/No
- Issues Found: [List accessibility issues]

**Test Result**: Pass/Fail  

---

## Test Execution Summary

### Test Suite Metrics
- **Total Test Cases**: 12
- **Critical**: 3
- **High**: 5
- **Medium**: 4
- **Executed**: [To be filled]
- **Passed**: [To be filled]
- **Failed**: [To be filled]
- **Blocked**: [To be filled]

### Coverage Areas
✅ Authentication and authorization  
✅ Split-view interface functionality  
✅ Request processing workflow  
✅ Filtering and search capabilities  
✅ Bulk operations  
✅ Comments and notes management  
✅ Quick actions  
✅ Assignment logic  
✅ File handling  
✅ Performance under load  
✅ Error handling and recovery  
✅ Accessibility compliance  

### Risk Assessment
**High Risk Areas**:
- Bulk operations with large datasets
- Concurrent user updates
- File upload under load
- Session management

**Medium Risk Areas**:
- Complex filter combinations
- Assignment rule validation
- Email notification delivery

**Low Risk Areas**:
- Basic navigation
- Read-only operations
- Static content display

### Recommendations
1. Automate regression test suite for critical paths
2. Implement performance monitoring for production
3. Regular accessibility audits
4. Load testing with 50+ concurrent clerks
5. Security testing for input validation

---
*Test Suite Version: 1.0*
*Last Updated: 2025*
*For Workshop Training Use - Clerk Portal Testing*