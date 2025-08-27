# 🏛️ City Services Portal

> **A complete municipal service request management system with QA testing capabilities**

## 🚀 **QUICK START**

### **Prerequisites:**
- Node.js 18+ installed
- npm package manager

### **Setup Instructions:**

1. **Clone and Navigate:**
```bash
git clone <repository-url>
cd city-services-portal
```

2. **Install Dependencies:**
```bash
# Install API dependencies
cd api
npm install

# Install UI dependencies  
cd ../ui
npm install
cd ..
```

3. **Start the Application:**

**Terminal 1 - API Server:**
```bash
cd api
npm run dev
```

**Terminal 2 - UI Development Server:**
```bash
cd ui
npm run dev
```

**🎉 That's it! The application is now running.**

## 🌐 **Access URLs**
- **Main App**: http://localhost:5173
- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 👥 **Demo Accounts**

| Role | Email | Password |
|------|-------|----------|
| 👤 Citizen | john@example.com | password123 |
| 👩‍💼 Clerk | mary.clerk@city.gov | password123 |
| 👨‍💼 Supervisor | supervisor@city.gov | password123 |
| 🚗 Field Agent | field.agent@city.gov | password123 |
| 🔧 Admin | admin@city.gov | password123 |

## 🔧 **Development Commands**

### **API Server (Port 3001):**
```bash
cd api
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

### **UI Development (Port 5173):**
```bash
cd ui
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🧪 **Testing Ready**

### **Feature Flags for Bug Simulation**
Login as admin → Feature Flags page → Toggle:
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

## 🏗️ **Architecture**

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

## 👥 **Role-Based Features**

- **👤 CITIZEN**: Submit requests, track status, upload files
- **👩‍💼 CLERK**: Triage requests, split-view inbox, status updates
- **👨‍💼 SUPERVISOR**: Task assignment, workflow management
- **🚗 FIELD_AGENT**: Field work, task completion
- **🔧 ADMIN**: Feature flags, database management

## ✅ **Key Features Implemented**

### ✨ **All 12 Requirements Complete**
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

### 🔍 **Quality Assurance Features**
- **Correlation IDs** for request tracking
- **Optimistic locking** for concurrent updates
- **Idempotency keys** for duplicate prevention
- **Comprehensive error handling** with structured responses
- **Health checks** and monitoring endpoints
- **Test data seeding** for consistent testing

## 📡 **API Endpoints**

Visit http://localhost:3001/api-docs for interactive documentation

### Core Endpoints
- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/requests` - List requests (filtering/sorting)
- `POST /api/v1/requests` - Create request
- `POST /api/v1/requests/:id/attachments` - Upload files
- `GET /api/v1/admin/flags` - Feature flags
- `POST /api/v1/admin/seed` - Seed database

## 🛠️ **Troubleshooting**

### **Common Issues:**

**Port conflicts:**
```bash
# Check what's running on ports
netstat -an | findstr :3001
netstat -an | findstr :5173

# Kill processes if needed
npx kill-port 3001
npx kill-port 5173
```

**Database issues:**
```bash
cd api
npm run db:reset    # Reset and reseed database
```

**Dependency issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**API not connecting:**
- Ensure API server is running on port 3001
- Check console for CORS errors
- Verify environment variables in `.env`

## 🔄 **Database Management**

The application uses SQLite with Prisma ORM:

```bash
cd api

# View database schema
npx prisma studio

# Reset database
npm run db:reset

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma db push
```

## 🌍 **Environment Configuration**

### **API (.env file in /api):**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3001
NODE_ENV=development
```

### **UI (.env file in /ui):**
```env
VITE_API_URL=http://localhost:3001/api/v1
```

---

**🎯 Complete municipal service management system ready for QA testing!**

**Perfect for automation, manual testing, demos, and development.**