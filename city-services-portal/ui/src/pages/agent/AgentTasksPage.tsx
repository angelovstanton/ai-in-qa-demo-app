import React from 'react';
import { designTokens } from '../../theme/tokens';

const AgentTasksPage: React.FC = () => {
  return (
    <div data-testid="cs-agent-tasks-page">
      <h1 style={{ 
        fontSize: designTokens.typography.fontSize['3xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        marginBottom: designTokens.spacing.lg,
        color: designTokens.colors.gray[900]
      }}>
        My Tasks
      </h1>
      <div style={{
        backgroundColor: 'white',
        padding: designTokens.spacing.xl,
        borderRadius: designTokens.borderRadius.lg,
        boxShadow: designTokens.shadows.md
      }}>
        <p>Field agent task management interface will be implemented here.</p>
      </div>
    </div>
  );
};

export default AgentTasksPage;