---
description: 'AI in QA Demo Application - Municipal Service Management System'
applyTo: '**/*.js, **/*.ts, **/*.jsx, **/*.tsx, **/*.json, **/*.md'
---

# AI in QA Demo Application Instructions

Instructions for developing and maintaining a comprehensive municipal service management system designed specifically for demonstrating AI-powered Quality Assurance testing capabilities.

## Project Context
- **Purpose**: Testing playground for AI-powered QA tools and automated testing frameworks
- **Architecture**: Full-stack TypeScript application with React frontend and Node.js backend
- **Database**: Prisma ORM with SQLite for easy setup and testing
- **Authentication**: JWT-based with role-based access control (5 user roles)
- **Testing Focus**: Comprehensive test selectors, feature flags, and complex workflows
- **Deployment**: Docker containerization for consistent environments

## Core Technologies
- **Frontend**: React 18+ with TypeScript, Material-UI (MUI), Vite
- **Backend**: Node.js 18+ with Express, TypeScript, Prisma ORM
- **Database**: SQLite with Prisma (easily switchable to PostgreSQL/MySQL)
- **Authentication**: JWT with bcrypt password hashing
- **Documentation**: OpenAPI/Swagger for API documentation
- **Container**: Docker with multi-stage builds and development hot-reload

## User Roles & Access Levels
```typescript
enum UserRole {
  CITIZEN = 'CITIZEN',           // Submit and track service requests
  CLERK = 'CLERK',               // Process and manage requests
  SUPERVISOR = 'SUPERVISOR',     // Assign tasks and oversee workflow
  FIELD_AGENT = 'FIELD_AGENT',   // Complete field work and update status
  ADMIN = 'ADMIN'                // System configuration and feature flags
}
```

## Development Standards

### Code Quality
- Use TypeScript strictly with proper type definitions
- Follow functional programming patterns where appropriate
- Implement comprehensive error handling with structured responses
- Use ESLint and Prettier for consistent code formatting
- Write self-documenting code with meaningful variable names
- Include JSDoc comments for complex functions and components

### Testing Requirements
- **Test Selectors**: Every interactive element must have `data-testid` attribute
- **Test ID Format**: `cs-{page/section}-{element}-{action?}`
- **Examples**: `cs-login-email`, `cs-requests-create-button`, `cs-new-request-step-1`
- **Component Testing**: Use React Testing Library for component tests
- **API Testing**: Implement integration tests for all endpoints
- **E2E Testing**: Design workflows for Playwright/Cypress automation

### Security Standards
- Validate all inputs using Zod schemas on both frontend and backend
- Implement proper authentication middleware for protected routes
- Use role-based authorization checks for sensitive operations
- Hash passwords with bcrypt (minimum 12 rounds)
- Implement CORS properly for cross-origin requests
- Log security events with correlation IDs for tracking

### Database Patterns
- Use Prisma schema for type-safe database operations
- Implement optimistic locking for concurrent updates using version fields
- Create comprehensive seed data for testing scenarios
- Use transactions for operations that span multiple tables
- Implement soft deletes where appropriate for audit trails
- Include proper indexes for performance-critical queries

### API Design
- Follow RESTful conventions with proper HTTP methods and status codes
- Include correlation IDs in all responses for request tracking
- Implement structured error responses with consistent format
- Use OpenAPI/Swagger documentation for all endpoints
- Include proper pagination for list endpoints
- Implement idempotency keys for critical operations

### Feature Flag System
- **Purpose**: Simulate bugs and testing scenarios for QA demonstrations
- **Flags**: `API_Random500`, `UI_WrongDefaultSort`, `API_SlowRequests`, `API_UploadIntermittentFail`
- **Implementation**: Database-driven flags with real-time toggles
- **Usage**: Inject via middleware and React context for dynamic behavior

## Component Architecture

### React Components
- Use functional components with hooks exclusively
- Implement proper TypeScript interfaces for all props
- Include `data-testid` for every interactive element
- Use Material-UI components consistently with custom theme
- Implement proper loading states and error boundaries
- Create reusable components for common patterns

### State Management
- Use React Context for global state (authentication, theme)
- Implement custom hooks for API data fetching and caching
- Use React Hook Form with Zod validation for complex forms
- Keep local component state minimal and focused
- Implement optimistic updates for better user experience

### Form Handling
- Use React Hook Form with Zod validation schemas
- Implement multi-step wizards for complex workflows
- Include real-time validation with user-friendly error messages
- Support dynamic field arrays (add/remove items)
- Implement proper accessibility with ARIA labels and descriptions
- Include comprehensive test IDs for form automation

## Backend Architecture

### Express Application Structure
```
src/
??? routes/              # API endpoint definitions
??? middleware/          # Authentication, validation, feature flags
??? services/            # Business logic and external integrations
??? utils/               # Helper functions and utilities
??? config/              # Configuration and documentation
```

### Middleware Implementation
- **Authentication**: JWT validation with user context injection
- **Feature Flags**: Dynamic behavior injection for testing scenarios
- **Error Handling**: Structured error responses with correlation IDs
- **Logging**: Request/response logging with performance metrics
- **Validation**: Zod schema validation for all inputs

### Database Schema Design
- **Users**: Authentication and role management
- **ServiceRequests**: Core entity with status workflow
- **Comments**: Threaded discussions on requests
- **Attachments**: File uploads with metadata
- **EventLogs**: Audit trail for all state changes
- **FeatureFlags**: Dynamic configuration for testing

## Testing Implementation

