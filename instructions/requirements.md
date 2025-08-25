# City Services Portal — Cursor Tasks (Step‑by‑step, English)

This document contains **atomic, copy‑paste tasks** for Cursor with clear **acceptance criteria**. Send the tasks to Cursor **one at a time**. The flow assumes **Node.js 20+, Express, Prisma (SQLite), React (Vite), MUI**, and **comprehensive form validation with security measures**.

---

## 0) Operating Mode for Cursor (send this once at the beginning)

```text
When I assign you a task block "CURSOR TASK N/M":
- Make only the requested changes for that task.
- List all created/modified files with code diffs.
- Run all package scripts mentioned in the task and paste the console output.
- Do not skip validation or acceptance checks. If a check fails, fix and re‑run until it passes.
- MANDATORY: Implement comprehensive form validation with Zod schemas for ALL forms.
- MANDATORY: Include XSS prevention and input sanitization for all text inputs.
- MANDATORY: Add proper test IDs (data-testid) for all interactive elements.
- Stop when the acceptance criteria are met. Ask me to proceed to the next task.
```

---

## 0.1) Project‑wide Cursor Rules (MANDATORY, recommended)

Put the snippet below into a file named **.cursorrules** at the repo root to keep the assistant consistent across tasks.

```text
# React + MUI + Validation Ground Rules
- Prefer MUI components for all UI: Stepper, Dialog, TextField, Select, Autocomplete, Snackbar, DataGrid, DateTimePicker.
- ALL interactive elements MUST have data-testid="cs-<page>-<element>" and an accessible name (label/aria-label).
- MANDATORY: Use react-hook-form + zod for ALL forms with comprehensive validation:
  * Real-time validation with 300ms debouncing
  * Input sanitization and XSS prevention
  * Comprehensive error messages with accessibility
  * Character count indicators for length-limited fields
  * Password strength indicators where applicable
  * Rate limiting for form submissions (5 attempts per minute)
- Show helperText on validation errors with proper ARIA attributes.
- DataGrid: enable server-side sorting/filtering/pagination. Route params: page/size/sort/filter → call API.
- Keep DOM stable for WebDriver: avoid random ids; if MUI generates ids, override via `id` when necessary.
- Use ThemeProvider with a custom theme; store design tokens in theme (spacing, palette, shape).
- i18n: wire MUI locale (BG/EN) and expose a Language switch in the top bar.
- Do not inline CSS; use `sx` prop or styled API consistently.
- Each feature page lives under /ui/src/features/<area>/ with index.tsx and subcomponents.

# Validation Security Requirements (MANDATORY)
- ALL text inputs MUST be sanitized to prevent XSS attacks
- Implement input validation patterns: email, phone, name, password, safe text
- Use ValidationPatterns and ErrorMessages from utils/validation.ts
- Include cross-field validation for related inputs (password confirmation, date ranges)
- Implement file upload validation with type, size, and security checks
- Add accessibility support with ARIA attributes for all validation states

# API Quality Gate
- OpenAPI documented and served at /api-docs.
- Errors use { error: { code, message, details?, correlationId } } and every response carries a correlationId.
- Lists: filtering, sorting whitelist, pagination + X-Total-Count.
- POST /requests requires Idempotency-Key; PATCH uses If-Match version → respond 409 on mismatch.
- ALL API inputs MUST be validated with Zod schemas on server side.
- Return structured validation errors in standardized format.
```

---

## CURSOR TASK 1/15 — Monorepo init + API (TypeScript) + Validation Setup

```text
Create a monorepo folder structure:
  /city-services-portal
    /api
    /ui
Initialize Node+TS in /api with:
  - TypeScript, ts-node-dev, ESLint, Prettier
  - Dependencies: express, cors, pino, zod, jsonwebtoken, bcryptjs, multer, swagger-ui-express, uuid
  - Dev deps: @types/* for the above
Add scripts to /api/package.json:
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js"
Create src/server.ts with a minimal Express app:
  - /health -> { ok: true }
  - pino logger middleware
  - CORS enabled
  - Input validation middleware setup for Zod
  - listen on 3001 and log the URL
Create tsconfig.json (ES2020, module commonjs, outDir dist, rootDir src).
Create basic validation utilities in src/utils/validation.ts with XSS prevention.
Acceptance:
  - Running `npm run dev` in /api prints "API listening on http://localhost:3001"
  - GET http://localhost:3001/health returns { ok: true }.
  - Validation utilities are properly set up for XSS prevention.
```

