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
- **Validation**: Comprehensive form validation with Zod schemas and security measures
- **Internationalization**: Full i18n support with Bulgarian and English translations
- **Accessibility**: WCAG 2.1 AA compliance with comprehensive accessibility features
- **Content Moderation**: AI-powered content analysis and moderation system

## Core Technologies
- **Frontend**: React 18+ with TypeScript, Material-UI (MUI), Vite
- **Backend**: Node.js 18+ with Express, TypeScript, Prisma ORM
- **Database**: SQLite with Prisma (easily switchable to PostgreSQL/MySQL)
- **Authentication**: JWT with bcrypt password hashing and account lockout
- **Validation**: Zod schemas with real-time validation and sanitization
- **Documentation**: OpenAPI/Swagger for API documentation
- **Container**: Docker with multi-stage builds and development hot-reload
- **Testing**: Comprehensive test coverage with React Testing Library and Jest
- **Accessibility**: Full WCAG 2.1 AA compliance with ARIA support
- **Internationalization**: Complete i18n with language switching

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

## Enhanced Application Features

### Core Service Request Management
- **Multi-step Request Wizard**: 5-step form with conditional fields and validation
- **Status Workflow**: Complete state machine with 7 status states
- **File Attachments**: Secure image upload with drag-and-drop support
- **Location Services**: Address input with geocoding preparation
- **Comments System**: Public and internal comments with role-based visibility
- **Upvoting System**: Community engagement with request prioritization
- **Search & Filtering**: Advanced search with real-time results and debouncing

### Advanced User Features
- **Community Ranklist**: Gamified leaderboard with badges and achievement system
- **Resolved Cases Tracking**: Historical view with satisfaction ratings
- **Public Request Board**: Community visibility of public service requests
- **Profile Management**: Comprehensive user profiles with preferences
- **Request Editing**: Time-limited editing with optimistic locking
- **Multi-language Support**: Full internationalization with EN/BG language switching

### Administrative & Security Features
- **Feature Flag System**: Dynamic configuration for testing scenarios
- **Content Moderation**: AI-powered content analysis with spam/hate speech detection
- **Security Monitoring**: XSS prevention, input sanitization, and rate limiting
- **Admin Dashboard**: System management with database seeding and monitoring
- **Audit Logging**: Comprehensive logging for all administrative actions
- **Account Security**: Login attempt tracking, account lockout, and security measures

### Accessibility & UX Features
- **WCAG 2.1 AA Compliance**: Full accessibility support with ARIA attributes
- **Keyboard Navigation**: Complete keyboard accessibility throughout the application
- **Screen Reader Support**: Comprehensive screen reader announcements and descriptions
- **High Contrast Mode**: Support for high contrast and reduced motion preferences
- **Focus Management**: Proper focus trapping and management in modals and forms
- **Color Accessibility**: Validated color contrast ratios and alternative indicators

## Development Standards

### Code Quality
- Use TypeScript strictly with proper type definitions
- Follow functional programming patterns where appropriate
- Implement comprehensive error handling with structured responses
- Use ESLint and Prettier for consistent code formatting
- Write self-documenting code with meaningful variable names
- Include JSDoc comments for complex functions and components

### Form Validation Requirements (MANDATORY)
All forms must implement comprehensive validation with these standards:

#### Required Validation Framework
```typescript
// Mandatory imports for all forms
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ValidationPatterns, ErrorMessages, formatErrorMessage } from '../utils/validation';

// All forms MUST implement:
// 1. Zod schema validation with comprehensive rules
// 2. Real-time validation with debounced feedback (300ms)
// 3. Input sanitization for XSS prevention
// 4. Comprehensive error messages for all scenarios
// 5. Accessibility support with ARIA attributes
// 6. Security measures (rate limiting, content filtering)
```

#### Core Validation Patterns (Use These Standards)
```typescript
// Email validation (comprehensive)
email: z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email format is invalid'),

// Password validation (security requirements)
password: z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain: uppercase letter, lowercase letter, number, and special character'
  ),

// Name validation (unicode support)
name: z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(
    /^[a-zA-ZÀ-ÿ\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .transform((name) => name.trim()),

// Text content validation (XSS prevention)
safeText: z.string()
  .transform((text) => text.trim())
  .refine(
    (text) => !/<script|javascript:|on\w+=/i.test(text),
    'Text contains potentially harmful content'
  ),
```

