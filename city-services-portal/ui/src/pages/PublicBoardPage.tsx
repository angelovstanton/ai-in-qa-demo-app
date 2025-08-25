import React from 'react';
import { designTokens } from '../theme/tokens';

const PublicBoardPage: React.FC = () => {
  return (
    <div data-testid="cs-public-board-page">
      <h1 style={{ 
        fontSize: designTokens.typography.fontSize['3xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        marginBottom: designTokens.spacing.lg,
        color: designTokens.colors.gray[900]
      }}>
        Public Service Requests Board
      </h1>
      <div style={{
        backgroundColor: 'white',
        padding: designTokens.spacing.xl,
        borderRadius: designTokens.borderRadius.lg,
        boxShadow: designTokens.shadows.md
      }}>
        <p style={{ fontSize: designTokens.typography.fontSize.lg }}>
          Welcome to the City Services Portal. Here you can view public service requests and their status.
        </p>
        <div style={{ marginTop: designTokens.spacing.lg }}>
          <a 
            href="/login"
            style={{
              backgroundColor: designTokens.colors.primary[600],
              color: 'white',
              padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
              borderRadius: designTokens.borderRadius.md,
              textDecoration: 'none',
              fontWeight: designTokens.typography.fontWeight.medium
            }}
          >
            Login to Submit Request
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicBoardPage;