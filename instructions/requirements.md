# City Services Portal — Cursor Tasks (Step‑by‑step, English)

This document contains **atomic, copy‑paste tasks** for Cursor with clear **acceptance criteria**. Send the tasks to Cursor **one at a time**. The flow assumes **Node.js 20+, Express, Prisma (SQLite), React (Vite), and MUI**.

---

## 0) Operating Mode for Cursor (send this once at the beginning)

```text
When I assign you a task block "CURSOR TASK N/M":
- Make only the requested changes for that task.
- List all created/modified files with code diffs.
- Run all package scripts mentioned in the task and paste the console output.
- Do not skip validation or acceptance checks. If a check fails, fix and re‑run until it passes.
- Stop when the acceptance criteria are met. Ask me to proceed to the next task.
```

---

## 0.1) Project‑wide Cursor Rules (optional, recommended)

Put the snippet below into a file named **.cursorrules** at the repo root to keep the assistant consistent across tasks.

```text
# React + MUI Ground Rules
- Prefer MUI components for all UI: Stepper, Dialog, TextField, Select, Autocomplete, Snackbar, DataGrid, DateTimePicker.
- All interactive elements MUST have data-testid="cs-<page>-<element>" and an accessible name (label/aria-label).
- Use controlled components with react-hook-form + zod for validation. Show helperText on errors.
- DataGrid: enable server-side sorting/filtering/pagination. Route params: page/size/sort/filter → call API.
- Keep DOM stable for WebDriver: avoid random ids; if MUI generates ids, override via `id` when necessary.
- Use ThemeProvider with a custom theme; store design tokens in theme (spacing, palette, shape).
- i18n: wire MUI locale (BG/EN) and expose a Language switch in the top bar.
- Do not inline CSS; use `sx` prop or styled API consistently.
- Each feature page lives under /ui/src/features/<area>/ with index.tsx and subcomponents.

# API Quality Gate
- OpenAPI documented and served at /api-docs.
- Errors use { error: { code, message, details?, correlationId } } and every response carries a correlationId.
- Lists: filtering, sorting whitelist, pagination + X-Total-Count.
- POST /requests requires Idempotency-Key; PATCH uses If-Match version → respond 409 on mismatch.
```

---

## CURSOR TASK 1/12 — Monorepo init + API (TypeScript)

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
  - listen on 3001 and log the URL
Create tsconfig.json (ES2020, module commonjs, outDir dist, rootDir src).
Acceptance:
  - Running `npm run dev` in /api prints "API listening on http://localhost:3001"
  - GET http://localhost:3001/health returns { ok: true }.
```

---

## CURSOR TASK 2/12 — Prisma + SQLite + base models

```text
In /api add Prisma:
  - npm i prisma @prisma/client
  - npx prisma init (SQLite)
Define schema.prisma with models:
  User(id, name, email unique, role enum [CITIZEN, CLERK, FIELD_AGENT, SUPERVISOR, ADMIN], passwordHash, departmentId?, createdAt, updatedAt)
  Department(id, name, slug)
  ServiceRequest(id, code unique, title, description, category, priority enum [LOW, MEDIUM, HIGH, URGENT], status enum [DRAFT, SUBMITTED, TRIAGED, IN_PROGRESS, WAITING_ON_CITIZEN, RESOLVED, CLOSED, REJECTED], locationText, lat?, lng?, createdBy, assignedTo?, departmentId?, version Int @default(1), slaDueAt?, closedAt?, reopenUntil?, createdAt, updatedAt)
  Comment(id, requestId, authorId, body, visibility enum [PUBLIC, INTERNAL], createdAt)
  Attachment(id, requestId, uploadedById, filename, mime, size, url, createdAt)
  Assignment(id, requestId, assigneeId, assignedById, assignedAt)
  EventLog(id, requestId, type, payload Json, createdAt)
  FeatureFlag(key @id, value Json)
Add npm scripts:
  "prisma:migrate": "prisma migrate dev --name init",
  "seed": "ts-node-dev --transpile-only prisma/seed.ts",
  "reset": "rimraf prisma/dev.db && npm run prisma:migrate && npm run seed"
Create prisma/seed.ts:
  - Create Departments (Roads, Lighting, Waste)
  - Create Users for each role (with bcrypt)
  - Create ~50 ServiceRequest with varied statuses/priorities
Acceptance:
  - prisma migrate runs successfully; seed completes; dev.db exists.