#### Required Security Measures
```typescript
// Input sanitization (mandatory for all text inputs)
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// XSS prevention validation
const preventXSS = (content: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
  ];
  return !xssPatterns.some(pattern => pattern.test(content));
};

// Rate limiting for form submissions (mandatory)
const useRateLimit = (maxAttempts: number = 5, timeWindow: number = 60000) => {
  // Implementation required for all forms
};
```

### Testing Requirements
- **Test Selectors**: Every interactive element must have `data-testid` attribute
- **Test ID Format**: `cs-{page/section}-{element}-{action?}`
- **Examples**: `cs-login-email`, `cs-requests-create-button`, `cs-new-request-step-1`
- **Validation Testing**: Test IDs for all validation states and error messages
- **Component Testing**: Use React Testing Library for component tests
- **API Testing**: Implement integration tests for all endpoints
- **E2E Testing**: Design workflows for Playwright/Cypress automation
- **Accessibility Testing**: Test keyboard navigation and screen reader compatibility

### Enhanced Test ID Patterns
```typescript
const TestIds = {
  // Form elements
  FORM_INPUT: (name: string) => `cs-form-${name}`,
  FORM_SUBMIT: 'cs-form-submit',
  FORM_ERROR: 'cs-form-error',
  FORM_SUCCESS: 'cs-form-success',
  
  // Validation feedback
  FIELD_ERROR: (name: string) => `cs-field-error-${name}`,
  CHAR_COUNT: (name: string) => `cs-char-count-${name}`,
  PASSWORD_STRENGTH: 'cs-password-strength',
  
  // Authentication
  LOGIN_EMAIL: 'cs-login-email',
  LOGIN_PASSWORD: 'cs-login-password',
  LOGIN_SUBMIT: 'cs-login-submit',
  
  // Registration
  REGISTRATION_FORM: 'cs-registration-form',
  REGISTRATION_FIRST_NAME: 'cs-registration-first-name',
  REGISTRATION_EMAIL: 'cs-registration-email',
  REGISTRATION_SUBMIT: 'cs-registration-submit',
  
  // Service requests
  REQUEST_TITLE: 'cs-request-title',
  REQUEST_DESCRIPTION: 'cs-request-description',
  REQUEST_CATEGORY: 'cs-request-category',
  REQUEST_SUBMIT: 'cs-request-submit',
  
  // Admin features
  ADMIN_FLAG_TOGGLE: (flag: string) => `cs-admin-flag-toggle-${flag}`,
  ADMIN_SEED_DB: 'cs-admin-seed-database',
  
  // Content moderation
  CONTENT_MODERATION_PAGE: 'cs-content-moderation-page',
  CONTENT_MODERATION_TABLE: 'cs-flagged-content-table',
  MODERATION_ACTION: (action: string) => `cs-moderation-${action}`,
  
  // Accessibility
  SCREEN_READER_TEXT: 'cs-sr-text',
  FOCUS_TRAP: 'cs-focus-trap',
  
  // Internationalization
  LANGUAGE_SWITCHER: 'cs-language-switcher',
  LANGUAGE_OPTION: (lang: string) => `cs-language-${lang}`,
};
```

### Security Standards
- Validate all inputs using Zod schemas on both frontend and backend
- Implement proper authentication middleware for protected routes
- Use role-based authorization checks for sensitive operations
- Hash passwords with bcrypt (minimum 12 rounds)
- Implement CORS properly for cross-origin requests
- Log security events with correlation IDs for tracking
- **Mandatory input sanitization for all user inputs**
- **XSS prevention in all text fields and rich content**
- **Rate limiting for all form submissions**
- **Content Security Policy (CSP) headers**
- **Content moderation for user-generated content**
- **Account lockout after failed login attempts**

### Database Patterns
- Use Prisma schema for type-safe database operations
- Implement optimistic locking for concurrent updates using version fields
- Create comprehensive seed data for testing scenarios
- Use transactions for operations that span multiple tables
- Implement soft deletes where appropriate for audit trails
- Include proper indexes for performance-critical queries
- **Enhanced user profile fields for comprehensive testing**
- **Upvoting system for community engagement**
- **Content moderation audit trails**

### API Design
- Follow RESTful conventions with proper HTTP methods and status codes
- Include correlation IDs in all responses for request tracking
- Implement structured error responses with consistent format
- Use OpenAPI/Swagger documentation for all endpoints
- Include proper pagination for list endpoints
- Implement idempotency keys for critical operations
- **Validate all inputs with Zod schemas on the server side**
- **Return validation errors in a structured format**
- **Implement content moderation endpoints**
- **Add ranking and leaderboard APIs**

