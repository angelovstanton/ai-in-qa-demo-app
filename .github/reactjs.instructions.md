---
description: 'ReactJS development standards and best practices for QA testing'
applyTo: '**/*.jsx, **/*.tsx, **/*.js, **/*.ts'
---

# ReactJS Development Instructions

Instructions for building high-quality ReactJS applications with modern patterns, hooks, comprehensive QA testing support, and robust form validation following the official React documentation at https://react.dev.

## Project Context
- Latest React version (React 18+)
- TypeScript for type safety and better development experience
- Functional components with hooks as default pattern
- Material-UI (MUI) component library for consistent design
- Comprehensive test automation support with data-testid attributes
- Feature flag integration for controlled testing scenarios
- Role-based access control and authentication patterns
- **Advanced Form Validation**: Zod schemas with real-time validation and security features

## Development Standards

### Architecture
- Use functional components with hooks as the primary pattern
- Implement component composition over inheritance
- Organize components by feature or domain for scalability
- Separate presentational and container components clearly
- Use custom hooks for reusable stateful logic
- Implement proper component hierarchies with clear data flow
- Create context providers for global state management

### TypeScript Integration
- Use TypeScript interfaces for props, state, and component definitions
- Define proper types for event handlers and refs
- Implement generic components where appropriate
- Use strict mode in `tsconfig.json` for type safety
- Leverage React's built-in types (`React.FC`, `React.ComponentProps`, etc.)
- Create union types for component variants and states
- Define custom types for API responses and form data

### Component Design for QA Testing
- Follow the single responsibility principle for components
- Use descriptive and consistent naming conventions
- Include `data-testid` attributes on ALL interactive elements
- Follow test ID naming convention: `cs-{page/section}-{element}-{action?}`
- Implement proper prop validation with TypeScript interfaces
- Design components to be testable and reusable
- Keep components small and focused on a single concern
- Use composition patterns (render props, children as functions)

### Form Validation Requirements
All forms MUST implement comprehensive validation with the following standards:

#### Required Validation Framework
```typescript
// Import validation framework
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Use standardized validation patterns
import { ValidationPatterns, ErrorMessages, formatErrorMessage } from '../utils/validation';

// All forms must implement:
// 1. Zod schema validation
// 2. Real-time validation with debouncing
// 3. Comprehensive error messages
// 4. Input sanitization
// 5. Accessibility support
// 6. Security considerations (XSS prevention)
```

#### Mandatory Validation Types
Every form input must include appropriate validation:

```typescript
// 1. Required Field Validation
const requiredField = z.string()
  .min(1, 'This field is required')
  .transform((val) => val.trim());

// 2. Email Validation (comprehensive)
const emailValidation = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine(
    (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    'Email format is invalid'
  );

// 3. Password Validation (security requirements)
const passwordValidation = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain: uppercase letter, lowercase letter, number, and special character'
  );

// 4. Name Validation (unicode support)
const nameValidation = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(
    /^[a-zA-ZÀ-ÿ\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .transform((name) => name.trim());

// 5. Phone Number Validation (international support)
const phoneValidation = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be less than 15 digits')
  .regex(
    /^[\+]?[1-9][\d]{0,15}$/,
    'Please enter a valid phone number'
  );

// 6. Text Content Validation (XSS prevention)
const safeTextValidation = z.string()
  .transform((text) => text.trim())
  .refine(
    (text) => !/<script|javascript:|on\w+=/i.test(text),
    'Text contains potentially harmful content'
  );
```

