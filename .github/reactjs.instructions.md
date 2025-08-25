---
description: 'ReactJS development standards and best practices for QA testing'
applyTo: '**/*.jsx, **/*.tsx, **/*.js, **/*.ts'
---

# ReactJS Development Instructions

Instructions for building high-quality ReactJS applications with modern patterns, hooks, and comprehensive QA testing support following the official React documentation at https://react.dev.

## Project Context
- Latest React version (React 18+)
- TypeScript for type safety and better development experience
- Functional components with hooks as default pattern
- Material-UI (MUI) component library for consistent design
- Comprehensive test automation support with data-testid attributes
- Feature flag integration for controlled testing scenarios
- Role-based access control and authentication patterns

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

// Example component with proper test IDs
function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} data-testid="cs-login-form">
      <TextField
        name="email"
        label="Email"
        data-testid="cs-login-email"
        required
      />
      <TextField
        name="password"
        type="password"
        label="Password"
        data-testid="cs-login-password"
        required
      />
      <Button
        type="submit"
        disabled={isLoading}
        data-testid="cs-login-submit"
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

### Form Handling with React Hook Form
```typescript
// Example form with validation and test IDs
function ServiceRequestForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(validationSchema)
  });

  return (
    <Box component="form" data-testid="cs-service-request-form">
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Request Title"
            error={!!errors.title}
            helperText={errors.title?.message}
            data-testid="cs-request-title"
            fullWidth
            margin="normal"
          />
        )}
      />
      
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              {...field}
              label="Category"
              error={!!errors.category}
              data-testid="cs-request-category"
            >
              {categories.map((category) => (
                <MenuItem 
                  key={category.id} 
                  value={category.id}
                  data-testid={`cs-category-${category.slug}`}
                >
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />
      
      <Button
        type="submit"
        variant="contained"
        data-testid="cs-request-submit"
        fullWidth
        sx={{ mt: 2 }}
      >
        Submit Request
      </Button>
    </Box>
  );
}
```

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

// Example test with proper selectors
test('should submit service request form', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ServiceRequestForm />);
  
  await user.type(
    screen.getByTestId('cs-request-title'), 
    'Pothole on Main Street'
  );
  
  await user.selectOptions(
    screen.getByTestId('cs-request-category'),
    'roads-transportation'
  );
  
  await user.click(screen.getByTestId('cs-request-submit'));
  
  expect(screen.getByTestId('cs-request-success')).toBeInTheDocument();
});
```

## Implementation Guidelines

### Component Development Process
1. **Design**: Plan component architecture and props interface
2. **TypeScript**: Define proper interfaces and types
3. **Implementation**: Create component with proper hooks and state
4. **Test IDs**: Add comprehensive data-testid attributes
5. **Styling**: Apply MUI theme and responsive design
6. **Testing**: Write unit tests with React Testing Library
7. **Documentation**: Add JSDoc comments and usage examples
8. **Integration**: Test with parent components and API integration

### Quality Gates
- [ ] TypeScript compilation passes without errors or warnings
- [ ] All interactive elements have proper test IDs
- [ ] Component passes accessibility audit
- [ ] Unit tests cover main functionality and edge cases
- [ ] Component works properly with different user roles
- [ ] Feature flags are properly integrated where applicable
- [ ] Error states are handled gracefully
- [ ] Loading states provide proper user feedback
- [ ] Component is responsive across different screen sizes
- [ ] Code follows established patterns and conventions

This ReactJS development approach ensures high-quality, testable components that support comprehensive QA automation while maintaining excellent user experience and accessibility standards.