---

## CURSOR TASK 2/15 — Prisma + SQLite + base models + Enhanced Security

```text
In /api add Prisma:
  - npm i prisma @prisma/client
  - npx prisma init (SQLite)
Define schema.prisma with models (include security audit fields):
  User(id, name, email unique, role enum [CITIZEN, CLERK, FIELD_AGENT, SUPERVISOR, ADMIN], passwordHash, departmentId?, lastLoginAt?, failedLoginAttempts @default(0), lockedUntil?, createdAt, updatedAt)
  Department(id, name, slug)
  ServiceRequest(id, code unique, title, description, category, priority enum [LOW, MEDIUM, HIGH, URGENT], status enum [DRAFT, SUBMITTED, TRIAGED, IN_PROGRESS, WAITING_ON_CITIZEN, RESOLVED, CLOSED, REJECTED], locationText, lat?, lng?, createdBy, assignedTo?, departmentId?, version Int @default(1), slaDueAt?, closedAt?, reopenUntil?, createdAt, updatedAt)
  Comment(id, requestId, authorId, body, visibility enum [PUBLIC, INTERNAL], createdAt)
  Attachment(id, requestId, uploadedById, filename, mime, size, url, isScanned @default(false), scanResult?, createdAt)
  Assignment(id, requestId, assigneeId, assignedById, assignedAt)
  EventLog(id, requestId, type, payload Json, createdAt)
  FeatureFlag(key @id, value Json)
  IdempotencyKey(id, key unique, requestHash, response Json, expiresAt, createdAt)
  ValidationLog(id, input, sanitizedInput, xssDetected @default(false), createdAt)
Add npm scripts:
  "prisma:migrate": "prisma migrate dev --name init",
  "seed": "ts-node-dev --transpile-only prisma/seed.ts",
  "reset": "rimraf prisma/dev.db && npm run prisma:migrate && npm run seed"
Create prisma/seed.ts:
  - Create Departments (Roads, Lighting, Waste)
  - Create Users for each role (with bcrypt)
  - Create ~50 ServiceRequest with varied statuses/priorities
  - Create FeatureFlags for testing scenarios
Acceptance:
  - prisma migrate runs successfully; seed completes; dev.db exists.
  - Security audit fields are properly included in schema.
```

---

## CURSOR TASK 3/15 — Auth (JWT) + RBAC middleware + Security Enhancements

```text
Implement auth routes in /api/src with comprehensive validation:
  - POST /api/v1/auth/register (Citizen by default) with Zod validation:
    * Email format validation and uniqueness check
    * Password strength requirements (8+ chars, uppercase, lowercase, number, special)
    * Name validation with unicode support
    * Input sanitization for all text fields
    * Rate limiting (5 attempts per minute)
  - POST /api/v1/auth/login with security features:
    * Account lockout after 5 failed attempts (30 min lockout)
    * Input validation and sanitization
    * Correlation ID tracking
  - GET /api/v1/auth/me -> user profile (requires auth)
Create auth middleware:
  - verify JWT, attach req.user { id, role }
  - rbacGuard(roles: Role[]) to protect routes by role
  - Track login attempts and implement lockout logic
Hash passwords with bcryptjs (12 rounds minimum). JWT via HS256, env JWT_SECRET, expiresIn 1h.
Create validation schemas in src/schemas/auth.ts with comprehensive rules.
Acceptance:
  - Register validates all inputs with proper error messages
  - Login implements account lockout and rate limiting
  - /auth/me returns profile when Bearer token is used
  - All inputs are sanitized and validated for security
```

---

## CURSOR TASK 4/15 — OpenAPI/Swagger + Error Envelope + Validation Documentation

```text
Integrate Swagger UI at /api-docs with comprehensive validation documentation:
  - Generate an OpenAPI 3 doc with validation schemas for all endpoints
  - Document validation rules, error responses, and security measures
  - Include examples for all validation scenarios
Standardize error envelope with validation details:
  - All errors return { error: { code, message, details?, validationErrors?, correlationId } }
  - Add correlationId per request (uuid) and include it in logs + responses
  - Include field-specific validation errors in structured format
Create middleware for validation error handling:
  - Transform Zod errors into user-friendly messages
  - Log validation failures for security monitoring
  - Include XSS detection alerts
Acceptance:
  - /api-docs loads with comprehensive validation documentation
  - Validation errors return structured responses with field details
  - Security validation failures are properly logged
```

---

## CURSOR TASK 5/15 — Service Requests with Comprehensive Validation + Idempotency