```

---

## CURSOR TASK 3/12 — Auth (JWT) + RBAC middleware

```text
Implement auth routes in /api/src:
  - POST /api/v1/auth/register (Citizen by default)
  - POST /api/v1/auth/login -> { accessToken }
  - GET /api/v1/auth/me -> user profile (requires auth)
Create auth middleware:
  - verify JWT, attach req.user { id, role }
  - rbacGuard(roles: Role[]) to protect routes by role
Hash passwords with bcryptjs. JWT via HS256, env JWT_SECRET, expiresIn 1h.
Acceptance:
  - Register + Login works; /auth/me returns profile when Bearer token is used.
```

---

## CURSOR TASK 4/12 — OpenAPI/Swagger + Error Envelope

```text
Integrate Swagger UI at /api-docs:
  - Generate an OpenAPI 3 doc in code (for now) with paths: /health, /auth/*
Standardize error envelope:
  - All errors return { error: { code, message, details?, correlationId } }
  - Add correlationId per request (uuid) and include it in logs + responses
Acceptance:
  - /api-docs loads with the above endpoints; a forced error returns the envelope.
```

---

## CURSOR TASK 5/12 — Service Requests list/create/get (+ validation, Idempotency-Key)

```text
Implement endpoints:
  - GET /api/v1/requests?status=&category=&priority=&department=&assignedTo=&text=&page=&size=&sort=
  - POST /api/v1/requests (Citizen/Clerk) with zod validation:
      title 5..120, description >=30, category in seed list, priority optional default MEDIUM, locationText required.
      Support "Idempotency-Key" header: same body+key returns the same created resource (persist keys).
  - GET /api/v1/requests/:id (role: owner or staff)
Include pagination (X-Total-Count), sorting whitelist, filtering.
Acceptance:
  - Listing works with filters; create returns 201 with code like "REQ-2025-0001".
  - Repeating POST with the same Idempotency-Key returns 200 and the same resource.
```

---

## CURSOR TASK 6/12 — State machine + optimistic locking

```text
Add PATCH /api/v1/requests/:id to edit basic fields using optimistic locking:
  - Require header If-Match: <version>. On mismatch -> 409 with code "VERSION_CONFLICT".
Add POST /api/v1/requests/:id/status with actions: triage, start, wait_for_citizen, resolve, close, reject, reopen.
  - Validate legal transitions per state machine (422 on invalid transition).
Log EventLog entries for status changes.
Acceptance:
  - Happy path SUBMITTED -> TRIAGED -> IN_PROGRESS -> RESOLVED -> CLOSED works.
  - Invalid transition returns 422; stale version returns 409.
```

---

## CURSOR TASK 7/12 — Feature Flags (“Bug Mode”)

```text
Add FeatureFlag service + Admin routes:
  - GET /api/v1/admin/flags
  - PATCH /api/v1/admin/flags/:key { value }
Introduce the following flags wired into logic:
  - UI_WrongDefaultSort (affects default sort on list endpoint)
  - UI_MissingAria_Search (exposed later via UI)
  - API_Random500 (5% random internal error on GET /requests)
  - API_SlowRequests (10% add 2.5s delay on GET /requests)
Acceptance:
  - Flags persist in DB; toggling API flags visibly affects responses.
```

---

## CURSOR TASK 8/12 — Uploads + Attachments

```text
Add POST /api/v1/requests/:id/attachments (multipart):
  - Accept only JPG/PNG <= 5MB; store under /uploads with predictable names.
  - Save Attachment rows; return thumbnails info.
Add GET /api/v1/requests/:id/attachments.
Add flag API_UploadIntermittentFail (1/15 fails with 500).
Acceptance:
  - Upload validates type/size; intermittent fail reproducible with flag.
```

---

## CURSOR TASK 9/12 — UI scaffolding (Vite React + Router + Layout)

```text
In /ui create a Vite React TS app with:
  - react-router-dom, axios, react-hook-form, zod, date-fns
  - a simple design system (tokens: spacing, colors, shadows)
Add routes:
  / (PublicBoard placeholder)
  /login
  /citizen/requests, /citizen/requests/new
  /clerk/inbox
  /supervisor/assign
  /agent/my-tasks
  /admin/flags
Add a shared <AppLayout> with top nav and role badge (from /auth/me).
Acceptance:
  - `npm run dev` serves UI on 5173; routes render placeholders with headings.
```

---

## CURSOR TASK 9A — Install MUI + Theme + i18n toggle (NEW)

```text
In /ui:
- Install @mui/material @mui/icons-material @emotion/react @emotion/styled
- Install @mui/x-data-grid @mui/x-date-pickers
- Keep react-hook-form and zod for validation
Wrap <App/> with <ThemeProvider> + <CssBaseline>.
Add a BG/EN locale toggle in the top bar (store preference in localStorage).
Acceptance:
- App renders with MUI theme; toggling language flips a sample label (EN ↔ BG).
```

---

## CURSOR TASK 10/12 — DataTable + Wizard (ready for automation)

```text
Implement:
  - <DataTable> with sorting, column filters (dropdown), text search, pagination; props control; emits events.
  - <StepperWizard> with steps, next/back, onSubmit; shows validation errors.
  - Conventions: add stable selectors data-testid="cs-<page>-<element>" to all interactive elements.
Citizen pages:
  - /citizen/requests/new (Steps A1–A5): Category/Subcategory/Urgency, Details (title, description, checkbox), Location (autocomplete stub), Attachments (UI only, no upload yet), Review & Submit (calls API POST /requests, shows toast with code).
  - /citizen/requests (grid wired to GET /requests?createdBy=me)
Acceptance:
  - Wizard validates min/max; successful create shows toast & navigates to list; table supports sort/filter/search.
```

---

## CURSOR TASK 10A — Replace DataTable with MUI DataGrid (NEW)

```text
Replace the placeholder <DataTable> with a MUI DataGrid-based component:
- Props: rows, rowCount, loading, page, pageSize, sortModel, filterModel, onChange handlers.
- Enable server-side sorting/filtering/pagination (forward params to API).
- Add data-testid="cs-<page>-grid" on the grid root.
Wire /citizen/requests to GET /requests?createdBy=me.
Acceptance:
- Grid shows columns, sorts server-side, paginates; selectors present and stable.
```

---

## CURSOR TASK 11/12 — Clerk Inbox (split view) + Return for Info modal

```text
Implement /clerk/inbox:
  - Left: DataGrid bound to GET /requests?status=SUBMITTED|TRIAGED.
  - Right: Details panel with comments & attachments list.
  - Buttons: Classify (form with dropdowns), Duplicate Check (modal with table), Return for Info (modal with Reason dropdown + Message >=15).
Wire actions to POST /requests/:id/status.
Acceptance:
  - Status changes update the row; modal validations enforced.
```

---

## CURSOR TASK 11A — Citizen Wizard with MUI Stepper (NEW)

```text
Implement /citizen/requests/new using MUI:
- Step 1: Category/Subcategory/Urgency (Select/Radio)
- Step 2: Title/Description (TextField with helperText from zod)
- Step 3: Location (Autocomplete stub)
- Step 4: Attachments (file input + list UI, no API yet)
- Step 5: Review & Submit (POST /requests)
Use react-hook-form + zodResolver; disable Next until step valid.
Add data-testid for all inputs and buttons.
Acceptance:
- Per-step validation works; Submit creates a request and shows Snackbar with code.
```

---

## CURSOR TASK 12/12 — Admin Flags UI + Seed/Reset

```text
Implement /admin/flags:
  - Table of flags with toggles; PATCH on change.
  - Buttons: "Seed DB" (POST /admin/seed) and "Reset DB" (POST /admin/reset).
Show a visible indicator when API_Random500 or API_SlowRequests are ON.
Acceptance:
  - Toggling flags affects API behavior; seed/reset endpoints callable from UI.
```

---

## Quick manual verification commands

```bash
# API
cd api
npm run dev
curl http://localhost:3001/health
npx prisma migrate dev && npm run seed

# Auth
curl -X POST http://localhost:3001/api/v1/auth/register ...
curl -X POST http://localhost:3001/api/v1/auth/login ...
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/v1/auth/me

# Idempotency
curl -H "Idempotency-Key: 123" -X POST http://localhost:3001/api/v1/requests ...

# Flags
curl -X PATCH http://localhost:3001/api/v1/admin/flags/API_SlowRequests -H "Content-Type: application/json" -d '{ "value": true }'
```

---

### Notes
- If you later want **Docker Compose** (MailHog + volumes for uploads), we can add two short tasks (D1/D2) without changing the existing steps.
- For WebDriver, prefer role-based queries (e.g., `getByRole('button', { name: /Submit/i })`) and the `data-testid` we enforce above. DataGrid interactions should target headers by visible text and the root `role="grid"`.