#### Form Implementation Standards
```typescript
// Example comprehensive form component
function RegistrationForm() {
  // 1. Define validation schema
  const registrationSchema = z.object({
    firstName: ValidationPatterns.name,
    lastName: ValidationPatterns.name,
    email: ValidationPatterns.email,
    password: ValidationPatterns.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: ValidationPatterns.phone,
    streetAddress: z.string()
      .min(5, 'Street address must be at least 5 characters')
      .max(100, 'Street address is too long'),
    city: ValidationPatterns.name,
    postalCode: ValidationPatterns.postalCode,
    agreesToTerms: z.boolean()
      .refine(val => val === true, 'You must agree to the Terms and Conditions'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  // 2. Setup form with validation
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur', // Real-time validation
    reValidateMode: 'onChange'
  });

  // 3. Watch for password confirmation validation
  const password = watch('password');

  // 4. Form submission with error handling
  const onSubmit = async (data: z.infer<typeof registrationSchema>) => {
    try {
      // Sanitize data before submission
      const sanitizedData = {
        ...data,
        firstName: Sanitization.sanitizeForDatabase(data.firstName),
        lastName: Sanitization.sanitizeForDatabase(data.lastName),
        streetAddress: Sanitization.sanitizeForDatabase(data.streetAddress),
      };
      
      await api.post('/auth/register', sanitizedData);
    } catch (error) {
      // Handle API errors appropriately
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} data-testid="cs-registration-form">
      {/* 5. Use validated input components */}
      <ValidatedTextField
        name="firstName"
        label="First Name"
        control={control}
        error={errors.firstName}
        required
        testId="cs-registration-first-name"
        maxLength={50}
        showCharCount
      />

      <ValidatedTextField
        name="email"
        label="Email Address"
        type="email"
        control={control}
        error={errors.email}
        required
        testId="cs-registration-email"
      />

      <ValidatedTextField
        name="password"
        label="Password"
        type="password"
        control={control}
        error={errors.password}
        required
        testId="cs-registration-password"
        helperText="Must contain uppercase, lowercase, number, and special character"
      />

      {/* 6. Include accessibility and test attributes */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        data-testid="cs-registration-submit"
        aria-label="Submit registration form"
      >
        Create Account
      </Button>
    </Box>
  );
}
```

#### Real-time Validation Implementation
```typescript
// Enhanced input component with real-time validation
function ValidatedTextField({
  name,
  label,
  control,
  error,
  required = false,
  type = 'text',
  testId,
  maxLength,
  showCharCount = false,
  debounceMs = 300,
  ...props
}) {
  const [charCount, setCharCount] = useState(0);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type={type}
          error={!!error}
          helperText={error?.message}
          required={required}
          fullWidth
          margin="normal"
          data-testid={testId}
          inputProps={{
            maxLength,
            'aria-describedby': error ? `${name}-error` : undefined,
            'aria-invalid': !!error,
          }}
          onChange={(e) => {
            const newValue = e.target.value;
            field.onChange(newValue);
            setCharCount(newValue.length);
            
            // Trigger real-time validation with debouncing
            if (debounceMs > 0) {
              clearTimeout(field.debounceTimeout);
              field.debounceTimeout = setTimeout(() => {
                control._trigger(name);
              }, debounceMs);
            }
          }}
          InputProps={{
            endAdornment: showCharCount && maxLength && (
              <InputAdornment position="end">
                <Typography
                  variant="caption"
                  color={charCount > maxLength * 0.9 ? 'error' : 'textSecondary'}
                  data-testid={`${testId}-char-count`}
                >
                  {charCount}/{maxLength}
                </Typography>
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}
```

### Error Handling and User Feedback
```typescript
// Comprehensive error handling for forms
function FormErrorHandler({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (!error) return null;

  const getErrorMessage = (error: Error): string => {
    if (error.message.includes('network')) {
      return ErrorMessages.NETWORK.CONNECTION_ERROR;
    }
    if (error.message.includes('validation')) {
      return 'Please check your input and try again';
    }
    if (error.message.includes('exists')) {
      return ErrorMessages.BUSINESS.EMAIL_EXISTS;
    }
    return ErrorMessages.NETWORK.SERVER_ERROR;
  };

  return (
    <Alert 
      severity="error" 
      data-testid="cs-form-error"
      action={
        <Button 
          color="inherit" 
          size="small" 
          onClick={onRetry}
          data-testid="cs-form-retry"
        >
          Try Again
        </Button>
      }
    >
      {getErrorMessage(error)}
    </Alert>
  );
}
```