```text
Implement endpoints with full validation and security:
  - GET /api/v1/requests?status=&category=&priority=&department=&assignedTo=&text=&page=&size=&sort=
    * Validate and sanitize all query parameters
    * Implement search term XSS prevention
  - POST /api/v1/requests with comprehensive Zod validation:
    * title: 5-120 chars, XSS prevention, meaningful content check
    * description: 30-2000 chars, word count minimum (10 words)
    * category: predefined enum validation
    * priority: optional, default MEDIUM
    * locationText: required, sanitized input
    * Support "Idempotency-Key" header with request deduplication
    * Cross-field validation for emergency requests
  - GET /api/v1/requests/:id (role: owner or staff)
    * Validate UUID format for ID parameter
Create validation schemas in src/schemas/requests.ts:
  - ServiceRequestCreateSchema with all security measures
  - ServiceRequestQuerySchema for search parameters
  - EmergencyRequestValidation for special handling
Include pagination (X-Total-Count), sorting whitelist, filtering with validation.
Acceptance:
  - All inputs are validated and sanitized
  - Creating returns 201 with code like "REQ-2025-0001"
  - Idempotency prevents duplicate submissions
  - Emergency requests have special validation rules
  - Search parameters are XSS-safe
```

---

## CURSOR TASK 6/15 — State machine + optimistic locking + Validation

```text
Add PATCH /api/v1/requests/:id with comprehensive validation:
  - Require header If-Match: <version>. On mismatch -> 409 with code "VERSION_CONFLICT"
  - Validate all editable fields with Zod schemas
  - Implement input sanitization for all text updates
  - Cross-field validation for status-dependent fields
Add POST /api/v1/requests/:id/status with validated actions:
  - Actions: triage, start, wait_for_citizen, resolve, close, reject, reopen
  - Validate legal transitions per state machine (422 on invalid transition)
  - Require reason field for certain transitions (reject, reopen)
  - Validate reason text (min 10 chars, XSS prevention)
Create validation schemas in src/schemas/statusTransitions.ts:
  - StatusTransitionSchema with reason validation
  - StateTransitionRules for business logic validation
Log EventLog entries for all status changes with sanitized data.
Acceptance:
  - Happy path SUBMITTED -> TRIAGED -> IN_PROGRESS -> RESOLVED -> CLOSED works
  - Invalid transition returns 422 with clear validation message
  - Stale version returns 409
  - All transition reasons are validated and sanitized
  - Status changes log proper audit trail
```

---

## CURSOR TASK 7/15 — Feature Flags ("Bug Mode") + Admin Validation

```text
Add FeatureFlag service + Admin routes with comprehensive validation:
  - GET /api/v1/admin/flags (Admin only)
  - PATCH /api/v1/admin/flags/:key with validated input:
    * Validate flag key format and existence
    * Validate flag value based on flag type
    * Sanitize any string values in flag configuration
Introduce the following flags wired into logic:
  - UI_WrongDefaultSort (affects default sort on list endpoint)
  - UI_MissingAria_Search (exposed later via UI)
  - API_Random500 (5% random internal error on GET /requests)
  - API_SlowRequests (10% add 2.5s delay on GET /requests)
  - API_ValidationBypass (for testing validation scenarios)
Create validation schemas in src/schemas/admin.ts:
  - FeatureFlagUpdateSchema with type-specific validation
  - AdminOperationSchema for sensitive admin actions
Implement audit logging for all admin operations.
Acceptance:
  - Flags persist in DB with validation
  - Admin operations are logged and validated
  - Toggling API flags visibly affects responses
  - Invalid flag values are rejected with proper validation errors
```

---

## CURSOR TASK 8/15 — Uploads + Attachments + Security Validation

```text
Add POST /api/v1/requests/:id/attachments with comprehensive security:
  - Multipart upload with strict validation:
    * File type whitelist: JPG, PNG, PDF only (validate MIME and extension)
    * File size limit: 5MB maximum
    * File name sanitization (remove dangerous characters)
    * Content scanning preparation (virus scan placeholder)
  - Save Attachment rows with security metadata
  - Generate secure file paths (UUID-based)
Add GET /api/v1/requests/:id/attachments with proper authorization.
Create validation schemas in src/schemas/uploads.ts:
  - FileUploadSchema with security validation
  - FileTypeValidation with MIME type checking
  - FileSizeValidation with proper limits
Add feature flag API_UploadIntermittentFail (1/15 fails with 500).
Implement upload security logging:
  - Log all upload attempts with file metadata
  - Alert on suspicious file types or sizes
  - Track upload failures and potential attacks
Acceptance:
  - Upload validates type/size with security checks
  - File names are sanitized and secure
  - Intermittent fail reproducible with flag
  - All upload attempts are logged for security monitoring
  - Rejected uploads provide clear validation messages
```

