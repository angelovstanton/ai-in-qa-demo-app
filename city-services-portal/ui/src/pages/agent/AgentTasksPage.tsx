import React from 'react';
import { useTranslation } from 'react-i18next';
import FieldAgentDashboard from './FieldAgentDashboard';

const AgentTasksPage: React.FC = () => {
  const { t } = useTranslation(['agent', 'dashboard', 'common']);
  
  return <FieldAgentDashboard />;
};

export default AgentTasksPage;