### Test Automation Support
```typescript
// Test ID Patterns
const TestIds = {
  // Authentication
  LOGIN_EMAIL: 'cs-login-email',
  LOGIN_PASSWORD: 'cs-login-password',
  LOGIN_SUBMIT: 'cs-login-submit',
  
  // Request Management
  REQUESTS_CREATE: 'cs-requests-create-button',
  REQUESTS_GRID: 'cs-citizen-requests-grid',
  REQUEST_TITLE: 'cs-new-request-title',
  
  // Admin Features
  ADMIN_FLAG_TOGGLE: (flag: string) => `cs-admin-flag-toggle-${flag}`,
  ADMIN_SEED_DB: 'cs-admin-seed-database'
};
```

### Complex Testing Scenarios
- **Multi-step Forms**: 5-step request submission with conditional fields
- **Role-based Workflows**: Different user journeys per role
- **State Machine**: Request status transitions with validation
- **Search and Filtering**: Debounced search with real-time results
- **File Uploads**: Drag-and-drop with validation and progress
- **Error Conditions**: Feature flags for controlled error simulation

### Data Management for Testing
- Implement database seeding with consistent test data
- Provide reset functionality for test isolation
- Include demo accounts for each user role
- Generate realistic sample data for comprehensive testing
- Support test data cleanup and regeneration

## Quality Assurance Features

### Feature Flags for Bug Simulation
```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  category: 'API' | 'UI' | 'PERFORMANCE' | 'UPLOAD';
}

// Predefined flags for testing scenarios
const DEFAULT_FLAGS = [
  { name: 'API_Random500', description: 'Introduces 5% random server errors' },
  { name: 'UI_WrongDefaultSort', description: 'Wrong default sorting behavior' },
  { name: 'API_SlowRequests', description: 'Simulates 10% slow API responses' },
  { name: 'API_UploadIntermittentFail', description: 'Random file upload failures' }
];
```

### Workflow State Machine
```typescript
enum RequestStatus {
  SUBMITTED = 'SUBMITTED',
  TRIAGED = 'TRIAGED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CITIZEN = 'WAITING_ON_CITIZEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED'
}

// Valid state transitions for testing workflow scenarios
const VALID_TRANSITIONS = {
  SUBMITTED: ['TRIAGED', 'REJECTED'],
  TRIAGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'WAITING_ON_CITIZEN', 'REJECTED'],
  WAITING_ON_CITIZEN: ['IN_PROGRESS', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: [],
  REJECTED: []
};
```

## Performance Standards

### Frontend Optimization
- Implement code splitting with React.lazy and Suspense
- Use React.memo for expensive component re-renders
- Implement virtual scrolling for large data sets
- Optimize bundle size with tree shaking
- Use proper dependency arrays in useEffect hooks
- Implement proper loading states and skeleton screens

### Backend Optimization
- Use database query optimization with proper indexes
- Implement response caching for frequently accessed data
- Use connection pooling for database connections
- Implement request rate limiting for API protection
- Use compression middleware for response optimization
- Monitor and log performance metrics

## Deployment Standards

### Docker Configuration
- Multi-stage builds for production optimization
- Development configuration with hot reload
- Proper health checks and monitoring
- Volume management for data persistence
- Environment variable configuration
- Container security best practices

### Environment Management
- Separate configurations for development, staging, production
- Secure secret management (never commit secrets)
- Environment variable validation on startup
- Database migration handling in deployment
- Logging configuration per environment
- Feature flag environment-specific defaults

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public functions and components
- README files for each major module or feature
- API documentation using OpenAPI/Swagger
- Database schema documentation with entity relationships
- Testing documentation with example scenarios
- Deployment documentation with step-by-step instructions

### Testing Documentation
- Test scenario descriptions for manual testing
- Automation example scripts for different frameworks
- Test data requirements and setup instructions
- Feature flag usage guide for QA testing
- Performance testing guidelines and benchmarks
- Security testing checklists and procedures

## Implementation Guidelines

### New Feature Development
1. **Design**: Plan component architecture and data flow
2. **Backend**: Implement API endpoints with validation and tests
3. **Frontend**: Create components with proper TypeScript types
4. **Testing**: Add comprehensive test IDs and automation examples
5. **Documentation**: Update API docs and testing guides
6. **Feature Flags**: Consider controllable error scenarios
7. **Security**: Implement proper validation and authorization
8. **Performance**: Optimize for large datasets and concurrent users

### Bug Fixes and Maintenance
1. **Root Cause**: Identify and document the underlying issue
2. **Test Cases**: Create test cases that reproduce the bug
3. **Fix Implementation**: Implement fix with minimal side effects
4. **Regression Testing**: Ensure fix doesn't break existing functionality
5. **Documentation**: Update relevant documentation
6. **Monitoring**: Add logging/monitoring to prevent recurrence

## Quality Gates

### Code Review Checklist
- [ ] TypeScript compilation passes without errors
- [ ] All tests pass (unit, integration, e2e)
- [ ] Test IDs added for new interactive elements
- [ ] API documentation updated for endpoint changes
- [ ] Security review for authentication/authorization changes
- [ ] Performance impact assessed for data-heavy operations
- [ ] Accessibility compliance verified
- [ ] Error handling implemented and tested
- [ ] Logging added for debugging and monitoring
- [ ] Feature flags considered for testing scenarios

### Definition of Done
- [ ] Feature works as specified in all supported browsers
- [ ] Comprehensive test coverage with meaningful test IDs
- [ ] Documentation updated (code, API, testing guides)
- [ ] Security and performance requirements met
- [ ] Accessibility standards followed (WCAG 2.1 AA)
- [ ] Error scenarios handled gracefully
- [ ] Code reviewed and approved by team
- [ ] Integration testing completed
- [ ] Feature flag integration considered
- [ ] Demo/testing scenarios documented

This AI in QA Demo Application is designed to be the ultimate testing playground for demonstrating AI-powered Quality Assurance capabilities while maintaining enterprise-level code quality and modern development practices.