---

## CURSOR TASK 9/15 — UI scaffolding + Validation Framework Setup

```text
In /ui create a Vite React TS app with comprehensive validation setup:
  - Dependencies: react-router-dom, axios, react-hook-form, @hookform/resolvers, zod, date-fns
  - MUI dependencies: @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
  - Validation utilities: lodash (for debouncing), uuid (for correlation IDs)
Create validation framework:
  - src/utils/validation.ts with comprehensive patterns and XSS prevention
  - src/schemas/formSchemas.ts with all form validation schemas
  - src/components/ValidatedTextField.tsx with real-time validation
  - src/components/ValidatedSelect.tsx with proper error handling
  - src/hooks/useValidatedForm.ts for form management
Add routes with validation-ready placeholders:
  / (PublicBoard placeholder)
  /login (with validation)
  /register (with comprehensive validation)
  /citizen/requests, /citizen/requests/new (with validation)
  /clerk/inbox
  /supervisor/assign
  /agent/my-tasks
  /admin/flags
Add <AppLayout> with top nav, role badge (from /auth/me), and validation error boundary.
Acceptance:
  - `npm run dev` serves UI on 5173
  - Validation framework is properly set up and accessible
  - Routes render with proper test IDs (data-testid="cs-page-name")
  - Error boundary handles validation failures gracefully
```

---

## CURSOR TASK 10/15 — MUI + Theme + Validation Components

```text
In /ui implement comprehensive MUI setup with validation:
- Install remaining MUI packages: @mui/x-data-grid, @mui/x-date-pickers, @mui/lab
- Create enhanced theme in src/theme/index.ts with validation styles:
  * Error colors for validation states
  * Success colors for valid inputs
  * Warning colors for field limits
  * Custom spacing for validation messages
- Wrap <App/> with <ThemeProvider> + <CssBaseline> + validation context
- Create validation components:
  * ValidatedTextField with character counting and strength indicators
  * ValidatedSelect with error state handling
  * ValidatedDatePicker with date range validation
  * PasswordField with strength meter
  * FileUpload with drag-and-drop and validation
- Add BG/EN locale toggle in top bar with validation message translation
- Create validation error boundary with proper user feedback
Acceptance:
- App renders with MUI theme and validation styling
- All validation components work with proper error states
- Language toggle affects validation messages (EN ↔ BG)
- Error boundary properly handles and displays validation failures
```

---

## CURSOR TASK 11/15 — Registration Form + Comprehensive Validation

```text
Implement comprehensive registration form at /register:
- Multi-step wizard using MUI Stepper with validation per step:
  * Step 1: Personal Info (firstName, lastName, email with uniqueness check)
  * Step 2: Contact Details (phone, address fields with validation)
  * Step 3: Account Setup (password with strength meter, confirmation)
  * Step 4: Preferences (language, communication method, notifications)
  * Step 5: Review & Submit (terms agreement, final validation)
- Implement comprehensive validation:
  * Real-time validation with 300ms debouncing
  * Email uniqueness checking (async validation)
  * Password strength indicator with visual feedback
  * Cross-field validation (password confirmation)
  * Input sanitization for all text fields
  * Rate limiting (5 attempts per minute)
- Add proper test IDs for all elements:
  * cs-registration-form, cs-registration-step-N
  * cs-registration-{field-name} for all inputs
  * cs-registration-error-{field-name} for error states
  * cs-registration-submit, cs-registration-next, cs-registration-back
- Implement accessibility features:
  * ARIA attributes for validation states
  * Screen reader announcements for errors
  * Keyboard navigation support
  * Focus management between steps
Acceptance:
- Multi-step form with proper validation at each step
- Real-time feedback with user-friendly error messages
- Password strength indicator works correctly
- Email uniqueness validation prevents duplicates
- All inputs are sanitized and XSS-safe
- Comprehensive test coverage with stable selectors
- Accessible to screen readers and keyboard users
```

---

## CURSOR TASK 12/15 — Service Request Wizard + Advanced Validation