### Feature Flag System
- **Purpose**: Simulate bugs and testing scenarios for QA demonstrations
- **Flags**: `API_Random500`, `UI_WrongDefaultSort`, `API_SlowRequests`, `API_UploadIntermittentFail`
- **Implementation**: Database-driven flags with real-time toggles
- **Usage**: Inject via middleware and React context for dynamic behavior
- **Admin Management**: Full CRUD operations with validation and audit logging

## Component Architecture

### React Components
- Use functional components with hooks exclusively
- Implement proper TypeScript interfaces for all props
- Include `data-testid` for every interactive element
- Use Material-UI components consistently with custom theme
- Implement proper loading states and error boundaries
- Create reusable components for common patterns
- **Mandatory comprehensive form validation for all input components**
- **Full accessibility support with ARIA attributes**
- **Internationalization support with translation keys**

### Advanced Component Library
```typescript
// Enhanced UI Components
- ValidatedTextField      // Real-time validation with accessibility
- ValidatedSelect        // Dropdown with proper error handling
- ValidatedDatePicker    // Date selection with range validation
- PasswordField          // Password input with strength meter
- ImageUpload           // Drag-and-drop file upload with security
- LocationPicker        // Address input with geocoding
- MapView              // Interactive map display
- DataTable            // Enhanced data grid with server-side operations
- LanguageSwitcher     // Language toggle with flag icons
- AccessibilityWrapper // WCAG compliance wrapper

// Specialized Components
- RequestWizard        // Multi-step form with validation
- CommentSystem       // Threaded comments with moderation
- UpvoteButton        // Community engagement component
- StatusBadge         // Request status with color coding
- UserRanking         // Leaderboard display
- ContentModerator    // Content analysis and moderation
- FeatureFlagToggle   // Admin feature flag management
```

### Form Component Standards
```typescript
// All form components must follow this enhanced pattern
function FormComponent() {
  // 1. Define comprehensive validation schema with i18n
  const { t } = useLanguage();
  const validationSchema = z.object({
    email: ValidationPatterns.email.refine(
      async (email) => await checkEmailUniqueness(email),
      { message: t('validation.email-taken') }
    ),
    password: ValidationPatterns.password,
    // Add custom validation as needed
  });

  // 2. Setup form with validation and accessibility
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  // 3. Implement security and accessibility measures
  const { isBlocked, checkRateLimit } = useRateLimit(5, 60000);
  const { announceToScreenReader } = useAccessibility();

  // 4. Form submission with comprehensive error handling
  const onSubmit = async (data) => {
    if (!checkRateLimit()) {
      announceToScreenReader(t('validation.rate-limited'), 'assertive');
      return;
    }
    
    // Sanitize all inputs before submission
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === 'string' 
        ? sanitizeInput(data[key]) 
        : data[key];
      return acc;
    }, {});
    
    try {
      await api.post('/endpoint', sanitizedData);
      announceToScreenReader(t('form.success'), 'polite');
    } catch (error) {
      announceToScreenReader(t('form.error'), 'assertive');
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit(onSubmit)} 
      data-testid="cs-form"
      role="form"
      aria-label={t('form.title')}
    >
      <ValidatedTextField
        name="email"
        label={t('form.email')}
        control={control}
        error={errors.email}
        required
        testId="cs-form-email"
        ariaDescribedBy="email-help"
      />
      
      <Button
        type="submit"
        disabled={isBlocked}
        data-testid="cs-form-submit"
        aria-label={t('form.submit')}
      >
        {t('form.submit')}
      </Button>
    </Box>
  );
}
```

### Internationalization Standards
```typescript
// Language Context Usage
const { t, language, setLanguage } = useLanguage();

// Translation Key Patterns
'nav.{page}'           // Navigation items
'form.{field}'         // Form labels and placeholders
'validation.{type}'    // Validation error messages
'status.{state}'       // Request status labels
'common.{action}'      // Common UI actions
'error.{type}'         // Error messages
'success.{action}'     // Success messages
'accessibility.{element}' // Screen reader text

// Component Example with I18n
<TextField
  label={t('form.email')}
  placeholder={t('form.email-placeholder')}
  helperText={error ? t(error.message) : t('form.email-help')}
  aria-label={t('accessibility.email-input')}
/>
```

