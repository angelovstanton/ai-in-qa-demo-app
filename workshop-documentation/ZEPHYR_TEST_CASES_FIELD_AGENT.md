# Zephyr Test Cases - Field Agent Mode Functionality

## Test Suite: Field Agent Mobile Interface and Task Management
**Project**: CSRP (City Service Requests Portal)  
**Test Cycle**: Release 1.0 - Sprint 5  
**Component**: Field Agent Portal  
**Priority**: High  
**Device Focus**: Mobile-First Testing  

---

## Test Case: TC-CSP-AGENT-001 - Field Agent Mobile Login and Dashboard
**Priority**: Critical  
**Type**: Functional/Mobile  
**Component**: Authentication & Mobile UI  
**Preconditions**: 
- Field agent account exists (agent1@city.gov / password123)
- Mobile device (iOS/Android) or responsive browser
- GPS/Location services enabled
- Tasks assigned to agent

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Open mobile browser | URL: https://portal.city.gov/mobile | Mobile login page loads, optimized for touch |
| 2 | Enter agent credentials | Email: agent1@city.gov<br>Password: password123 | Virtual keyboard appears, fields accept input |
| 3 | Tap "Login" button | - | Loading spinner, button disabled during auth |
| 4 | Wait for dashboard | - | Redirected to /agent/dashboard within 2 seconds |
| 5 | Verify mobile layout | - | Shows:<br>- Hamburger menu<br>- Status toggle (Available/Busy/Break)<br>- Today's tasks count<br>- Check-in button<br>- Quick stats |
| 6 | Check GPS indicator | - | Location icon shows, "Location Active" status |
| 7 | Tap "Check In" | - | - Time stamp recorded<br>- Status changes to "Available"<br>- Toast: "Checked in successfully" |
| 8 | View today's stats | - | Shows:<br>- Assigned: 5 tasks<br>- Completed: 0<br>- In Progress: 0<br>- Urgent: 1 |
| 9 | Test offline indicator | Disable network briefly | Offline banner appears: "Working offline" |
| 10 | Re-enable network | - | Banner disappears, data syncs automatically |

**Post-conditions**: 
- Agent logged in and checked in
- Location tracking active
- Dashboard showing current workload

**Mobile Metrics**:
- Login time: ___seconds
- Dashboard load: ___seconds
- GPS accuracy: ___meters

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-002 - Task List and Priority Management
**Priority**: High  
**Type**: Functional  
**Component**: Task Management  
**Preconditions**: 
- Logged in as field agent
- 5+ tasks assigned with different priorities
- Tasks in various states

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to task list | Tap "My Tasks" | Task list loads with assigned work orders |
| 2 | Verify priority sorting | - | Tasks ordered:<br>🔴 URGENT (red)<br>🟠 HIGH (orange)<br>🔵 MEDIUM (blue)<br>⚪ LOW (gray) |
| 3 | View urgent task | Tap REQ-2024-0200 (URGENT) | Task details show:<br>- "Water main leak"<br>- Address<br>- Required by: 2 hours<br>- Red border highlight |
| 4 | Check task badges | - | Shows:<br>- Priority color<br>- Category icon<br>- Time estimate<br>- Distance from current location |
| 5 | Swipe for quick actions | Swipe left on task | Reveals: Start, Navigate, Call buttons |
| 6 | Filter by status | Tap filter icon, select "NEW" | Only unstarted tasks display |
| 7 | Sort by distance | Tap "Sort > Nearest" | Tasks reorder by proximity |
| 8 | View on map | Tap "Map View" | All tasks shown as pins on map |
| 9 | Cluster view | Zoom out on map | Nearby tasks cluster with count |
| 10 | Return to list | Tap "List View" | Returns to prioritized list |

