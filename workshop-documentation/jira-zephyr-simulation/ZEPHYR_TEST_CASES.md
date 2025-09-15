# Zephyr Test Cases - City Services Portal

## Test Suite: Clerk Dashboard Functionality
**Test Cycle**: Release 1.0 - Sprint 4  
**Environment**: QA  
**Browser**: Chrome, Firefox, Edge  

---

## Test Case: TC-CSP-001 - Clerk login and dashboard access
**Priority**: Critical  
**Type**: Functional  
**Component**: Authentication  
**Preconditions**: 
- Clerk account exists (mary.clerk@city.gov)
- User is on login page

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to login page | URL: http://localhost:5173/login | Login page displays with email and password fields |
| 2 | Enter clerk credentials | Email: mary.clerk@city.gov<br>Password: password123 | Fields accept input, password is masked |
| 3 | Click "Login" button | - | Loading indicator appears |
| 4 | Wait for redirect | - | User redirected to clerk dashboard within 3 seconds |
| 5 | Verify dashboard elements | - | Split-view interface visible with:<br>- Request list on left<br>- Detail panel on right<br>- Filter options<br>- User name in header |

**Post-conditions**: User logged in with clerk role, session active

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-002 - Process service request in split-view
**Priority**: High  
**Type**: Functional  
**Component**: Request Processing  
**Preconditions**: 
- Logged in as clerk
- At least 5 requests in SUBMITTED status exist

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | View request list | - | List shows all submitted requests with columns:<br>- Request ID<br>- Title<br>- Category<br>- Priority<br>- Status<br>- Date |
| 2 | Click on first request | Request: REQ-2024-0001 | Request details load in right panel:<br>- Full description<br>- Attachments<br>- Reporter info<br>- Location map |
| 3 | Change status dropdown | Select: IN_REVIEW | Dropdown updates, save button enables |
| 4 | Select priority | Select: HIGH | Priority badge updates color |
| 5 | Add internal note | Text: "Reviewing urgency" | Note field accepts text |
| 6 | Click "Save Changes" | - | - Success toast appears<br>- Request moves to IN_REVIEW section<br>- History log updated |
| 7 | Assign to department | Select: Public Works | Assignment dropdown shows departments |
| 8 | Assign to agent | Select: Agent One | Agent dropdown filtered by department |
| 9 | Click "Save & Next" | - | - Current request saved<br>- Next request auto-loads<br>- Previous request marked as processed |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-003 - Bulk operations on multiple requests
**Priority**: Medium  
**Type**: Functional  
**Component**: Bulk Operations  
**Preconditions**: 
- Logged in as clerk
- At least 10 requests in various statuses
- FEATURE_BulkOperations flag enabled

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Enable selection mode | Click checkbox header | - All checkboxes appear<br>- Bulk action toolbar appears |
| 2 | Select 5 requests | Click individual checkboxes | - Counter shows "5 selected"<br>- Bulk actions enabled |
| 3 | Click "Bulk Assign" | - | Assignment modal opens |
| 4 | Select department | Public Works | Department selected |
| 5 | Select agent | Agent Two | Agent selected |
| 6 | Add bulk note | "Assigned for routine maintenance" | Note field accepts input |
| 7 | Click "Apply to Selected" | - | - Progress bar appears<br>- Each request updates<br>- Success: "5 requests updated" |
| 8 | Verify updates | Check each request | All 5 requests show:<br>- Assigned to Agent Two<br>- Note added to history |
| 9 | Test bulk status change | Select 3 requests | Select and change status to IN_PROGRESS |
| 10 | Confirm action | Click "Yes" in modal | All 3 requests update status |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-004 - Advanced filtering and search
**Priority**: High  
**Type**: Functional  
**Component**: Search & Filter  
**Preconditions**: 
- Logged in as clerk
- Database contains 50+ requests

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Open filter panel | Click "Filters" button | Filter panel expands with options |
| 2 | Select category filter | Select: Roads, Parks | Filter chips appear, list updates |
| 3 | Add status filter | Select: SUBMITTED, IN_REVIEW | Combined filters applied |
| 4 | Set date range | From: 7 days ago<br>To: Today | Date picker works, results filtered |
| 5 | Enter search term | Search: "pothole" | - Real-time search after 300ms<br>- Results highlight matches |
| 6 | Verify result count | - | Result count updates: "Showing X of Y" |
| 7 | Save filter preset | Name: "My Daily Review" | - Save dialog appears<br>- Preset saved to profile |
| 8 | Clear all filters | Click "Clear All" | All filters removed, full list shown |
| 9 | Load saved preset | Select: "My Daily Review" | Filters restored from saved preset |
| 10 | Export filtered results | Click "Export CSV" | CSV downloads with filtered data |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-005 - Field agent task management
**Priority**: High  
**Type**: Functional  
**Component**: Field Operations  
**Preconditions**: 
- Logged in as field agent (agent1@city.gov)
- Has assigned tasks

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Login as field agent | agent1@city.gov | Dashboard shows "My Tasks" view |
| 2 | View task list | - | Only assigned tasks visible with:<br>- Priority indicators<br>- Location info<br>- Due dates |
| 3 | Open task details | Click first task | Full details with:<br>- Description<br>- Photos<br>- Navigation link<br>- Contact info |
| 4 | Start task | Click "Start Work" | - Status changes to IN_PROGRESS<br>- Timer starts<br>- GPS location logged |
| 5 | Add field note | "Arrived on site, assessing damage" | Note saved with timestamp |
| 6 | Take photo | Use camera button | - Camera opens (desktop) or file selector<br>- Photo uploads<br>- Thumbnail appears |
| 7 | Add multiple photos | Upload 3 photos | All photos upload with progress bars |
| 8 | Mark complete | Click "Complete Task" | Completion form appears |
| 9 | Add resolution | "Pothole filled with asphalt" | Text field accepts resolution notes |
| 10 | Submit completion | Click "Submit" | - Status: COMPLETED<br>- Notification sent<br>- Task removed from active list |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-006 - Supervisor quality review process
**Priority**: Medium  
**Type**: Functional  
**Component**: Quality Management  
**Preconditions**: 
- Logged in as supervisor (supervisor1@city.gov)
- Completed requests exist for review

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to quality review | Menu: Quality Review | Review queue displays |
| 2 | Filter by date | Last 7 days | Completed requests from past week shown |
| 3 | Select request for review | REQ-2024-0003 | Request details with completion info loads |
| 4 | Review completion photos | Click photo thumbnails | Photos open in lightbox with zoom |
| 5 | Check resolution notes | - | Agent's resolution notes visible |
| 6 | Rate quality | Select: 4 stars | Star rating updates |
| 7 | Add review comment | "Good work, proper procedure followed" | Comment field accepts text |
| 8 | Mark as reviewed | Click "Approve & Close" | - Request status: CLOSED<br>- Review logged<br>- Agent notified |
| 9 | Reject completion | Select different request | Click "Needs Rework" |
| 10 | Add rejection reason | "Incomplete repair, needs additional work" | - Status reverts to IN_PROGRESS<br>- Agent notified with reason<br>- Request reassigned |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-007 - Admin feature flag management
**Priority**: Low  
**Type**: Functional  
**Component**: System Administration  
**Preconditions**: 
- Logged in as admin (admin@city.gov)
- System has feature flags configured

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to admin panel | URL: /admin/flags | Feature flags page loads |
| 2 | View flag list | - | All flags displayed with:<br>- Name<br>- Description<br>- Current state<br>- Type |
| 3 | Enable bug simulation | Toggle: API_Random500 | - Toggle switches to ON<br>- "Saving..." indicator<br>- Success message |
| 4 | Test flag effect | Navigate to request list | ~5% of API calls return 500 error |
| 5 | View flag details | Click flag info icon | Modal with:<br>- Full description<br>- Impact warning<br>- Usage statistics |
| 6 | Enable multiple flags | Enable 3 bug flags | All flags save independently |
| 7 | Search flags | Search: "API" | Only API-related flags shown |
| 8 | Reset to defaults | Click "Reset All" | Confirmation modal, then all flags reset |
| 9 | Check audit log | Navigate to Audit Log | Flag changes logged with:<br>- User<br>- Timestamp<br>- Old/new values |
| 10 | Disable all test flags | Toggle all OFF | System returns to normal operation |

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-008 - Performance under load with flags
**Priority**: Medium  
**Type**: Performance  
**Component**: System Performance  
**Preconditions**: 
- System populated with 1000+ requests
- Performance monitoring active

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Baseline measurement | No flags enabled | - Page load < 3s<br>- API responses < 500ms |
| 2 | Enable slow requests | Toggle: API_SlowRequests | 10% of requests have 3-5s delay |
| 3 | Measure impact | Refresh page 10 times | Average load time documented |
| 4 | Enable high load simulation | Toggle: PERF_SimulateHighLoad | CPU usage increases |
| 5 | Test concurrent operations | Open 5 browser tabs | System remains responsive |
| 6 | Perform search | Search with complex query | Results return within 5 seconds |
| 7 | Upload large file | Upload 9MB PDF | Upload completes despite load |
| 8 | Check error rate | Review network tab | Error rate stays below 5% |
| 9 | Test graceful degradation | Enable all performance flags | Non-critical features disabled, core functions work |
| 10 | Monitor recovery | Disable all flags | System returns to baseline performance |