### Test Automation Support
```typescript
// Test ID Patterns for QA Automation
interface TestIds {
  // Authentication components
  LOGIN_EMAIL: 'cs-login-email';
  LOGIN_PASSWORD: 'cs-login-password';
  LOGIN_SUBMIT: 'cs-login-submit';
  LOGOUT_BUTTON: 'cs-logout-button';
  
  // Form components
  FORM_INPUT: (name: string) => `cs-form-${name}`;
  FORM_SUBMIT: 'cs-form-submit';
  FORM_CANCEL: 'cs-form-cancel';
  FORM_ERROR: 'cs-form-error';
  FORM_SUCCESS: 'cs-form-success';
  
  // Validation feedback
  FIELD_ERROR: (name: string) => `cs-field-error-${name}`;
  CHAR_COUNT: (name: string) => `cs-char-count-${name}`;
  
  // Navigation components
  NAV_MENU: 'cs-nav-menu';
  NAV_ITEM: (item: string) => `cs-nav-${item}`;
  
  // Data components
  DATA_GRID: 'cs-data-grid';
  DATA_ROW: (index: number) => `cs-data-row-${index}`;
  PAGINATION: 'cs-pagination';
  
  // Action buttons
  CREATE_BUTTON: 'cs-create-button';
  EDIT_BUTTON: (id: string) => `cs-edit-${id}`;
  DELETE_BUTTON: (id: string) => `cs-delete-${id}`;
}

// Example component with proper test IDs and validation
function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const loginSchema = z.object({
    email: ValidationPatterns.email,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="cs-login-form">
      <ValidatedTextField
        name="email"
        label="Email"
        type="email"
        control={control}
        error={errors.email}
        required
        testId="cs-login-email"
      />
      <ValidatedTextField
        name="password"
        label="Password"
        type="password"
        control={control}
        error={errors.password}
        required
        testId="cs-login-password"
      />
      <Button
        type="submit"
        disabled={isLoading}
        data-testid="cs-login-submit"
        aria-label={isLoading ? 'Signing in...' : 'Sign in to your account'}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### State Management
- Use `useState` for local component state
- Implement `useReducer` for complex state logic
- Leverage `useContext` for sharing state across component trees
- Use React Query or SWR for server state management
- Implement proper state normalization and data structures
- Create custom hooks for API data fetching and caching
- Use Zustand or Redux Toolkit for complex global state

### Hooks and Effects
- Use `useEffect` with proper dependency arrays to avoid infinite loops
- Implement cleanup functions in effects to prevent memory leaks
- Use `useMemo` and `useCallback` for performance optimization when needed
- Create custom hooks for reusable stateful logic
- Follow the rules of hooks (only call at the top level)
- Use `useRef` for accessing DOM elements and storing mutable values
- Implement proper error boundaries with hooks

### Material-UI Integration
- Use MUI components consistently throughout the application
- Implement custom theme with proper color palette and typography
- Use MUI's responsive breakpoint system for layout
- Implement proper spacing using theme spacing function
- Use MUI icons consistently across the application
- Leverage MUI's data grid for complex table scenarios
- Implement proper form validation with MUI components

### Multi-Step Forms and Wizards
- Implement stepper components for complex workflows
- Use proper state management for form data across steps
- Include navigation controls with proper test IDs
- Implement validation per step and overall form validation
- Provide progress indicators and step completion status
- Handle step navigation with proper URL routing
- Implement proper error handling and recovery

### Data Fetching and API Integration
```typescript
// Custom hook for API data with proper error handling
function useServiceRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ['service-requests', filters],
    queryFn: () => api.getServiceRequests(filters),
    onError: (error) => {
      console.error('Failed to fetch service requests:', error);
    }
  });
}