**Task Display Metrics**:
- List load time: ___ms
- Map render time: ___seconds
- Task count: ___

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-003 - Start and Navigate to Task Location
**Priority**: High  
**Type**: Functional  
**Component**: Navigation & GPS  
**Preconditions**: 
- Field agent has assigned task
- GPS enabled on device
- Map application available

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Select task from list | Tap REQ-2024-0201 | Task details page opens |
| 2 | View location details | - | Shows:<br>- Address: "123 Main St"<br>- Distance: "2.3 miles"<br>- Est. travel: "8 minutes" |
| 3 | Tap "Start Task" | - | - Status changes to "In Transit"<br>- Timer starts<br>- Location tracking begins |
| 4 | Tap "Navigate" | - | Opens default map app with destination |
| 5 | Verify route | Check map app | Route calculated from current location |
| 6 | Return to app | Switch back | App maintains state, timer running |
| 7 | Arrive at location | Reach destination | - GPS detects arrival<br>- Prompt: "Have you arrived?"<br>- Distance shows "0.0 miles" |
| 8 | Confirm arrival | Tap "Yes, I'm here" | - Status: "On Site"<br>- Arrival time logged<br>- Travel time recorded |
| 9 | View location photo | - | Street view or submitted photo displays |
| 10 | Check location accuracy | Compare actual vs app | Location accurate within 50 meters |

**Navigation Metrics**:
- GPS accuracy: ___meters
- Location detection: ___seconds
- Route calculation: ___seconds

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-004 - Perform Work and Update Status
**Priority**: Critical  
**Type**: Functional  
**Component**: Work Management  
**Preconditions**: 
- Agent at task location
- Task status "On Site"
- Work materials available

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Start work | Tap "Begin Work" | - Status: "In Progress"<br>- Work timer starts<br>- Options panel appears |
| 2 | Add initial note | Tap "Add Note" | Text field with voice input option appears |
| 3 | Type field note | "Confirmed pothole location, 2ft diameter" | Text saved, timestamp added |
| 4 | Take before photo | Tap camera icon | Camera opens with guidelines overlay |
| 5 | Capture photo | Take photo of issue | - Photo captured<br>- Thumbnail appears<br>- "Before" tag applied |
| 6 | Add photo annotation | Tap edit on photo | Can draw/add text on photo |
| 7 | Update progress | Set slider to 50% | Progress saves, shows "50% Complete" |
| 8 | Add material used | Tap "Materials" | List of common materials appears |
| 9 | Select materials | Choose "Asphalt - 2 bags" | Materials logged with quantity |
| 10 | Save progress | Tap "Save Progress" | - Data saved locally<br>- Sync icon shows<br>- "Last saved: timestamp" |

**Work Update Metrics**:
- Photo upload: ___seconds
- Note save time: ___ms
- Sync frequency: Every ___seconds

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-005 - Complete Task and Documentation
**Priority**: High  
**Type**: Functional  
**Component**: Task Completion  
**Preconditions**: 
- Task in progress
- Work performed
- Photos taken

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Finish work | Complete actual repair | Physical work done |
| 2 | Take after photo | Tap camera, capture | "After" photo captured and tagged |
| 3 | Set completion status | Move slider to 100% | Shows "Ready for Completion" |
| 4 | Tap "Complete Task" | - | Completion form appears |
| 5 | Fill resolution notes | "Pothole filled with cold patch asphalt. Area cleaned." | Text field accepts input |
| 6 | Select completion code | Choose "Resolved - Permanent Fix" | Dropdown shows completion types |
| 7 | Add time spent | Enter "45 minutes" | Time automatically calculated from timer |
| 8 | Verify checklist | - | ☑ Photos taken<br>☑ Notes added<br>☑ Materials logged |
| 9 | Submit completion | Tap "Submit Completion" | - Loading indicator<br>- "Task Completed" confirmation<br>- Returns to task list |
| 10 | Verify in list | Check task list | Task shows "Completed" status with checkmark |

**Completion Metrics**:
- Submission time: ___seconds
- Data package size: ___MB
- Success rate: ___%

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-006 - Offline Mode and Data Synchronization
**Priority**: Critical  
**Type**: Functional  
**Component**: Offline Capability  
**Preconditions**: 
- Agent logged in with tasks
- Some tasks already cached
- Ability to control network

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Load task list online | View all tasks | 5 tasks display with full details |
| 2 | Enable airplane mode | Turn off all network | - "Offline Mode" banner appears<br>- Cached tasks remain visible |
| 3 | Open cached task | Tap REQ-2024-0205 | Task details load from local storage |
| 4 | Start task offline | Tap "Start Task" | - Status updates locally<br>- Sync pending icon appears |
| 5 | Add note offline | Type "Work started offline" | Note saved locally with offline indicator |
| 6 | Take photo offline | Capture image | Photo stored locally, queued for upload |
| 7 | Complete task offline | Submit completion | - Completion saved locally<br>- "Will sync when online" message |
| 8 | Disable airplane mode | Restore network | - "Syncing..." notification<br>- Progress bar appears |
| 9 | Verify sync | Wait for completion | - All changes uploaded<br>- Photos uploaded<br>- Status synchronized<br>- Sync icon disappears |
| 10 | Check server data | Refresh page | All offline changes reflected on server |