**Test Result**: Pass/Fail  
**Performance Metrics**:  
- Baseline response time: ___ms
- Under load response time: ___ms
- Error rate: ___%
- CPU usage: ___%
- Memory usage: ___MB

---

## Test Case: TC-CSP-009 - Email notification delivery
**Priority**: High  
**Type**: Integration  
**Component**: Notifications  
**Preconditions**: 
- Email service configured
- TEST_MockEmails flag OFF (for real testing)

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Submit new request | As citizen user | Confirmation email sent within 1 minute |
| 2 | Verify email content | Check inbox | Email contains:<br>- Request ID<br>- Summary<br>- Tracking link |
| 3 | Update request status | Change to IN_PROGRESS | Status change email sent to citizen |
| 4 | Add public comment | "We've scheduled your service" | Comment notification sent |
| 5 | Complete request | Mark as COMPLETED | Completion email with survey link |
| 6 | Test email formatting | View in different clients | Responsive design, images load |
| 7 | Click tracking link | From email | Direct navigation to request |
| 8 | Test unsubscribe | Click unsubscribe link | - Preferences page opens<br>- Can opt out of non-critical emails |
| 9 | Verify email logs | Check admin panel | All emails logged with status |
| 10 | Test bounce handling | Send to invalid address | Bounce logged, no retry after 3 attempts |