// Component with proper loading and error states
function ServiceRequestList() {
  const { data, isLoading, error, refetch } = useServiceRequests();

  if (isLoading) {
    return (
      <Box data-testid="cs-requests-loading">
        <CircularProgress />
        <Typography>Loading requests...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        data-testid="cs-requests-error"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => refetch()}
            data-testid="cs-requests-retry"
          >
            Retry
          </Button>
        }
      >
        Failed to load service requests
      </Alert>
    );
  }

  return (
    <DataGrid
      rows={data?.requests || []}
      columns={columns}
      data-testid="cs-requests-grid"
      pageSize={25}
      rowsPerPageOptions={[10, 25, 50]}
    />
  );
}
```

### Feature Flag Integration
```typescript
// Feature flag context for controlled testing
const FeatureFlagContext = createContext<FeatureFlags>({});

export function useFeatureFlag(flagName: string): boolean {
  const flags = useContext(FeatureFlagContext);
  return flags[flagName] || false;
}

// Component with feature flag support
function RequestActions({ request }: RequestActionsProps) {
  const hasNewFeature = useFeatureFlag('NEW_BULK_ACTIONS');
  
  return (
    <Box data-testid="cs-request-actions">
      <Button 
        variant="outlined"
        data-testid="cs-request-edit"
      >
        Edit
      </Button>
      
      {hasNewFeature && (
        <Button 
          variant="outlined"
          data-testid="cs-request-bulk-action"
        >
          Bulk Action
        </Button>
      )}
    </Box>
  );
}
```

### Role-Based Access Control
```typescript
// HOC for role-based component rendering
function withRoleAccess<T>(
  Component: React.ComponentType<T>,
  allowedRoles: UserRole[]
) {
  return function ProtectedComponent(props: T) {
    const { user } = useAuth();
    
    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <Alert 
          severity="warning" 
          data-testid="cs-access-denied"
        >
          Access denied
        </Alert>
      );
    }
    
    return <Component {...props} />;
  };
}

// Usage example
const AdminPanel = withRoleAccess(
  AdminPanelComponent, 
  ['ADMIN', 'SUPERVISOR']
);
```

### Error Handling and Boundaries
```typescript
// Error boundary with proper fallback UI
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert 
          severity="error" 
          data-testid="cs-error-boundary"
        >
          <AlertTitle>Something went wrong</AlertTitle>
          Please refresh the page or contact support if the problem persists.
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

### Performance Optimization
- Use `React.memo` for component memoization when appropriate
- Implement code splitting with `React.lazy` and `Suspense`
- Optimize bundle size with tree shaking and dynamic imports
- Use `useMemo` and `useCallback` judiciously to prevent unnecessary re-renders
- Implement virtual scrolling for large lists with react-window
- Profile components with React DevTools to identify performance bottlenecks
- Use proper key props for list rendering optimization

### Accessibility and Testing
- Use semantic HTML elements appropriately
- Implement proper ARIA attributes and roles
- Ensure keyboard navigation works for all interactive elements
- Provide alt text for images and descriptive text for icons
- Implement proper color contrast ratios
- Test with screen readers and accessibility tools
- Include accessibility test IDs: `cs-a11y-{element}`
- Ensure all form errors are announced to screen readers
- Implement proper focus management for form validation

### Security Requirements
All forms must implement these security measures:

```typescript
// 1. Input Sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// 2. XSS Prevention in text areas and rich content
const preventXSS = (content: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
  ];
  
  return !xssPatterns.some(pattern => pattern.test(content));
};

// 3. Rate limiting for form submissions
const useRateLimit = (maxAttempts: number, timeWindow: number) => {
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const checkRateLimit = useCallback(() => {
    if (attempts >= maxAttempts) {
      setIsBlocked(true);
      setTimeout(() => {
        setAttempts(0);
        setIsBlocked(false);
      }, timeWindow);
      return false;
    }
    setAttempts(prev => prev + 1);
    return true;
  }, [attempts, maxAttempts, timeWindow]);
  
  return { isBlocked, checkRateLimit };
};
```