### Accessibility Standards
```typescript
// Mandatory Accessibility Features
- ARIA labels and descriptions for all interactive elements
- Keyboard navigation support with proper focus management
- Screen reader announcements for dynamic content changes
- Color contrast validation (minimum 4.5:1 ratio)
- Alternative text for all images and icons
- Proper heading hierarchy (h1 > h2 > h3)
- Focus indicators for all interactive elements
- High contrast mode support
- Reduced motion preference support

// Accessibility Testing Requirements
- Keyboard-only navigation testing
- Screen reader compatibility testing
- Color blindness simulation testing
- High contrast mode validation
- Focus management verification
```

### State Management
- Use React Context for global state (authentication, theme, language)
- Implement custom hooks for API data fetching and caching
- Use React Hook Form with Zod validation for complex forms
- Keep local component state minimal and focused
- Implement optimistic updates for better user experience
- **Language state management with persistence**
- **Accessibility preferences state management**
- **Content moderation state tracking**

### Form Handling
- Use React Hook Form with Zod validation schemas
- Implement multi-step wizards for complex workflows
- Include real-time validation with user-friendly error messages
- Support dynamic field arrays (add/remove items)
- Implement proper accessibility with ARIA labels and descriptions
- Include comprehensive test IDs for form automation
- **Mandatory input sanitization for all text inputs**
- **Comprehensive validation error handling**
- **Internationalized error messages**
- **Content moderation integration**

## Backend Architecture

### Express Application Structure
```
src/
??? routes/              # API endpoint definitions
??? middleware/          # Authentication, validation, feature flags
??? services/            # Business logic and external integrations
??? utils/               # Helper functions and utilities
??? validation/          # Zod schemas for API validation
??? config/              # Configuration and documentation
??? types/               # TypeScript type definitions
??? tests/               # API integration tests
```

### Enhanced Middleware Implementation
- **Authentication**: JWT validation with user context injection and account lockout
- **Authorization**: Role-based access control with fine-grained permissions
- **Feature Flags**: Dynamic behavior injection for testing scenarios
- **Error Handling**: Structured error responses with correlation IDs
- **Logging**: Request/response logging with performance metrics
- **Validation**: Zod schema validation for all inputs with sanitization
- **Rate Limiting**: Request rate limiting for API protection
- **Input Sanitization**: Server-side input cleaning and validation
- **Content Moderation**: Automated content analysis and flagging
- **Internationalization**: Request locale detection and response localization

### Database Schema Design
- **Users**: Enhanced authentication and profile management with security fields
- **ServiceRequests**: Core entity with comprehensive workflow and location data
- **Comments**: Threaded discussions with moderation support
- **Attachments**: Secure file uploads with metadata and virus scanning preparation
- **EventLogs**: Comprehensive audit trail for all state changes
- **FeatureFlags**: Dynamic configuration for testing with versioning
- **Upvotes**: Community engagement tracking
- **Rankings**: User performance metrics and leaderboard data
- **ContentModeration**: AI analysis results and moderation actions

## Testing Implementation

### Complex Testing Scenarios
- **Multi-step Forms**: 5-step request submission with conditional fields and validation
- **Role-based Workflows**: Different user journeys per role with comprehensive permissions
- **State Machine**: Request status transitions with business rule validation
- **Search and Filtering**: Debounced search with real-time results and advanced filters
- **File Uploads**: Drag-and-drop with validation, progress tracking, and security checks
- **Error Conditions**: Feature flags for controlled error simulation
- **Form Validation**: Comprehensive validation testing scenarios with edge cases
- **Security Testing**: XSS prevention and input sanitization testing
- **Accessibility Testing**: Keyboard navigation and screen reader compatibility
- **Internationalization Testing**: Language switching and translation validation
- **Content Moderation Testing**: Spam detection and automated flagging scenarios

### Data Management for Testing
- Implement database seeding with consistent test data including all new features
- Provide reset functionality for test isolation
- Include demo accounts for each user role with realistic data
- Generate realistic sample data for comprehensive testing including rankings
- Support test data cleanup and regeneration
- **Enhanced seed data with community features (upvotes, rankings, resolved cases)**
- **Content moderation test scenarios with flagged content**
- **Multi-language test data for internationalization testing**

## Quality Assurance Features