**Test Result**: Pass/Fail  
**Emails Verified**: 
- [ ] Submission confirmation
- [ ] Status updates
- [ ] Comments
- [ ] Completion
- [ ] Assignment (staff)

---

## Test Case: TC-CSP-010 - Accessibility compliance testing
**Priority**: High  
**Type**: Accessibility  
**Component**: UI/UX  
**Preconditions**: 
- Screen reader software available
- Keyboard navigation enabled

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Tab navigation | Use Tab key only | All interactive elements reachable |
| 2 | Check focus indicators | Tab through page | Visible focus outline on all elements |
| 3 | Test form labels | Inspect with screen reader | All inputs have associated labels |
| 4 | Verify ARIA attributes | Use accessibility inspector | Proper ARIA roles and properties |
| 5 | Check color contrast | Use contrast analyzer | Minimum 4.5:1 ratio for normal text |
| 6 | Test without mouse | Keyboard only operation | All functions accessible via keyboard |
| 7 | Screen reader navigation | NVDA/JAWS | - Headings properly structured<br>- Links have descriptive text<br>- Images have alt text |
| 8 | Test error announcements | Submit invalid form | Errors announced to screen reader |
| 9 | Check skip links | Tab at page start | "Skip to main content" link available |
| 10 | Verify form validation | Submit with errors | - Inline errors with descriptions<br>- Focus moves to first error |

**Test Result**: Pass/Fail  
**WCAG 2.1 AA Compliance**: Yes/No  
**Issues Found**: [List accessibility issues]

---

## Test Execution Summary

### Test Suite Metrics
- **Total Test Cases**: 10
- **Executed**: [To be filled]
- **Passed**: [To be filled]
- **Failed**: [To be filled]
- **Blocked**: [To be filled]
- **Not Run**: [To be filled]

### Defect Summary
- **Critical**: [Count]
- **High**: [Count]
- **Medium**: [Count]
- **Low**: [Count]

### Test Environment
- **Browser Versions Tested**:
  - Chrome: [Version]
  - Firefox: [Version]
  - Edge: [Version]
  - Safari: [Version]
- **Operating Systems**:
  - Windows 11
  - macOS Ventura
  - Ubuntu 22.04
- **Mobile Devices**:
  - iPhone 14 (iOS 16)
  - Samsung Galaxy S23 (Android 13)

### Risk Assessment
- **High Risk Areas**:
  - File upload under load
  - Email delivery reliability
  - Session management
  
- **Medium Risk Areas**:
  - Performance with 1000+ records
  - Browser compatibility
  - Mobile responsiveness

- **Low Risk Areas**:
  - Static content display
  - Basic navigation
  - Read-only operations

### Recommendations
1. Increase test coverage for mobile devices
2. Add more negative test scenarios
3. Implement automated regression suite
4. Enhance performance testing scenarios
5. Regular accessibility audits

---
*Document Version: 1.0*
*Test Suite Last Updated: 2025*
*For Workshop Training Use*