**Offline/Sync Metrics**:
- Local storage used: ___MB
- Sync time: ___seconds
- Data integrity: Pass/Fail

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-007 - Time Tracking and Break Management
**Priority**: Medium  
**Type**: Functional  
**Component**: Time Management  
**Preconditions**: 
- Agent checked in for the day
- Active tasks available
- Break policies configured

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | View time dashboard | Tap menu > Time | Shows:<br>- Check-in: 8:00 AM<br>- Active time: 0:00<br>- Break time: 0:00 |
| 2 | Start task timer | Begin any task | Task timer starts, counts up |
| 3 | Pause for break | Tap "Take Break" | - Confirmation: "Start break?"<br>- Options: 15 min, 30 min, Lunch |
| 4 | Select lunch break | Choose "Lunch (30 min)" | - Status: "On Break"<br>- Break timer starts<br>- Tasks locked |
| 5 | Try to access task | Tap any task | Message: "Complete break first" |
| 6 | End break early | Tap "End Break" at 20 min | - Break time: 20 minutes logged<br>- Status: "Available"<br>- Tasks unlocked |
| 7 | View time summary | Check time dashboard | Shows:<br>- Active: 2:20<br>- Break: 0:20<br>- Total: 2:40 |
| 8 | Complete shift | Tap "Check Out" | Confirmation: "End shift?" |
| 9 | Confirm checkout | Tap "Yes" | - Day summary appears<br>- Total hours: 8:30<br>- Tasks completed: 4 |
| 10 | View timesheet | Tap "View Timesheet" | Weekly/daily breakdown displayed |

**Time Tracking Accuracy**:
- Timer precision: ___
- Break enforcement: Working/Not Working
- Total calculation: Correct/Incorrect

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-008 - Emergency and Priority Task Handling
**Priority**: High  
**Type**: Functional  
**Component**: Emergency Response  
**Preconditions**: 
- Agent working on normal task
- Emergency task can be triggered
- Supervisor available

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Work on current task | In progress on REQ-2024-0210 | Normal task timer running |
| 2 | Receive emergency | (Supervisor assigns emergency) | - Push notification<br>- Alert sound<br>- Screen flashes red |
| 3 | View emergency alert | - | Shows:<br>⚠️ "EMERGENCY: Gas leak reported"<br>Address: "456 Oak Ave"<br>Required: IMMEDIATE |
| 4 | Tap emergency | Tap notification | Emergency details with "Accept/Decline" |
| 5 | Accept emergency | Tap "Accept" | - Current task auto-paused<br>- Emergency becomes active<br>- Navigation auto-starts |
| 6 | View emergency details | - | Red header, all critical info highlighted |
| 7 | Navigate to emergency | Follow directions | Priority routing, avoiding traffic |
| 8 | Arrive and start | Tap "On Site" | - Supervisor notified<br>- Emergency timer starts |
| 9 | Request assistance | Tap "Request Backup" | - Message to supervisor<br>- Nearby agents alerted |
| 10 | Complete emergency | Resolve and submit | Priority upload, immediate sync |

