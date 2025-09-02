# 🌐 Internationalization Refactoring Tasks

## Overview
This document outlines the remaining tasks to complete full internationalization support across all user roles and components in the City Services Portal.

## ✅ Completed Components
- [x] LoginPage
- [x] RegistrationPage
- [x] ForgotPasswordPage
- [x] ResetPasswordPage
- [x] CitizenRequestsPage
- [x] NewRequestPage (including all form steps)
- [x] AllRequestsPage
- [x] RequestDetailPage
- [x] ClerkInboxPage
- [x] AdminFlagsPage
- [x] Navigation/AppLayout
- [x] LanguageSwitcher
- [x] ImageUpload
- [x] DataTable
- [x] Request Columns Configuration

## 📋 Remaining Tasks by Role

### 1. SUPERVISOR Role Components
#### SupervisorDashboard (`/supervisor/dashboard`)
- [ ] Page title and subtitle
- [ ] Statistics cards (labels and values)
- [ ] Performance metrics labels
- [ ] Chart titles and legends
- [ ] Filter labels and options
- [ ] Date range picker labels
- [ ] Export button text

#### StaffPerformancePage (`/supervisor/staff-performance`)
- [ ] Page headers
- [ ] DataGrid column headers
- [ ] Performance metric labels
- [ ] Status indicators
- [ ] Action buttons (View Details, Generate Report)
- [ ] Filter dropdowns
- [ ] Search placeholder text

#### QualityReviewPage (`/supervisor/quality-review`)
- [ ] Review form labels
- [ ] Quality criteria checkboxes
- [ ] Rating scale labels
- [ ] Comment sections
- [ ] Submit/Save buttons
- [ ] Review status badges

#### DepartmentMetricsPage (`/supervisor/metrics`)
- [ ] Metric card titles
- [ ] KPI labels
- [ ] Trend indicators
- [ ] Comparison periods
- [ ] Chart axes labels
- [ ] Tooltip content

### 2. FIELD_AGENT Role Components
#### FieldAgentDashboard (`/agent/dashboard`)
- [ ] Dashboard welcome message
- [ ] Task count badges
- [ ] Priority indicators
- [ ] Quick action buttons
- [ ] Recent activities list

#### FieldTasksPage (`/agent/tasks`)
- [ ] Task list headers
- [ ] Task status badges
- [ ] Priority labels
- [ ] Location information
- [ ] Time estimates
- [ ] Action buttons (Start, Complete, Pause)
- [ ] Filter options

#### TaskDetailPage (`/agent/task/:id`)
- [ ] Task information labels
- [ ] Status update dropdown
- [ ] Progress indicators
- [ ] Notes/Comments section
- [ ] Photo upload labels
- [ ] Completion checklist
- [ ] Submit report button

#### AgentMapView (`/agent/map`)
- [ ] Map controls tooltips
- [ ] Task pin labels
- [ ] Route information
- [ ] Distance/Time estimates
- [ ] Filter panel labels

### 3. ADMIN Role Components (Additional)
#### SystemSettingsPage (`/admin/settings`)
- [ ] Setting category titles
- [ ] Configuration labels
- [ ] Toggle switch labels
- [ ] Save/Cancel buttons
- [ ] Validation messages
- [ ] Help text

#### UserManagementPage (`/admin/users`)
- [ ] User list headers
- [ ] Role labels
- [ ] Status indicators
- [ ] Action buttons (Edit, Deactivate, Reset Password)
- [ ] Search filters
- [ ] Bulk action options

#### AuditLogPage (`/admin/audit`)
- [ ] Log entry headers
- [ ] Action type labels
- [ ] Timestamp formats
- [ ] User information
- [ ] Filter options
- [ ] Export functionality

#### SystemHealthPage (`/admin/health`)
- [ ] Service status indicators
- [ ] Performance metrics
- [ ] Error rate labels
- [ ] Uptime statistics
- [ ] Alert configurations

### 4. CLERK Role Components (Additional)
#### ClerkDashboard (`/clerk/dashboard`)
- [ ] Queue statistics
- [ ] Average processing time
- [ ] Daily/Weekly/Monthly stats
- [ ] Quick filters
- [ ] Shortcuts panel

#### RequestProcessingPage (`/clerk/process/:id`)
- [ ] Processing form labels
- [ ] Department assignment dropdown
- [ ] Priority adjustment
- [ ] Internal notes section
- [ ] Status transition buttons
- [ ] Validation warnings

### 5. Shared/Common Components
#### NotificationCenter
- [ ] Notification types
- [ ] Time ago labels (just now, 5 minutes ago, etc.)
- [ ] Mark as read/unread
- [ ] Clear all button
- [ ] Settings link

#### SearchBar Component
- [ ] Search placeholder by context
- [ ] Search suggestions
- [ ] No results message
- [ ] Recent searches label

#### Breadcrumbs Component
- [ ] Home label
- [ ] Dynamic page names
- [ ] Separator accessibility labels

#### Footer Component
- [ ] Copyright text
- [ ] Link labels (Privacy, Terms, Contact)
- [ ] Language selector label
- [ ] Version information