```text
Implement comprehensive service request creation at /citizen/requests/new:
- 5-step wizard using MUI Stepper with advanced validation:
  * Step 1: Category/Subcategory/Urgency (Select/Radio with conditional logic)
  * Step 2: Title/Description (TextField with rich validation and character limits)
  * Step 3: Location (Address fields with validation, map integration stub)
  * Step 4: Attachments (File upload with security validation and progress)
  * Step 5: Review & Submit (Cross-field validation and final checks)
- Implement advanced validation features:
  * Title: 5-120 chars with meaningful content detection
  * Description: 30-2000 chars with minimum word count (10 words)
  * Emergency request validation (requires phone number, higher priority)
  * File upload validation (type, size, security checks)
  * Location validation with geocoding preparation
  * Cross-step validation dependencies
- Add comprehensive error handling:
  * Network error recovery with retry mechanisms
  * Validation error aggregation across steps
  * File upload error handling with progress indicators
  * Form state persistence across navigation
- Include proper test automation support:
  * cs-new-request-step-{N} for each step
  * cs-new-request-{field-name} for all inputs
  * cs-new-request-upload-{action} for file operations
  * cs-new-request-validation-{state} for error states
Acceptance:
- 5-step wizard with comprehensive validation
- Emergency requests trigger additional validation rules
- File uploads validate security and provide progress feedback
- Form state persists across step navigation
- Validation errors are aggregated and clearly displayed
- All validation rules prevent XSS and injection attacks
- Submit creates request and shows success with request code
```

---

## CURSOR TASK 13/15 — DataGrid + Search with Validation

```text
Replace placeholder DataTable with MUI DataGrid + comprehensive search validation:
- Create enhanced DataGrid component in src/components/EnhancedDataGrid.tsx:
  * Server-side sorting, filtering, and pagination
  * Search input with debounced validation and XSS prevention
  * Column filters with validation for each filter type
  * Export functionality with data validation
- Wire /citizen/requests to validated GET /requests:
  * Validate all query parameters before API calls
  * Sanitize search terms to prevent XSS
  * Implement proper error handling for invalid filters
  * Add loading states and error recovery
- Add advanced search features:
  * Date range picker with validation
  * Multi-select filters with proper validation
  * Saved search functionality with validation
  * Search history with XSS-safe storage
- Implement comprehensive test automation:
  * cs-{page}-grid for DataGrid root
  * cs-{page}-search for search input
  * cs-{page}-filter-{column} for column filters
  * cs-{page}-sort-{column} for sorting controls
  * cs-{page}-page-{action} for pagination
Acceptance:
- DataGrid shows data with server-side operations
- Search input validates and sanitizes user input
- All filters validate input before applying
- Grid handles loading and error states gracefully
- Search terms are XSS-safe and properly escaped
- Comprehensive test selectors for automation
- Performance is optimized for large datasets
```

---

## CURSOR TASK 14/15 — Clerk Inbox + Advanced Workflow Validation

```text
Implement comprehensive clerk inbox at /clerk/inbox:
- Split view layout with validation:
  * Left: Enhanced DataGrid with validated filters for GET /requests?status=SUBMITTED|TRIAGED
  * Right: Details panel with comment validation and attachment security
- Action forms with comprehensive validation:
  * Classify Request form:
    - Category validation with business rules
    - Priority assessment with justification (required for HIGH/URGENT)
    - Department assignment with validation
  * Duplicate Check modal:
    - Search validation with XSS prevention
    - Similarity scoring with validated criteria
    - Merge/link options with authorization
  * Return for Info modal:
    - Reason dropdown with required selection
    - Message field with 15+ char minimum and XSS prevention
    - Follow-up date validation
    - Notification method validation
- Status transition validation:
  * Validate legal state transitions
  * Require reason for rejections (min 20 chars)
  * Cross-field validation for status-dependent fields
  * Optimistic locking with version conflict handling
- Add comprehensive test automation:
  * cs-clerk-inbox-grid for request list
  * cs-clerk-details-{section} for detail panels
  * cs-clerk-action-{action} for action buttons
  * cs-clerk-modal-{modal-name} for modals
  * cs-clerk-form-{field} for form inputs
Acceptance:
- Split view with validated filters and search
- All action forms implement comprehensive validation
- Status changes validate business rules and state machine
- Comments and messages are XSS-safe and validated
- File attachments are security-validated
- Error states provide clear guidance for recovery
- All interactions have proper test selectors
```

---

## CURSOR TASK 15/15 — Admin Panel + Security Validation + Final Integration