**Emergency Response Metrics**:
- Alert delivery: ___seconds
- Response time: ___minutes
- System prioritization: Working/Failed

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-009 - Communication with Dispatch and Citizens
**Priority**: Medium  
**Type**: Functional  
**Component**: Communication  
**Preconditions**: 
- Agent on active task
- Contact information available
- Communication permissions granted

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Open task with contact | Select REQ-2024-0215 | Shows citizen contact info |
| 2 | Tap "Call Citizen" | - | - Phone dialer opens<br>- Number pre-filled: (555) 123-4567 |
| 3 | Complete call | Make test call | Call log entry created |
| 4 | Log call outcome | Return to app | Prompt: "Log call details?" |
| 5 | Add call note | "Citizen confirmed availability" | Note saved with call duration |
| 6 | Message dispatch | Tap "Contact Dispatch" | Chat interface opens |
| 7 | Send message | "Need traffic control at Main St" | - Message sent<br>- Delivered indicator<br>- Read receipt |
| 8 | Receive reply | Wait for response | - Notification<br>- "Dispatch: Unit deployed" |
| 9 | Send photo to dispatch | Attach scene photo | Photo uploads with message |
| 10 | Close communication | Mark as resolved | Communication thread archived |

**Communication Metrics**:
- Message delivery: ___seconds
- Call log accuracy: Yes/No
- Notification reliability: ___%

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Case: TC-CSP-AGENT-010 - End of Day Report and Data Upload
**Priority**: Medium  
**Type**: Functional  
**Component**: Reporting  
**Preconditions**: 
- Full day of work completed
- Multiple tasks done
- Ready to check out

### Test Steps:
| Step | Action | Test Data | Expected Result |
|------|--------|-----------|-----------------|
| 1 | Navigate to reports | Menu > Daily Report | Report summary page opens |
| 2 | View completed tasks | - | Shows:<br>- Completed: 6<br>- In Progress: 1<br>- Not Started: 2 |
| 3 | Review time breakdown | Check time section | - Travel time: 1:45<br>- Work time: 5:30<br>- Break time: 0:45<br>- Total: 8:00 |
| 4 | Check materials used | View materials tab | Lists all materials with quantities |
| 5 | Verify photos | Tap "Photos" tab | All before/after photos in grid |
| 6 | Add day summary | Type notes | "Completed all urgent tasks. Rain delayed REQ-0220" | Text accepted |
| 7 | Flag issues | Mark problems | ☑ "Equipment issue"<br>☑ "Need supplies" |
| 8 | Generate report | Tap "Generate PDF" | PDF preview appears |
| 9 | Submit report | Tap "Submit to Supervisor" | - Upload progress<br>- "Report submitted" confirmation |
| 10 | Check out | Tap "End Shift" | - Final sync<br>- "Have a great evening, Agent One!"<br>- Logged out |

**End of Day Metrics**:
- Report generation: ___seconds
- Data upload size: ___MB
- Sync completion: ___seconds

**Test Result**: Pass/Fail  
**Actual Result**: [To be filled during execution]  
**Defects**: [Link any defects found]  

---

## Test Execution Summary - Field Agent Mode

### Test Suite Metrics
- **Total Test Cases**: 10
- **Critical**: 3
- **High**: 4
- **Medium**: 3
- **Executed**: [To be filled]
- **Passed**: [To be filled]
- **Failed**: [To be filled]
- **Blocked**: [To be filled]

### Coverage Areas
✅ Mobile authentication and dashboard  
✅ Task list and prioritization  
✅ GPS navigation  
✅ Work performance and documentation  
✅ Task completion workflow  
✅ Offline mode and synchronization  
✅ Time and break management  
✅ Emergency task handling  
✅ Communication tools  
✅ End of day reporting  

### Mobile-Specific Testing
**Devices Tested**:
- [ ] iPhone 12+ (iOS 14+)
- [ ] Samsung Galaxy S21+ (Android 11+)
- [ ] iPad Mini
- [ ] Low-end Android device

**Network Conditions**:
- [ ] 4G/5G
- [ ] 3G
- [ ] WiFi
- [ ] Offline

### Risk Assessment
**High Risk Areas**:
- Offline data synchronization
- GPS accuracy in urban canyons
- Photo upload on slow networks
- Emergency alert delivery

**Medium Risk Areas**:
- Time tracking accuracy
- Battery consumption
- Multi-tasking with navigation

**Low Risk Areas**:
- Basic task viewing
- Simple status updates
- Report viewing

### Performance Benchmarks
- App launch: <3 seconds
- Task list load: <2 seconds
- Photo capture and save: <5 seconds
- GPS lock: <10 seconds
- Offline to online sync: <30 seconds for typical day's data

---
*Test Suite Version: 1.0*
*Last Updated: 2025*
*For Workshop Training Use - Field Agent Mobile Testing*