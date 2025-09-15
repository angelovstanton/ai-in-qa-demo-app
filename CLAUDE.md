# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (API) - Port 3001
```bash
cd city-services-portal/api
npm run dev          # Development with hot reload
npm run build        # TypeScript compilation
npm run start        # Production server
npm run db:push      # Apply schema changes
npm run db:seed      # Seed database with test data
npm run db:studio    # Visual database browser
npm run db:generate  # Generate Prisma client
npm run db:reset     # Reset and reseed database
```

### Frontend (UI) - Port 5173
```bash
cd city-services-portal/ui
npm run dev          # Development server with hot reload
npm run build        # Production build with TypeScript check
npm run lint         # Code linting
npm run preview      # Preview production build
```

### Quick Start
```bash
# Terminal 1 - API
cd city-services-portal/api
npm install
copy .env.example .env  # Windows: Create environment file
# cp .env.example .env  # Mac/Linux
npm run db:generate
npm run db:push
npm run db:seed
npm run dev

# Terminal 2 - UI
cd city-services-portal/ui
npm install
npm run dev
```

## Architecture Overview

**Monorepo Structure**: Full-stack municipal service management system designed as a comprehensive testing playground for AI-powered QA tools.

### Technology Stack
- **Backend**: Node.js + Express + TypeScript + Prisma (SQLite) + JWT auth
- **Frontend**: React 18 + TypeScript + Vite + Material-UI v5
- **Database**: Prisma ORM with SQLite, seeded with comprehensive test data
- **Authentication**: JWT with role-based access control (5 roles: CITIZEN, CLERK, SUPERVISOR, FIELD_AGENT, ADMIN)

### Key Directories
```
city-services-portal/
├── api/src/routes/      # API endpoints by feature
├── api/src/services/    # Business logic layer
├── api/src/middleware/  # Auth, validation, feature flags
├── api/prisma/          # Database schema and seeds
├── ui/src/components/   # Reusable UI components
├── ui/src/pages/        # Page components organized by role
├── ui/src/contexts/     # React contexts (Auth, Features, Language)
├── ui/src/hooks/        # Custom React hooks
└── ui/src/__tests__/    # Component and integration tests
```

## Important URLs
- **Main App**: http://localhost:5173
- **API Docs**: http://localhost:3001/api-docs (Interactive Swagger)
- **Health Check**: http://localhost:3001/health
- **Database Studio**: `npm run db:studio` (opens browser)

## Testing & Quality Assurance

### Test Framework
- **React Testing Library + Jest** for UI components
- **Test Location**: `ui/src/__tests__/`
- **Test IDs**: Comprehensive `data-testid` system with "cs-" prefix

### Demo Accounts (Password: `password123`)
- **Citizen**: `john@example.com` - Submit/track requests
- **Admin**: `admin@city.gov` - Feature flags, system config
- **Clerk**: `mary.clerk@city.gov` - Process requests in split-view
- **Supervisor**: `supervisor1@city.gov` - Staff performance, quality reviews, department metrics
- **Field Agent**: `agent1@city.gov` - Field service tasks and updates

### Feature Flags for Bug Simulation
Access at `/admin/flags`:
- `API_Random500` - 5% random server errors
- `UI_WrongDefaultSort` - Wrong default sorting
- `API_SlowRequests` - 10% slow responses
- `API_UploadIntermittentFail` - Upload failures

## Development Patterns

### Form Validation (MANDATORY)
All forms must implement:
- Zod schema validation with security measures
- Real-time validation with 300ms debouncing
- Input sanitization for XSS prevention
- ARIA attributes for accessibility

### API Response Format
```json
{
  "data": {},
  "correlationId": "req_timestamp_random",
  "pagination": {}
}
```

### Security Requirements
- JWT authentication with role-based authorization
- Server-side Zod validation on all inputs
- Rate limiting (5 attempts per minute on forms)
- Input sanitization for XSS prevention

## Database Management
- **ORM**: Prisma with SQLite
- **Schema**: `api/prisma/schema.prisma`
- **Seeded Data**: 25+ service requests across all statuses, 5 demo users
- **Studio**: Visual browser for database inspection

## Key Features Implemented
- **Service Request Management**: 7-state workflow with file attachments
- **Multi-step Forms**: 5-step wizard with comprehensive validation
- **DataGrid**: Server-side operations (sorting, filtering, pagination)
- **Split View**: Clerk inbox with request details
- **Real-time Search**: Debounced search with server filtering
- **File Uploads**: Drag-and-drop with progress and validation

## Build & Deployment
- **Development**: Vite dev server + tsx watch for hot reload
- **Production**: TypeScript compilation + static build
- **Database**: SQLite for simplicity, easily switchable via Prisma