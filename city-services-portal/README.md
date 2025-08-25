# ?? City Services Portal

> **A complete municipal service request management system with QA testing capabilities**

## ? **INSTANT STARTUP (Docker)**

### **Windows Users:**
```cmd
# Option 1: Use the batch file
start-docker.bat

# Option 2: Use PowerShell
.\start-docker.ps1

# Option 3: Manual commands
docker-compose down -v
docker-compose up --build
```

### **Mac/Linux Users:**
```bash
cd city-services-portal
make start
# OR: docker-compose up --build
```

**?? That's it! Everything runs in one container.**

## ?? **Access URLs**
- **Main App**: http://localhost:5173
- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## ?? **Demo Accounts**
```bash
make demo  # Shows all demo accounts (Mac/Linux)
```

| Role | Email | Password |
|------|-------|----------|
| ?? Citizen | john@example.com | password123 |
| ????? Clerk | mary.clerk@city.gov | password123 |
| ????? Supervisor | supervisor@city.gov | password123 |
| ?? Field Agent | field.agent@city.gov | password123 |
| ?? Admin | admin@city.gov | password123 |

## ?? **Quick Commands**

### **Windows:**
```cmd
start-docker.bat     # ?? Start everything
stop-docker.bat      # ??  Stop everything
docker-compose logs -f  # ?? View logs
```

### **Mac/Linux:**
```bash
make start      # ?? Start everything
make stop       # ??  Stop everything  
make restart    # ?? Restart everything
make reset      # ???  Reset database
make logs       # ?? View logs
make health     # ??  Check health
make help       # ?? Show all commands
```

## ?? **Testing Ready**

### **Feature Flags for Bug Simulation**
Login as admin ? Feature Flags page ? Toggle:
- `API_Random500` - 5% random API errors
- `UI_WrongDefaultSort` - Wrong default sorting
- `API_SlowRequests` - 10% slow requests
- `API_UploadIntermittentFail` - Upload failures

### **Stable Test Selectors**
All elements have `data-testid` attributes:
```typescript
"cs-login-email", "cs-login-submit"
"cs-requests-create-button", "cs-citizen-requests-grid"
"cs-new-request-wizard", "cs-inbox-request-list"
"cs-admin-flag-toggle-{flagName}"
```

## ??? **Architecture**

### **Backend (Port 3001)**
- **Framework**: Node.js + Express + TypeScript
- **Database**: Prisma + SQLite (auto-seeded)
- **Auth**: JWT with role-based access control
- **Docs**: OpenAPI/Swagger at `/api-docs`
- **Features**: State machine, file uploads, feature flags

### **Frontend (Port 5173)**
- **Framework**: React + TypeScript + MUI
- **Components**: DataGrid, Stepper Wizard, Split Views
- **State**: React Context + Custom Hooks
- **Features**: Role-based navigation, form validation

## ?? **Role-Based Features**

- **?? CITIZEN**: Submit requests, track status, upload files
- **????? CLERK**: Triage requests, split-view inbox, status updates
- **????? SUPERVISOR**: Task assignment, workflow management
- **?? FIELD_AGENT**: Field work, task completion
- **?? ADMIN**: Feature flags, database management

## ?? **Key Features Implemented**

### ? **All 12 Requirements Complete**
1. **Monorepo Structure** - TypeScript API + React UI
2. **Prisma + SQLite** - Complete data model
3. **JWT Authentication** - 5 role system
4. **OpenAPI/Swagger** - Full API docs
5. **CRUD + Filtering** - Advanced search/sort/pagination
6. **State Machine** - Request status workflow
7. **Feature Flags** - Controlled bug simulation
8. **File Uploads** - Image attachments with validation
9. **MUI DataGrid** - Server-side data management
10. **Stepper Wizard** - Multi-step form with validation
11. **Split View** - Clerk inbox interface
12. **Admin Interface** - Feature flags + DB management

### ?? **Quality Assurance Features**
- **Correlation IDs** for request tracking
- **Optimistic locking** for concurrent updates
- **Idempotency keys** for duplicate prevention
- **Comprehensive error handling** with structured responses
- **Health checks** and monitoring endpoints
- **Test data seeding** for consistent testing

## ?? **API Endpoints**

Visit http://localhost:3001/api-docs for interactive documentation

### Core Endpoints
- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/requests` - List requests (filtering/sorting)
- `POST /api/v1/requests` - Create request
- `POST /api/v1/requests/:id/attachments` - Upload files
- `GET /api/v1/admin/flags` - Feature flags
- `POST /api/v1/admin/seed` - Seed database

## ?? **Docker Benefits**

- **? Zero Configuration** - Everything auto-configured
- **? Consistent Environment** - Same setup everywhere
- **? Database Persistence** - Data survives restarts
- **? Hot Reloading** - Available in dev mode
- **? Easy Reset** - Reset commands for fresh start
- **? Health Monitoring** - Built-in health checks

## ?? **Troubleshooting**

### **Windows:**
```cmd
# Stop everything
stop-docker.bat

# Reset and restart
docker-compose down -v
start-docker.bat

# View logs
docker-compose logs -f
```

### **Mac/Linux:**
```bash
# Port conflicts
make stop && make start

# Database issues  
make reset

# Container issues
make clean && make start

# View detailed logs
make logs
```

## ????? **Development Mode**

For hot-reload development without Docker:

### **Windows:**
```cmd
# Terminal 1 - API
cd city-services-portal\api
npm install
npm run dev

# Terminal 2 - UI
cd city-services-portal\ui
npm install
npm run dev
```

### **Mac/Linux:**
```bash
make dev  # Shows instructions for manual setup
```

---

**?? Complete municipal service management system ready for QA testing!**

**Perfect for automation, manual testing, demos, and development.**