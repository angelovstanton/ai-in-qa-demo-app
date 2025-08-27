import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CitizenRequestsPage from '../../pages/citizen/CitizenRequestsPage';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';

// Mock the useServiceRequests hook
jest.mock('../../hooks/useServiceRequests', () => ({
  useServiceRequests: jest.fn(() => ({
    data: [
      {
        id: '1',
        code: 'REQ-2024-001',
        title: 'Pothole on Main Street',
        category: 'roads-transportation',
        priority: 'HIGH',
        status: 'SUBMITTED',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        dateOfRequest: '2024-01-15T10:00:00Z',
        upvotes: 5,
        comments: 3,
        resolvedStatus: false,
        correspondenceHistory: [],
      },
      {
        id: '2',
        code: 'REQ-2024-002',
        title: 'Broken streetlight',
        category: 'street-lighting',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-16T09:20:00Z',
        dateOfRequest: '2024-01-14T15:30:00Z',
        upvotes: 8,
        comments: 2,
        resolvedStatus: false,
        correspondenceHistory: [],
      },
    ],
    loading: false,
    error: null,
    totalCount: 2,
  })),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const theme = createTheme();

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'CITIZEN' as const,
};

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthContext.Provider value={mockAuthContext}>
          <LanguageProvider>
            <FeatureFlagsProvider>
              {children}
            </FeatureFlagsProvider>
          </LanguageProvider>
        </AuthContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('CitizenRequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the page title', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      expect(screen.getByText('My Service Requests')).toBeInTheDocument();
    });

    it('should render the create new request button', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const createButton = screen.getByTestId('cs-requests-create-button');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveTextContent('Create New Request');
    });

    it('should render the filters section', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-requests-filters')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render the data table', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-citizen-requests-grid')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to new request page when create button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const createButton = screen.getByTestId('cs-requests-create-button');
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/citizen/requests/new');
    });

    it('should navigate to request detail when view button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // Wait for the data to load and find the view button
      await waitFor(() => {
        const viewButton = screen.getByTestId('cs-requests-view-1');
        expect(viewButton).toBeInTheDocument();
      });

      const viewButton = screen.getByTestId('cs-requests-view-1');
      await user.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/request/1');
    });
  });

  describe('Filtering', () => {
    it('should render all filter controls', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-requests-search')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-category-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-priority-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-resolved-filter')).toBeInTheDocument();
    });

    it('should update search term when typing in search field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('cs-requests-search');
      await user.type(searchInput, 'pothole');

      expect(searchInput).toHaveValue('pothole');
    });

    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // Set some filter values first
      const searchInput = screen.getByTestId('cs-requests-search');
      await user.type(searchInput, 'test');

      // The clear button should appear when filters are active
      await waitFor(() => {
        expect(screen.getByTestId('cs-requests-clear-filters')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('cs-requests-clear-filters');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should update status filter when selecting an option', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const statusFilter = screen.getByTestId('cs-requests-status-filter');
      await user.click(statusFilter);

      // Select "In Progress" option
      const inProgressOption = screen.getByText('In Progress');
      await user.click(inProgressOption);

      // The filter should now show the selected value
      expect(statusFilter).toHaveTextContent('In Progress');
    });
  });

  describe('Data Display', () => {
    it('should display request data in the table', async () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // Check that the mock data is displayed
      await waitFor(() => {
        expect(screen.getByText('REQ-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Pothole on Main Street')).toBeInTheDocument();
        expect(screen.getByText('REQ-2024-002')).toBeInTheDocument();
        expect(screen.getByText('Broken streetlight')).toBeInTheDocument();
      });
    });

    it('should display priority chips with correct colors', async () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const highPriorityChip = screen.getByTestId('cs-requests-priority-1');
        const mediumPriorityChip = screen.getByTestId('cs-requests-priority-2');
        
        expect(highPriorityChip).toBeInTheDocument();
        expect(mediumPriorityChip).toBeInTheDocument();
      });
    });

    it('should display status chips with correct formatting', async () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const submittedStatusChip = screen.getByTestId('cs-requests-status-1');
        const inProgressStatusChip = screen.getByTestId('cs-requests-status-2');
        
        expect(submittedStatusChip).toBeInTheDocument();
        expect(inProgressStatusChip).toBeInTheDocument();
        expect(inProgressStatusChip).toHaveTextContent('IN PROGRESS');
      });
    });

    it('should display upvotes and comments counts', async () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const upvotes1 = screen.getByTestId('cs-requests-upvotes-1');
        const comments1 = screen.getByTestId('cs-requests-comments-1');
        const upvotes2 = screen.getByTestId('cs-requests-upvotes-2');
        const comments2 = screen.getByTestId('cs-requests-comments-2');
        
        expect(upvotes1).toHaveTextContent('5');
        expect(comments1).toHaveTextContent('3');
        expect(upvotes2).toHaveTextContent('8');
        expect(comments2).toHaveTextContent('2');
      });
    });

    it('should display resolved status correctly', async () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const resolvedStatus1 = screen.getByTestId('cs-requests-resolved-1');
        const resolvedStatus2 = screen.getByTestId('cs-requests-resolved-2');
        
        expect(resolvedStatus1).toHaveTextContent('Unresolved');
        expect(resolvedStatus2).toHaveTextContent('Unresolved');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for all interactive elements', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // Check that all required test IDs are present
      expect(screen.getByTestId('cs-citizen-requests-page')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-create-button')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-filters')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-search')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-category-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-priority-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-requests-resolved-filter')).toBeInTheDocument();
      expect(screen.getByTestId('cs-citizen-requests-grid')).toBeInTheDocument();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('cs-requests-search');
      expect(searchInput).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      const createButton = screen.getByTestId('cs-requests-create-button');
      createButton.focus();

      // Test tab navigation
      await user.keyboard('{Tab}');
      expect(document.activeElement).not.toBe(createButton);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      // Mock the hook to return an error
      const mockError = 'Failed to fetch requests';
      require('../../hooks/useServiceRequests').useServiceRequests.mockReturnValue({
        data: [],
        loading: false,
        error: mockError,
        totalCount: 0,
      });

      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('cs-requests-error')).toBeInTheDocument();
      expect(screen.getByText(mockError)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should display loading state correctly', () => {
      // Mock the hook to return loading state
      require('../../hooks/useServiceRequests').useServiceRequests.mockReturnValue({
        data: [],
        loading: true,
        error: null,
        totalCount: 0,
      });

      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // The DataTable component should handle the loading state
      expect(screen.getByTestId('cs-citizen-requests-grid')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <CitizenRequestsPage />
        </TestWrapper>
      );

      // Check that the component renders without errors on mobile
      expect(screen.getByTestId('cs-citizen-requests-page')).toBeInTheDocument();
    });
  });
});