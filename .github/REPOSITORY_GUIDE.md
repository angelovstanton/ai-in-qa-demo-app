# ?? AI in QA Demo Application - GitHub Repository Guide

## ?? **Repository Overview**

This repository contains a comprehensive **Municipal Service Management System** specifically designed as a testing playground for **AI-powered Quality Assurance tools** and automated testing frameworks.

### **?? Primary Purpose**
- Demonstrate advanced testing scenarios for AI-powered QA tools
- Provide a realistic application with complex user workflows
- Showcase modern web development best practices
- Enable comprehensive testing training and demonstrations

## ??? **Project Structure**

```
ai-in-qa-demo-app/
??? ?? city-services-portal/          # Main application
?   ??? ?? api/                       # Backend (Node.js + TypeScript)
?   ?   ??? ?? prisma/               # Database schema & migrations
?   ?   ??? ?? src/                  # Source code
?   ?   ?   ??? ?? routes/           # API endpoints
?   ?   ?   ??? ?? middleware/       # Auth, validation, logging
?   ?   ?   ??? ?? services/         # Business logic
?   ?   ?   ??? ?? utils/            # Helper functions
?   ?   ??? ?? uploads/              # File storage
?   ??? ?? ui/                       # Frontend (React + TypeScript)
?   ?   ??? ?? src/                  # Source code
?   ?   ?   ??? ?? components/       # Reusable UI components
?   ?   ?   ??? ?? pages/            # Page components
?   ?   ?   ??? ?? hooks/            # Custom React hooks
?   ?   ?   ??? ?? contexts/         # React contexts
?   ?   ?   ??? ?? types/            # TypeScript definitions
?   ?   ??? ?? public/               # Static assets
?   ??? ?? docker/                   # Container configuration
??? ?? .github/                      # GitHub workflows & templates
??? ?? README.md                     # Main documentation
??? ?? .gitignore                    # Git ignore rules
??? ?? LICENSE                       # MIT license
```

## ?? **Getting Started**

### **Prerequisites**
- **Node.js** 18+ and npm
- **Docker Desktop** (recommended)
- **Git** for version control

### **Quick Setup**

#### Option 1: Docker (Recommended)
```bash
# Clone repository
git clone https://github.com/angelovstanton/ai-in-qa-demo-app.git
cd ai-in-qa-demo-app/city-services-portal

# Start with Docker
./start-docker.bat    # Windows
make start            # Mac/Linux
```

#### Option 2: Local Development
```bash
# Backend setup
cd city-services-portal/api
npm install
npm run db:generate && npm run db:push && npm run db:seed
npm run dev

# Frontend setup (new terminal)
cd city-services-portal/ui
npm install
npm run dev
```

**?? Application Access**: http://localhost:5173

## ?? **Demo User Accounts**

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| ?? Citizen | `john@example.com` | `password123` | Submit & track requests |
| ????? Clerk | `mary.clerk@city.gov` | `password123` | Process & manage requests |
| ????? Supervisor | `supervisor@city.gov` | `password123` | Assign & oversee work |
| ?? Field Agent | `field.agent@city.gov` | `password123` | Complete field tasks |
| ?? Admin | `admin@city.gov` | `password123` | System configuration |

## ?? **QA Testing Features**

### **??? Feature Flags for Bug Simulation**
The application includes controllable feature flags for testing error conditions:

- **`API_Random500`** - Introduces 5% random server errors
- **`UI_WrongDefaultSort`** - Causes incorrect default sorting
- **`API_SlowRequests`** - Simulates 10% slow API responses
- **`API_UploadIntermittentFail`** - Random file upload failures

**Access**: Login as admin ? Feature Flags page

### **??? Test Automation Ready**
Every interactive element includes `data-testid` attributes:

```typescript
// Authentication selectors
"cs-login-email", "cs-login-password", "cs-login-submit"
"cs-registration-first-name", "cs-registration-email"

// Request management selectors
"cs-requests-create-button", "cs-citizen-requests-grid"
"cs-new-request-wizard", "cs-new-request-title"
"cs-inbox-request-list", "cs-inbox-triage-button"

// Admin selectors
"cs-admin-flag-toggle-API_Random500"
"cs-admin-seed-database"
```

### **?? Complex Testing Scenarios**

#### **Multi-Step Forms**
- 5-step request submission wizard
- Dynamic field arrays (add/remove items)
- Conditional field visibility
- Real-time validation feedback
- Cross-field validation rules

#### **Workflow State Machine**
```
SUBMITTED ? TRIAGED ? IN_PROGRESS ? RESOLVED ? CLOSED
              ?           ?           ?
           REJECTED  WAITING_ON_CITIZEN  ?
                          ?         REOPENED
                      IN_PROGRESS
```

#### **Advanced Search & Filtering**
- Debounced search (500ms delay)
- Multi-criteria filtering
- Server-side sorting and pagination
- Real-time result updates

## ??? **Technology Stack**

### **Backend Technologies**
- **Node.js 18+** with TypeScript
- **Express.js** framework
- **Prisma ORM** with SQLite database
- **JWT Authentication** with role-based access
- **OpenAPI/Swagger** documentation
- **Zod** validation schemas

