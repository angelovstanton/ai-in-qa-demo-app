# ??? Architecture Overview

## **System Architecture**

```
???????????????????????????????????????????????????????????
?                    AI in QA Demo App                    ?
???????????????????????????????????????????????????????????
                              ?
                    ?????????????????????
                    ?                   ?
            ?????????????????? ???????????????????
            ?   Frontend     ? ?    Backend      ?
            ?   (React)      ? ?   (Node.js)     ?
            ?   Port 5173    ? ?   Port 3001     ?
            ?????????????????? ???????????????????
                              ?
                    ?????????????????????
                    ?    Database       ?
                    ?    (SQLite)       ?
                    ?   + Prisma ORM    ?
                    ?????????????????????
```

## **?? Frontend Architecture**

### **Technology Stack**
- **React 18** with TypeScript
- **Material-UI (MUI)** component library
- **React Router** for navigation
- **React Hook Form** + Zod validation
- **Axios** for API communication
- **Vite** for build tooling

### **Component Structure**
```
src/
??? components/           # Reusable UI components
?   ??? AppLayout.tsx    # Main application layout
?   ??? DataTable.tsx    # Advanced data grid
?   ??? StepperWizard.tsx # Multi-step form wizard
?   ??? DashboardRedirect.tsx # Role-based routing
??? pages/               # Page components by feature
?   ??? LoginPage.tsx
?   ??? RegistrationPage.tsx
?   ??? RequestDetailPage.tsx
?   ??? citizen/         # Citizen-specific pages
?   ??? clerk/           # Clerk-specific pages
?   ??? supervisor/      # Supervisor-specific pages
?   ??? agent/           # Field agent pages
?   ??? admin/           # Admin pages
??? hooks/               # Custom React hooks
?   ??? useServiceRequests.ts
?   ??? useAdmin.ts
??? contexts/            # React context providers
?   ??? AuthContext.tsx
??? types/               # TypeScript type definitions
??? lib/                 # Utility libraries
??? theme/               # MUI theme configuration
```

### **State Management**
- **React Context** for global state (authentication)
- **React Hook Form** for form state
- **Custom Hooks** for API data fetching
- **Local Component State** for UI interactions

### **Key Features**
- **Role-based Navigation** - Different menus per user role
- **Real-time Validation** - Immediate feedback on form inputs
- **Responsive Design** - Mobile, tablet, desktop support
- **Test Selectors** - data-testid on all interactive elements

## **?? Backend Architecture**

### **Technology Stack**
- **Node.js 18+** with TypeScript
- **Express.js** web framework
- **Prisma ORM** for database operations
- **SQLite** database (easily switchable)
- **JWT** for authentication
- **Zod** for request validation
- **Swagger/OpenAPI** for documentation

### **Project Structure**
```
src/
??? routes/              # API endpoint definitions
?   ??? auth.ts         # Authentication endpoints
?   ??? requests.ts     # Service request CRUD
?   ??? admin.ts        # Admin functionality
?   ??? attachments.ts  # File upload handling
??? middleware/          # Express middleware
?   ??? auth.ts         # JWT authentication
?   ??? error.ts        # Error handling
?   ??? featureFlags.ts # Feature flag injection
??? services/            # Business logic
?   ??? featureFlags.ts # Feature flag management
??? utils/               # Helper functions
?   ??? statusMachine.ts # Request status workflow
?   ??? logger.ts       # Structured logging
??? config/              # Configuration
    ??? swagger.ts      # API documentation
```

### **Database Schema**
```sql
Users (id, name, email, role, passwordHash)
??? ServiceRequests (id, title, description, status, priority)
??? Comments (id, content, authorId, requestId)
??? Attachments (id, filename, fileSize, requestId)
??? EventLogs (id, type, payload, requestId)
??? Departments (id, name, slug)
??? FeatureFlags (id, name, enabled, description)
```