### Testing Integration
```typescript
// Test utilities for component testing
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    ...renderOptions
  }: ExtendedRenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={setupStore(preloadedState)}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Example test with comprehensive validation testing
test('should validate and submit service request form', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ServiceRequestForm />);
  
  // Test validation errors
  await user.click(screen.getByTestId('cs-request-submit'));
  expect(screen.getByText('Title is required')).toBeInTheDocument();
  
  // Test successful validation
  await user.type(
    screen.getByTestId('cs-request-title'), 
    'Pothole on Main Street that needs immediate attention'
  );
  
  await user.type(
    screen.getByTestId('cs-request-description'),
    'Large pothole causing damage to vehicles and creating safety hazard for pedestrians'
  );
  
  await user.selectOptions(
    screen.getByTestId('cs-request-category'),
    'roads-transportation'
  );
  
  await user.click(screen.getByTestId('cs-request-submit'));
  
  expect(screen.getByTestId('cs-request-success')).toBeInTheDocument();
});

// Test form validation errors
test('should show validation errors for invalid inputs', async () => {
  const user = userEvent.setup();
  renderWithProviders(<RegistrationForm />);
  
  // Test email validation
  await user.type(screen.getByTestId('cs-registration-email'), 'invalid-email');
  await user.tab();
  expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  
  // Test password validation
  await user.type(screen.getByTestId('cs-registration-password'), 'weak');
  await user.tab();
  expect(screen.getByText(/Password must contain/)).toBeInTheDocument();
  
  // Test required field validation
  await user.click(screen.getByTestId('cs-registration-submit'));
  expect(screen.getByText('First name is required')).toBeInTheDocument();
});
```

## Implementation Guidelines

### Component Development Process
1. **Design**: Plan component architecture and props interface
2. **TypeScript**: Define proper interfaces and types
3. **Validation**: Implement comprehensive Zod schema validation
4. **Implementation**: Create component with proper hooks and state
5. **Test IDs**: Add comprehensive data-testid attributes
6. **Security**: Implement input sanitization and XSS prevention
7. **Styling**: Apply MUI theme and responsive design
8. **Testing**: Write unit tests with React Testing Library
9. **Accessibility**: Ensure WCAG 2.1 AA compliance
10. **Documentation**: Add JSDoc comments and usage examples
11. **Integration**: Test with parent components and API integration

### Quality Gates
- [ ] TypeScript compilation passes without errors or warnings
- [ ] All interactive elements have proper test IDs
- [ ] Component passes accessibility audit
- [ ] **All forms implement comprehensive validation with Zod schemas**
- [ ] **Input sanitization and XSS prevention implemented**
- [ ] **Real-time validation with appropriate debouncing**
- [ ] **Comprehensive error messages for all validation scenarios**
- [ ] **Security measures implemented (rate limiting, content filtering)**
- [ ] Unit tests cover main functionality and edge cases
- [ ] Component works properly with different user roles
- [ ] Feature flags are properly integrated where applicable
- [ ] Error states are handled gracefully
- [ ] Loading states provide proper user feedback
- [ ] Component is responsive across different screen sizes
- [ ] Code follows established patterns and conventions

### Mandatory Form Validation Checklist
Every form component must implement:

- [ ] **Zod validation schema** with comprehensive rules
- [ ] **Real-time validation** with debounced feedback
- [ ] **Input sanitization** for XSS prevention
- [ ] **Comprehensive error messages** for all scenarios
- [ ] **Accessibility support** with ARIA attributes
- [ ] **Character count indicators** for text fields with limits
- [ ] **Password strength indicators** for password fields
- [ ] **Email uniqueness validation** for registration forms
- [ ] **File upload validation** with type and size checks
- [ ] **Rate limiting** for form submissions
- [ ] **Test IDs** for all form elements and validation states
- [ ] **Security measures** against common vulnerabilities
- [ ] **Cross-field validation** for related inputs
- [ ] **Proper loading states** during submission
- [ ] **Success and error feedback** with retry mechanisms

This ReactJS development approach ensures high-quality, secure, testable components with comprehensive form validation that supports extensive QA automation while maintaining excellent user experience and accessibility standards.