#### Error Boundaries
- [ ] Error messages
- [ ] Retry button
- [ ] Contact support message
- [ ] Error codes

#### Loading States
- [ ] Loading messages by context
- [ ] Progress indicators
- [ ] Estimated time remaining

#### Empty States
- [ ] No data messages by context
- [ ] Suggested actions
- [ ] Help links

#### Confirmation Dialogs
- [ ] Dialog titles
- [ ] Confirmation messages
- [ ] Button labels (Confirm, Cancel)
- [ ] Warning messages

#### Toast/Snackbar Messages
- [ ] Success messages
- [ ] Error messages
- [ ] Warning messages
- [ ] Info messages
- [ ] Action buttons

### 6. Form Components
#### DatePickers
- [ ] Month names
- [ ] Day names
- [ ] Today/Clear buttons
- [ ] Date format labels

#### TimePickers
- [ ] AM/PM labels
- [ ] Hour/Minute labels
- [ ] Now button

#### File Upload Components
- [ ] Drag and drop messages
- [ ] File type restrictions
- [ ] Size limit messages
- [ ] Upload progress
- [ ] Error messages

#### Rich Text Editor
- [ ] Toolbar button tooltips
- [ ] Format options
- [ ] Character count
- [ ] Placeholder text

### 7. Data Display Components
#### Charts and Graphs
- [ ] Axis labels
- [ ] Legend items
- [ ] Tooltip content
- [ ] No data messages
- [ ] Time period labels

#### Tables (non-DataGrid)
- [ ] Column headers
- [ ] Row actions
- [ ] Pagination controls
- [ ] Sort indicators
- [ ] Filter chips

#### Cards and Tiles
- [ ] Card titles
- [ ] Subtitle/descriptions
- [ ] Action links
- [ ] Status badges
- [ ] Timestamps

### 8. Navigation Components
#### Sidebar Menu
- [ ] Menu item labels
- [ ] Submenu items
- [ ] Collapse/Expand tooltips
- [ ] Badge counts

#### Top Navigation Bar
- [ ] User menu items
- [ ] Quick actions
- [ ] Search placeholder
- [ ] Notification badge

#### Mobile Navigation
- [ ] Hamburger menu label
- [ ] Bottom navigation labels
- [ ] Swipe hints

## 🔧 Implementation Guidelines

### For Each Component:
1. **Import useTranslation hook**
   ```typescript
   import { useTranslation } from 'react-i18next';
   ```

2. **Initialize in component**
   ```typescript
   const { t } = useTranslation();
   ```

3. **Replace hardcoded text**
   ```typescript
   // Before
   <Typography>Dashboard</Typography>
   
   // After
   <Typography>{t('navigation:dashboard')}</Typography>
   ```

4. **Add translation keys to JSON files**
   - `/locales/en/[namespace].json`
   - `/locales/bg/[namespace].json`

### Translation Namespaces to Use:
- `common` - Shared UI elements
- `auth` - Authentication related
- `requests` - Service requests
- `navigation` - Menu and routing
- `validation` - Form validation
- `errors` - Error messages
- `status` - Status enumerations
- `admin` - Admin specific
- `supervisor` - Supervisor specific
- `agent` - Field agent specific
- `clerk` - Clerk specific

### New Namespaces to Create:
- `dashboard` - Dashboard widgets and stats
- `reports` - Reporting functionality
- `settings` - Settings and configuration
- `notifications` - Notification messages
- `charts` - Chart labels and legends
- `table` - Table specific text
- `dialog` - Dialog and modal text
- `date` - Date/time related text

## 📝 Testing Checklist

For each refactored component:
- [ ] All text updates when language changes
- [ ] No console errors
- [ ] Proper fallback values for missing translations
- [ ] RTL support considerations (if needed)
- [ ] Date/number formatting respects locale
- [ ] Form validation messages translated
- [ ] Error messages translated
- [ ] Loading states translated
- [ ] Empty states translated
- [ ] Tooltips and hints translated

## 🎯 Priority Order

### High Priority (Core User Flows)
1. Supervisor Dashboard and metrics
2. Field Agent task management
3. Clerk processing workflow
4. Admin user management
5. Notification system

### Medium Priority (Supporting Features)
1. Search functionality
2. Report generation
3. Settings pages
4. Audit logs
5. System health monitoring

### Low Priority (Nice to Have)
1. Help documentation
2. Onboarding tooltips
3. Keyboard shortcuts help
4. Advanced filters
5. Export functionality labels

## 📊 Estimation

- **Total Components**: ~50
- **Average Time per Component**: 30-45 minutes
- **Total Estimated Time**: 25-38 hours
- **Testing Time**: 5-8 hours
- **Documentation**: 2-3 hours

## 🚀 Next Steps

1. Create missing namespace files
2. Start with high-priority components
3. Test each role's workflow completely
4. Update documentation
5. Create translation management process
6. Consider adding more languages

## 📌 Notes

- Always test with both languages after changes
- Consider text expansion (Bulgarian text might be longer)
- Maintain consistent terminology across translations
- Document any context-specific translations
- Consider pluralization rules for both languages
- Add comments in translation files for context

---

**Created**: September 2, 2025
**Status**: Planning Phase
**Target Completion**: TBD