### **Frontend Technologies**
- **React 18** with TypeScript
- **Material-UI (MUI)** component library
- **React Hook Form** with validation
- **React Router** with protected routes
- **Vite** build tool
- **Axios** for API communication

### **Development Tools**
- **Docker** containerization
- **ESLint + Prettier** code formatting
- **TypeScript** for type safety
- **Hot reload** development servers

## ?? **Development Workflow**

### **Local Development**
```bash
# Start development servers
cd city-services-portal/api && npm run dev     # Backend on :3001
cd city-services-portal/ui && npm run dev      # Frontend on :5173
```

### **Database Management**
```bash
cd city-services-portal/api

# View database in browser
npm run db:studio

# Reset database with fresh data
npm run db:reset

# Apply schema changes
npm run db:push
```

### **Docker Development**
```bash
# Start everything
docker-compose up --build

# View logs
docker-compose logs -f

# Reset with fresh data
docker-compose down -v && docker-compose up --build
```

## ?? **API Documentation**

**Interactive Documentation**: http://localhost:3001/api-docs

### **Key Endpoints**
```
?? Authentication
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
GET  /api/v1/auth/me            # Current user profile

?? Service Requests
GET    /api/v1/requests          # List requests (with filtering)
POST   /api/v1/requests          # Create new request
GET    /api/v1/requests/:id      # Get specific request
PATCH  /api/v1/requests/:id      # Update request details
POST   /api/v1/requests/:id/status # Change request status

?? File Management
POST /api/v1/requests/:id/attachments # Upload files
GET  /api/v1/attachments/:id          # Download files

?? Administration
GET  /api/v1/admin/flags         # Get feature flags
POST /api/v1/admin/flags         # Update feature flags
POST /api/v1/admin/seed          # Seed database
GET  /api/v1/health             # System health check
```

## ?? **Testing Applications**

### **Manual Testing**
- **User Journey Testing**: Complete workflows from request submission to resolution
- **Cross-browser Testing**: Modern responsive design
- **Accessibility Testing**: ARIA labels and keyboard navigation
- **Error Handling**: Comprehensive error states and user feedback

### **Automated Testing**
- **End-to-End Testing**: Full user workflows with Playwright/Cypress
- **API Testing**: RESTful endpoints with predictable responses
- **Unit Testing**: Component and function testing
- **Integration Testing**: Database and service integration

### **Performance Testing**
- **Load Testing**: Concurrent user simulation
- **Stress Testing**: High-volume request processing
- **File Upload Testing**: Large file handling
- **Database Performance**: Complex query optimization

### **Security Testing**
- **Authentication Testing**: JWT token validation
- **Authorization Testing**: Role-based access control
- **Input Validation**: XSS and injection prevention
- **File Upload Security**: Type and size restrictions

## ?? **Deployment Options**

### **Development**
```bash
# Local development servers
npm run dev  # Both frontend and backend

# Docker development
docker-compose up --build
```

### **Production**
```bash
# Build for production
npm run build  # Frontend build
npm start      # Production server

# Docker production
docker-compose -f docker-compose.prod.yml up --build
```

## ?? **Contributing**

### **Development Setup**
1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make your changes
5. Add tests for new features
6. Submit a pull request

### **Code Standards**
- **TypeScript** for type safety
- **ESLint + Prettier** for consistent formatting
- **Conventional Commits** for git messages
- **Test Coverage** for new features
- **Documentation** for new APIs

### **Testing Requirements**
- Unit tests for new functions
- Integration tests for API endpoints
- E2E tests for new user workflows
- Test data that doesn't break existing scenarios

## ?? **Repository Statistics**

- **Languages**: TypeScript (85%), JavaScript (10%), Other (5%)
- **Components**: 50+ React components
- **API Endpoints**: 25+ RESTful endpoints
- **Database Tables**: 8 main entities
- **Test Selectors**: 100+ data-testid attributes
- **User Roles**: 5 distinct access levels

## ????? **Support & Documentation**

### **Getting Help**
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Community Q&A and ideas
- **API Docs**: http://localhost:3001/api-docs
- **README**: Comprehensive setup and usage guide

### **Documentation Structure**
```
?? Documentation
??? README.md                    # Main documentation
??? city-services-portal/README.md # Application-specific guide
??? .github/REPOSITORY_GUIDE.md  # This file
??? API Documentation            # Interactive Swagger docs
??? Code Comments               # Inline documentation
```

## ?? **Project Goals**

### **Primary Objectives**
1. **Demonstrate AI-powered QA capabilities**
2. **Provide realistic testing scenarios**
3. **Showcase modern web development practices**
4. **Enable comprehensive testing education**

### **Secondary Benefits**
- **Portfolio showcase** for developers
- **Learning platform** for new technologies
- **Testing playground** for QA professionals
- **Reference implementation** for best practices

## ?? **License & Usage**

- **License**: MIT License (see LICENSE file)
- **Usage**: Free for educational and demonstration purposes
- **Modification**: Encourage customization for specific testing needs
- **Attribution**: Credit appreciated but not required

---

**?? Ready to explore AI-powered Quality Assurance with a comprehensive, realistic application!**

**Made with ?? for the QA and Development Communities**