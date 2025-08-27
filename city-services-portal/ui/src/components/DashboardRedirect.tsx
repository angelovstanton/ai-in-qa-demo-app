import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'CITIZEN':
      return <Navigate to="/dashboard" replace />;
    case 'CLERK':
      return <Navigate to="/clerk/inbox" replace />;
    case 'SUPERVISOR':
      return <Navigate to="/supervisor/assign" replace />;
    case 'FIELD_AGENT':
      return <Navigate to="/agent/my-tasks" replace />;
    case 'ADMIN':
      return <Navigate to="/admin/flags" replace />;
    default:
      // Fallback to public board for unknown roles
      return <Navigate to="/public" replace />;
  }
};

export default DashboardRedirect;