### **API Design**
- **RESTful** endpoints with standard HTTP methods
- **JSON** request/response format
- **OpenAPI 3.0** specification
- **Structured Error** responses with correlation IDs
- **Role-based Access Control** on all endpoints

## **?? Security Architecture**

### **Authentication Flow**
```
1. User submits credentials
2. Server validates against database
3. JWT token generated with user info + role
4. Token stored in localStorage (client)
5. Token sent in Authorization header
6. Server validates token on protected routes
7. User context populated in request
```

### **Authorization Levels**
- **Public** - No authentication required
- **Authenticated** - Valid JWT token required
- **Role-based** - Specific roles required for actions

### **Security Features**
- **Password Hashing** with bcrypt
- **JWT Expiration** (1 hour default)
- **Input Validation** with Zod schemas
- **SQL Injection Prevention** via Prisma ORM
- **File Upload Security** with type/size validation
- **CORS Configuration** for cross-origin requests

## **?? Data Flow**

### **Request Lifecycle**
```
1. Citizen submits request via form
2. Frontend validates data locally
3. API receives and validates request
4. Database stores request with SUBMITTED status
5. Clerk triages request (SUBMITTED ? TRIAGED)
6. Supervisor assigns to field agent (TRIAGED ? IN_PROGRESS)
7. Field agent completes work (IN_PROGRESS ? RESOLVED)
8. Citizen/Clerk closes request (RESOLVED ? CLOSED)
```

### **Real-time Updates**
- **Polling** for status updates (configurable interval)
- **Event Logging** for audit trail
- **Optimistic Updates** for better UX
- **Error Recovery** with retry mechanisms

## **??? Feature Flag System**

### **Architecture**
```
FeatureFlags Table
??? API_Random500           # Simulates server errors
??? UI_WrongDefaultSort     # UI behavior changes
??? API_SlowRequests        # Performance simulation
??? API_UploadIntermittentFail # Upload failures
```

### **Implementation**
- **Database-driven** feature flags
- **Real-time toggles** via admin interface
- **Middleware injection** for API effects
- **Component-level** feature detection

## **?? Container Architecture**

### **Docker Configuration**
```
Dockerfile (Multi-stage)
??? Stage 1: Node.js base image
??? Stage 2: Install dependencies
??? Stage 3: Build application
??? Stage 4: Production runtime

docker-compose.yml
??? Single container for simplicity
??? Volume mounts for development
??? Environment variable injection
??? Health check configuration
```

### **Development vs Production**
- **Development**: Hot reload, debug mode, verbose logging
- **Production**: Optimized builds, minimal logging, security headers

## **?? Monitoring & Observability**

### **Logging Strategy**
- **Structured JSON** logs with correlation IDs
- **Request/Response** logging for API calls
- **Error Tracking** with stack traces
- **Performance Metrics** for slow operations

### **Health Checks**
- **Database Connectivity** checks
- **API Endpoint** availability
- **File System** access verification
- **Memory/CPU** usage monitoring

## **?? Development Workflow**

### **Local Development**
```
1. Clone repository
2. Install dependencies (npm install)
3. Setup database (Prisma generate/push/seed)
4. Start development servers
5. Access application + API docs
```

### **Database Migrations**
```
1. Modify schema.prisma
2. Generate migration (prisma migrate dev)
3. Apply to database (prisma db push)
4. Update seed data if needed
5. Regenerate client (prisma generate)
```

### **Testing Strategy**
- **Unit Tests** for individual functions
- **Integration Tests** for API endpoints
- **End-to-End Tests** for user workflows
- **Visual Regression Tests** for UI components

## **?? Deployment Architecture**

### **Build Process**
```
1. Install dependencies
2. Run TypeScript compilation
3. Build React application
4. Generate Prisma client
5. Create Docker image
6. Deploy container
```

### **Environment Configuration**
- **Environment Variables** for configuration
- **Config Files** for complex settings
- **Secret Management** for sensitive data
- **Feature Flags** for runtime behavior

**?? Designed for scalability, testability, and maintainability!**