```text
Implement comprehensive admin panel at /admin/flags with security focus:
- Feature flag management with validation:
  * Flag toggle validation with confirmation for critical flags
  * Value validation based on flag type (boolean, string, number, JSON)
  * Audit logging for all flag changes with user tracking
  * Rollback functionality with validation
- Database management with security:
  * Seed DB button with confirmation and validation
  * Reset DB button with double confirmation and admin verification
  * Data export with validation and access control
  * System health monitoring with validated metrics
- Security monitoring dashboard:
  * Validation failure tracking with charts
  * XSS attempt detection and alerting
  * Rate limiting status and blocked attempts
  * Failed login tracking and account lockouts
- Advanced admin features:
  * User management with role validation
  * System configuration with input validation
  * Log viewer with search validation and XSS prevention
  * Performance metrics with validated queries
- Add final validation integration:
  * Validate all admin operations with confirmation
  * Implement admin-specific rate limiting
  * Add audit trail for all administrative actions
  * Create comprehensive test coverage
- Final testing and validation:
  * cs-admin-flags-{flag-name} for flag controls
  * cs-admin-action-{action} for admin actions
  * cs-admin-security-{metric} for security monitoring
  * cs-admin-confirmation-{action} for confirmations
Acceptance:
- Flag management validates all changes and logs actions
- Database operations require proper authorization and confirmation
- Security monitoring shows validation metrics and alerts
- All admin operations are validated, logged, and reversible
- System demonstrates comprehensive validation across all features
- Final integration testing passes all validation scenarios
- Performance remains optimal with all validation features enabled
- Security audit shows no vulnerabilities in validation implementation
```

---

## Enhanced Manual Verification Commands

```bash
# API with Validation
cd api
npm run dev
curl http://localhost:3001/health

# Test validation endpoints
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"weak"}'
# Should return validation errors

# Test XSS prevention
curl -X POST http://localhost:3001/api/v1/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert('xss')</script>","description":"test"}'
# Should sanitize and reject malicious content

# Test idempotency
curl -H "Idempotency-Key: 123" -X POST http://localhost:3001/api/v1/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Request","description":"Valid description with enough characters"}'

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
done
# Should show rate limiting after 5 attempts

# Test feature flags with validation
curl -X PATCH http://localhost:3001/api/v1/admin/flags/API_SlowRequests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"value": true}'

# UI Validation Testing
cd ui
npm run dev
# Navigate to http://localhost:5173
# Test registration form validation at /register
# Test service request validation at /citizen/requests/new
# Test search validation at /citizen/requests
# Test admin panel validation at /admin/flags
```

---

## Validation Testing Scenarios

```bash
# Test email validation
- Enter invalid email formats: "invalid", "@example.com", "user@"
- Test email uniqueness with existing emails
- Verify proper error messages and accessibility

# Test password validation
- Enter weak passwords: "password", "12345678", "Password"
- Verify strength meter updates in real-time
- Test password confirmation matching

# Test XSS prevention
- Enter script tags in text fields: "<script>alert('xss')</script>"
- Test JavaScript URLs: "javascript:alert('xss')"
- Verify content is sanitized and safe

# Test file upload security
- Upload invalid file types: .exe, .bat, .php
- Upload oversized files (>5MB)
- Test file name sanitization with special characters

# Test rate limiting
- Submit forms rapidly (>5 times per minute)
- Verify lockout behavior and recovery
- Test different rate limits per form type

# Test cross-field validation
- Password confirmation mismatch
- Invalid date ranges (start > end)
- Emergency requests without required phone number

# Test accessibility
- Navigate forms using only keyboard
- Test with screen reader compatibility
- Verify ARIA attributes and announcements
```

---

### Notes

- **Comprehensive Validation**: Every form now includes full validation with Zod schemas, XSS prevention, input sanitization, and real-time feedback.
- **Security Focus**: All text inputs are validated and sanitized to prevent XSS attacks, with rate limiting and audit logging.
- **Testing Ready**: Every interactive element has proper test IDs and the application includes extensive validation scenarios for QA testing.
- **Accessibility**: Full WCAG 2.1 AA compliance with proper ARIA attributes and screen reader support.
- **Performance**: Debounced validation and optimized rendering for large datasets while maintaining security.
- **Documentation**: Comprehensive validation rules are documented in OpenAPI specs with examples.

The enhanced requirements now include validation as a core requirement throughout the entire development process, ensuring that the AI in QA Demo Application serves as an excellent example of secure, validated, and thoroughly testable web application development.