### Feature Flags for Bug Simulation
```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  category: 'API' | 'UI' | 'PERFORMANCE' | 'UPLOAD';
}

// Enhanced flags for comprehensive testing scenarios
const DEFAULT_FLAGS = [
  { name: 'API_Random500', description: 'Introduces 5% random server errors' },
  { name: 'UI_WrongDefaultSort', description: 'Wrong default sorting behavior' },
  { name: 'API_SlowRequests', description: 'Simulates 10% slow API responses' },
  { name: 'API_UploadIntermittentFail', description: 'Random file upload failures' },
  { name: 'UI_MissingAria', description: 'Remove ARIA labels for accessibility testing' },
  { name: 'API_ValidationBypass', description: 'Bypass validation for security testing' },
  { name: 'UI_LanguageMismatch', description: 'Mix languages for i18n testing' }
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

// Enhanced state transitions with validation rules
const VALID_TRANSITIONS = {
  SUBMITTED: ['TRIAGED', 'REJECTED'],
  TRIAGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'WAITING_ON_CITIZEN', 'REJECTED'],
  WAITING_ON_CITIZEN: ['IN_PROGRESS', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: [],
  REJECTED: ['REOPENED']
};
```

### Content Moderation System
```typescript
interface ContentAnalysis {
  content: string;
  isSpam: boolean;
  isHate: boolean;
  isOffensive: boolean;
  hasSecurityThreat: boolean;
  hasProfanity: boolean;
  score: number;
  flags: string[];
  recommendations: string[];
  detectedPatterns: string[];
}

// Automated content moderation with AI analysis
const moderationCategories = [
  'SPAM_DETECTION',
  'HATE_SPEECH',
  'SECURITY_THREATS',
  'PROFANITY_FILTER',
  'XSS_PREVENTION'
];
```

## Performance Standards

### Frontend Optimization
- Implement code splitting with React.lazy and Suspense
- Use React.memo for expensive component re-renders
- Implement virtual scrolling for large data sets
- Optimize bundle size with tree shaking
- Use proper dependency arrays in useEffect hooks
- Implement proper loading states and skeleton screens
- **Debounced validation to prevent excessive API calls**
- **Lazy loading for image uploads and large content**
- **Optimized internationalization with dynamic imports**

### Backend Optimization
- Use database query optimization with proper indexes
- Implement response caching for frequently accessed data
- Use connection pooling for database connections
- Implement request rate limiting for API protection
- Use compression middleware for response optimization
- Monitor and log performance metrics
- **Optimized content moderation with efficient pattern matching**
- **Cached ranking calculations for performance**
- **Efficient file upload handling with progress tracking**

## Deployment Standards

### Docker Configuration
- Multi-stage builds for production optimization
- Development configuration with hot reload
- Proper health checks and monitoring
- Volume management for data persistence
- Environment variable configuration
- Container security best practices
- **Enhanced security with content scanning**
- **Performance monitoring and alerting**

### Environment Management
- Separate configurations for development, staging, production
- Secure secret management (never commit secrets)
- Environment variable validation on startup
- Database migration handling in deployment
- Logging configuration per environment
- Feature flag environment-specific defaults
- **Language pack deployment for internationalization**
- **Content moderation service configuration**

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public functions and components
- README files for each major module or feature
- API documentation using OpenAPI/Swagger
- Database schema documentation with entity relationships
- Testing documentation with example scenarios
- Deployment documentation with step-by-step instructions
- **Validation schema documentation with examples**
- **Accessibility implementation guide**
- **Internationalization setup instructions**
- **Content moderation configuration guide**

### Testing Documentation
- Test scenario descriptions for manual testing
- Automation example scripts for different frameworks
- Test data requirements and setup instructions
- Feature flag usage guide for QA testing
- Performance testing guidelines and benchmarks
- Security testing checklists and procedures
- **Form validation testing scenarios and edge cases**
- **Accessibility testing checklists and procedures**
- **Internationalization testing scenarios**
- **Content moderation testing scenarios**

## Implementation Guidelines

### New Feature Development
1. **Design**: Plan component architecture and data flow with accessibility in mind
2. **Backend**: Implement API endpoints with validation, security, and internationalization
3. **Frontend**: Create components with proper TypeScript types and accessibility
4. **Validation**: Implement comprehensive Zod schema validation with security measures
5. **Security**: Add input sanitization, XSS prevention, and content moderation
6. **Accessibility**: Ensure WCAG 2.1 AA compliance with proper ARIA support
7. **Internationalization**: Add translation keys and language support
8. **Testing**: Add comprehensive test IDs and automation examples
9. **Documentation**: Update API docs, testing guides, and accessibility documentation
10. **Feature Flags**: Consider controllable error scenarios and testing configurations
11. **Performance**: Optimize for large datasets and concurrent users

