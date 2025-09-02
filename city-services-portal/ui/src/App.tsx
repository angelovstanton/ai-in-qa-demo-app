import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './i18n/config'; // Initialize i18n
import AppLayout from './components/AppLayout';
import DashboardRedirect from './components/DashboardRedirect';
import ErrorBoundary from './components/ErrorBoundary';
import PublicBoardPage from './pages/PublicBoardPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RequestDetailPage from './pages/RequestDetailPage';
import CitizenRequestsPage from './pages/citizen/CitizenRequestsPage';
import NewRequestPage from './pages/citizen/NewRequestPage';
import AllRequestsPage from './pages/AllRequestsPage';
import ResolvedCasesPage from './pages/ResolvedCasesPage';
import CommunityRankingPage from './pages/CommunityRankingPage';
import ClerkInboxPage from './pages/clerk/ClerkInboxPage';
import SupervisorAssignPage from './pages/supervisor/SupervisorAssignPage';
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage';
import StaffPerformancePage from './pages/supervisor/StaffPerformancePage';
import StaffPerformanceReportPage from './pages/supervisor/StaffPerformanceReportPage';
import DepartmentMetricsPage from './pages/supervisor/DepartmentMetricsPage';
import QualityReviewPage from './pages/supervisor/QualityReviewPage';
import PerformanceGoalsPage from './pages/supervisor/PerformanceGoalsPage';
import AgentTasksPage from './pages/agent/AgentTasksPage';
import WorkOrdersPage from './pages/agent/WorkOrdersPage';
import WorkOrderDetailPage from './pages/agent/WorkOrderDetailPage';
import TimeTrackingPage from './pages/agent/TimeTrackingPage';
import PhotosPage from './pages/agent/PhotosPage';
import MapViewPage from './pages/agent/MapViewPage';
import AdminFlagsPage from './pages/admin/AdminFlagsPage';
import EditProfilePage from './pages/EditProfilePage';

// Protected Route component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirects to dashboard if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegistrationPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/reset-password" 
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/confirm-email" 
          element={
            <PublicRoute>
              <EmailConfirmationPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/terms" 
          element={<TermsPage />} 
        />
        
        <Route 
          path="/privacy" 
          element={<PrivacyPage />} 
        />
        
        {/* Public board (accessible to everyone) */}
        <Route 
          path="/public" 
          element={
            <AppLayout>
              <PublicBoardPage />
            </AppLayout>
          } 
        />
        
        {/* Root route - redirects to appropriate dashboard based on role */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />
        
        {/* Request detail page (accessible to all authenticated users) */}
        <Route 
          path="/request/:id" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <RequestDetailPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard - All requests view for authenticated users */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <AllRequestsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Citizen routes */}
        <Route 
          path="/citizen/requests" 
          element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <AppLayout>
                <ErrorBoundary>
                  <CitizenRequestsPage />
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/requests/new" 
          element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <AppLayout>
                <NewRequestPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Public pages accessible to all authenticated users */}
        <Route 
          path="/resolved-cases" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <ResolvedCasesPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ranklist" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <CommunityRankingPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile/edit" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Clerk routes */}
        <Route 
          path="/clerk/inbox" 
          element={
            <ProtectedRoute allowedRoles={['CLERK']}>
              <AppLayout>
                <ClerkInboxPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Supervisor routes */}
        <Route 
          path="/supervisor/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <SupervisorDashboardPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/assign" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <SupervisorAssignPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/staff-performance" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <StaffPerformancePage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/staff-performance/report/:userId" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <StaffPerformanceReportPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/metrics" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <DepartmentMetricsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/quality-reviews" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <QualityReviewPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supervisor/performance-goals" 
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR']}>
              <AppLayout>
                <PerformanceGoalsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Field Agent routes */}
        <Route 
          path="/agent/my-tasks" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <AgentTasksPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/work-orders" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <WorkOrdersPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/work-orders/:id" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <WorkOrderDetailPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/time-tracking" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <TimeTrackingPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/photos" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <PhotosPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/map" 
          element={
            <ProtectedRoute allowedRoles={['FIELD_AGENT']}>
              <AppLayout>
                <MapViewPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin/flags" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout>
                <AdminFlagsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;