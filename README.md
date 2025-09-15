# 🤖 AI in QA Demo Application

> **A comprehensive municipal service management system designed to showcase AI-powered Quality Assurance testing capabilities**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

## 🎯 **Purpose**

This application serves as a **comprehensive testing playground** for demonstrating AI-powered Quality Assurance tools and automated testing frameworks. It features a realistic municipal service request management system with complex workflows, multiple user roles, and extensive form interactions.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Git for version control

### **Installation Steps**
```bash
# 1. Clone the repository
git clone https://github.com/angelovstanton/ai-in-qa-demo-app.git
cd ai-in-qa-demo-app

# 2. Setup Backend API (Terminal 1)
cd city-services-portal/api
npm install

# Create local environment file from template
# Windows:
copy .env.example .env
# Mac/Linux:
# cp .env.example .env

npm run db:generate   # Generate Prisma client
npm run db:push       # Create database schema
npm run db:seed       # Seed with test data
npm run dev           # Start API server on port 3001

# 3. Setup Frontend UI (Terminal 2)
cd city-services-portal/ui
npm install
npm run dev           # Start UI server on port 5173
```

### **Access the Application**
- **🌐 Frontend**: http://localhost:5173
- **📚 API Docs**: http://localhost:3001/api-docs
- **🔍 Database Studio**: Run `npm run db:studio` in the API directory

### **Note on Environment Files**
- The repository includes `.env.example` with default configuration
- Your local `.env` file (created from the template) is gitignored for security
- No additional configuration needed for local development

## 🏗️ **Architecture Overview**

```
📦 AI in QA Demo App
├── 📁 city-services-portal/          # Main application
│   ├── 📂 api/                       # Node.js + Express + TypeScript backend
│   │   ├── prisma/                   # Database schema & seeds
│   │   ├── src/                      # Source code
│   │   │   ├── routes/               # API endpoints
│   │   │   ├── middleware/           # Auth, validation, feature flags
│   │   │   ├── services/             # Business logic
│   │   │   └── utils/                # Utilities & helpers
│   │   └── uploads/                  # File upload storage
│   ├── 📂 ui/                        # React + TypeScript frontend
│   │   ├── src/                      # Source code
│   │   │   ├── components/           # Reusable UI components
│   │   │   ├── pages/                # Page components by role
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── contexts/             # React contexts
│   │   │   └── types/                # TypeScript definitions
│   │   └── public/                   # Static assets
└── 📁 .github/                       # GitHub workflows & templates
```

## 👥 **User Roles & Capabilities**

| Role | Access Level | Primary Functions | Demo Account |
|------|-------------|-------------------|--------------|
| 👤 **Citizen** | Public | Submit requests, track status, upload attachments | `john@example.com` |
| 👩‍💼 **Clerk** | Internal | Triage requests, update status, manage inbox | `mary.clerk@city.gov` |
| 👨‍💼 **Supervisor** | Manager | Assign tasks, oversee workflow, approve actions | `supervisor@city.gov` |
| 🚐 **Field Agent** | Field | Complete assigned tasks, update progress | `field.agent@city.gov` |
| 🔧 **Admin** | System | Manage feature flags, system configuration | `admin@city.gov` |

**Password for all accounts**: `password123`

## 🧪 **QA Testing Features**

### **🐛 Feature Flags for Bug Simulation**
- `API_Random500` - Introduces 5% random server errors
- `UI_WrongDefaultSort` - Wrong default sorting behavior
- `API_SlowRequests` - Simulates 10% slow API responses  
- `API_UploadIntermittentFail` - Random upload failures

### **🎯 Comprehensive Test Selectors**
All interactive elements include `data-testid` attributes:
```typescript
// Authentication
"cs-login-email", "cs-login-password", "cs-login-submit"
"cs-registration-first-name", "cs-registration-email"

// Request Management
"cs-requests-create-button", "cs-citizen-requests-grid"
"cs-new-request-wizard", "cs-new-request-title"
"cs-inbox-request-list", "cs-inbox-triage-button"

// Admin Features
"cs-admin-flag-toggle-{flagName}"
"cs-admin-seed-database"
```

### **📝 Complex Form Interactions**
- **Multi-step Wizard**: 5-step request submission with validation
- **Dynamic Fields**: Add/remove contacts, permits, attachments
- **Conditional Logic**: Fields that appear based on selections
- **Advanced Validation**: Regex patterns, cross-field validation
- **File Uploads**: Image attachments with size/type validation

### **🔄 Workflow State Machine**
```
SUBMITTED → TRIAGED → IN_PROGRESS → RESOLVED → CLOSED
              ↓           ↓           ↓
           REJECTED  WAITING_ON_CITIZEN  ↓
                          ↑         REOPENED
                      IN_PROGRESS
```

## 💻 **Technology Stack**

### **Backend**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: Prisma ORM with SQLite (easily switchable)
- **Authentication**: JWT with role-based access control
- **Documentation**: OpenAPI/Swagger with interactive docs
- **Validation**: Zod schemas with detailed error messages
- **Logging**: Structured logging with correlation IDs

### **Frontend**
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) with custom theming
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router with role-based protection
- **Data Grid**: MUI X DataGrid with server-side operations
- **Build Tool**: Vite for fast development and builds