### Bug Fixes and Maintenance
1. **Root Cause**: Identify and document the underlying issue with accessibility impact
2. **Test Cases**: Create test cases that reproduce the bug across different scenarios
3. **Fix Implementation**: Implement fix with minimal side effects and maintained accessibility
4. **Validation**: Ensure proper input validation and content moderation is in place
5. **Regression Testing**: Ensure fix doesn't break existing functionality or accessibility
6. **Documentation**: Update relevant documentation including accessibility notes
7. **Monitoring**: Add logging/monitoring to prevent recurrence
8. **Internationalization**: Ensure fix works across all supported languages

## Quality Gates

### Code Review Checklist
- [ ] TypeScript compilation passes without errors
- [ ] All tests pass (unit, integration, e2e, accessibility)
- [ ] Test IDs added for new interactive elements
- [ ] **Comprehensive form validation implemented with Zod schemas**
- [ ] **Input sanitization and XSS prevention in place**
- [ ] **Security measures implemented (rate limiting, content filtering)**
- [ ] **All validation errors have proper test IDs and messages**
- [ ] **WCAG 2.1 AA accessibility compliance verified**
- [ ] **Internationalization support added for new strings**
- [ ] **Content moderation integration where applicable**
- [ ] API documentation updated for endpoint changes
- [ ] Security review for authentication/authorization changes
- [ ] Performance impact assessed for data-heavy operations
- [ ] Accessibility compliance verified with automated and manual testing
- [ ] Error handling implemented and tested
- [ ] Logging added for debugging and monitoring
- [ ] Feature flags considered for testing scenarios

### Definition of Done
- [ ] Feature works as specified in all supported browsers and assistive technologies
- [ ] Comprehensive test coverage with meaningful test IDs
- [ ] **All forms implement comprehensive validation with security measures**
- [ ] **Input sanitization and XSS prevention implemented**
- [ ] **Validation errors are properly tested and accessible**
- [ ] **WCAG 2.1 AA accessibility standards met**
- [ ] **Internationalization support complete with all required translations**
- [ ] **Content moderation integration tested and functional**
- [ ] Documentation updated (code, API, testing guides, accessibility documentation)
- [ ] Security and performance requirements met
- [ ] Accessibility standards followed with proper ARIA implementation
- [ ] Error scenarios handled gracefully with proper user feedback
- [ ] Code reviewed and approved by team
- [ ] Integration testing completed across all user roles
- [ ] Feature flag integration considered and tested
- [ ] Demo/testing scenarios documented with accessibility considerations

### Mandatory Form Validation Checklist
Every form component must implement:

- [ ] **Zod validation schema** with comprehensive rules and internationalization
- [ ] **Real-time validation** with 300ms debounced feedback
- [ ] **Input sanitization** for XSS prevention and content moderation
- [ ] **Comprehensive error messages** for all validation scenarios in multiple languages
- [ ] **Accessibility support** with ARIA attributes and screen reader announcements
- [ ] **Character count indicators** for text fields with limits
- [ ] **Password strength indicators** for password fields with visual and text feedback
- [ ] **Rate limiting** for form submissions (5 attempts per minute)
- [ ] **Test IDs** for all form elements and validation states
- [ ] **Security measures** against common vulnerabilities
- [ ] **Cross-field validation** for related inputs (e.g., password confirmation)
- [ ] **Proper loading states** during submission with accessibility announcements
- [ ] **Success and error feedback** with retry mechanisms and screen reader support
- [ ] **Keyboard navigation** support with proper focus management
- [ ] **High contrast mode** compatibility

### Enhanced Accessibility Checklist
- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **Focus Management**: Proper focus indicators and logical tab order
- [ ] **Screen Reader Support**: ARIA labels, descriptions, and live regions
- [ ] **Color Accessibility**: Sufficient contrast ratios and alternative indicators
- [ ] **Semantic HTML**: Proper heading hierarchy and semantic elements
- [ ] **Alternative Text**: Descriptive alt text for images and icons
- [ ] **Form Accessibility**: Proper labels, descriptions, and error associations
- [ ] **Dynamic Content**: Screen reader announcements for changes
- [ ] **Reduced Motion**: Support for users who prefer reduced motion
- [ ] **High Contrast**: Support for high contrast display preferences

This AI in QA Demo Application is designed to be the ultimate testing playground for demonstrating AI-powered Quality Assurance capabilities while maintaining enterprise-level code quality, comprehensive form validation, full accessibility compliance, internationalization support, content moderation, and modern development practices with robust security measures.