### **Infrastructure**
- **Containerization**: Docker with multi-stage builds
- **Development**: Hot reload for both frontend and backend
- **Database**: Automatic migrations and seeding
- **File Storage**: Local file system with organized structure

## 🎭 **Key Testing Scenarios**

### **🔐 Authentication & Authorization**
- User registration with comprehensive validation
- Login/logout flows with proper session management
- Role-based access control across all features
- Token expiration and refresh handling

### **📋 Form Interactions**
- Multi-step wizard with conditional fields
- Dynamic form arrays (add/remove items)
- File upload with drag-and-drop support
- Real-time validation with user feedback
- Auto-save and form recovery

### **🔍 Search & Filtering**
- **Dual Search Endpoints**: GET for simple queries, POST for complex searches
- **Advanced Filtering**: Geolocation, date ranges, citizen interactions
- **Real-time Suggestions**: Autocomplete for categories and locations
- **Export Capabilities**: CSV, JSON, and XLSX formats
- Debounced search with real-time results
- Multi-criteria filtering (status, priority, category)
- Sortable columns with server-side sorting
- Pagination with configurable page sizes

### **💾 Data Management**
- CRUD operations with optimistic locking
- Bulk operations and selections
- Export functionality (ready for implementation)
- Audit trails and change history

### **⚙️ Admin Features**
- Feature flag toggles with immediate effect
- Database seeding and reset capabilities
- System health monitoring
- User management (ready for extension)

## 📚 **API Documentation**

Full interactive API documentation available at: **http://localhost:3001/api-docs**

### **Core Endpoints**
```
Authentication
├── POST /api/v1/auth/login          # User authentication
├── POST /api/v1/auth/register       # User registration
└── GET  /api/v1/auth/me            # Current user profile

Service Requests
├── GET    /api/v1/requests          # List with filtering/sorting
├── POST   /api/v1/requests          # Create new request
├── GET    /api/v1/requests/:id      # Get specific request
├── PATCH  /api/v1/requests/:id      # Update request
└── POST   /api/v1/requests/:id/status # Change request status

Search & Export
├── GET    /api/v1/service-requests/search     # Simple search with query params
├── POST   /api/v1/service-requests/search     # Complex search with JSON body
├── GET    /api/v1/service-requests/search/suggestions # Search autocomplete
├── POST   /api/v1/service-requests/search/export     # Export results (CSV/JSON)
└── DELETE /api/v1/service-requests/search/cache      # Clear search cache

File Management
├── POST   /api/v1/requests/:id/attachments # Upload files
└── GET    /api/v1/attachments/:id         # Download files

Administration
├── GET    /api/v1/admin/flags       # Feature flags
├── POST   /api/v1/admin/flags       # Update feature flags
├── POST   /api/v1/admin/seed        # Seed database
└── GET    /api/v1/health           # System health check
```

## ✨ **Perfect for Testing**

### **Manual Testing**
- **Complex Workflows**: End-to-end user journeys
- **Cross-browser Compatibility**: Modern responsive design
- **Accessibility**: ARIA labels and keyboard navigation
- **Error Handling**: Comprehensive error states and messages

### **Automation Testing**
- **Stable Selectors**: Consistent `data-testid` attributes
- **API Testing**: RESTful endpoints with predictable responses
- **Database State**: Easy reset and seeding for test isolation
- **Feature Toggles**: Controllable error conditions

### **Performance Testing**
- **Load Simulation**: Feature flags for slow responses
- **File Uploads**: Large file handling capabilities
- **Database Operations**: Complex queries with pagination
- **Concurrent Users**: Multi-role simultaneous access

### **Security Testing**
- **Authentication**: JWT token handling and validation
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions


## 🛠️ **Development**

### **Database Management Commands**
```bash
cd city-services-portal/api

# Generate Prisma client
npm run db:generate

# Apply database schema
npm run db:push

# Seed with test data
npm run db:seed

# View database in browser
npm run db:studio

# Reset database (caution: deletes all data)
npm run db:reset
```

### **Development Scripts**

#### **Backend (API)**
```bash
cd city-services-portal/api
npm run dev          # Development server with hot reload
npm run build        # TypeScript compilation
npm run start        # Production server
npm run test         # Run tests
npm run lint         # Code linting
```

#### **Frontend (UI)**
```bash
cd city-services-portal/ui
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Code linting
npm run test         # Run tests
```

## 📊 **Testing Data**

The application comes pre-seeded with:
- **5 User Accounts** (one per role)
- **25+ Service Requests** in various states
- **Multiple Categories** of service types
- **Sample Comments** and status changes
- **Test Attachments** (placeholder files)

## 🤝 **Contributing**

This project is designed for QA demonstration purposes. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### **Code Standards**
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for git messages
- Comprehensive error handling
- Test coverage for new features

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 💬 **Support**

For questions, issues, or feature requests:
- **GitHub Issues**: Use the issue tracker
- **Documentation**: Check the `/docs` folder
- **API Docs**: http://localhost:3001/api-docs

## 🙏 **Acknowledgments**

Built with modern web technologies and best practices to provide a realistic testing environment for AI-powered QA tools.

---

**Made with ❤️ for the QA Community**