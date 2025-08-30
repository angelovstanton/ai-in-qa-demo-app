/**
 * Card Component
 * Atomic card component for content containers
 * Provides consistent styling and elevation
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import { Paper, PaperProps } from '@mui/material';

export interface CardProps extends PaperProps {
  variant?: 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  interactive?: boolean;
  selected?: boolean;
  fullHeight?: boolean;
}

const StyledCard = styled(Paper)<CardProps>(
  ({ theme, variant, padding, interactive, selected, fullHeight }) => ({
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
      duration: theme.transitions.duration.short,
    }),
    height: fullHeight ? '100%' : 'auto',
    
    // Variant styles
    ...(variant === 'outlined' && {
      border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
      boxShadow: 'none',
    }),
    
    ...(variant === 'elevated' && {
      boxShadow: theme.shadows[2],
      border: 'none',
    }),
    
    ...(variant === 'flat' && {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: theme.palette.background.default,
    }),
    
    // Padding styles
    ...(padding === 'none' && {
      padding: 0,
    }),
    ...(padding === 'small' && {
      padding: theme.spacing(1),
    }),
    ...(padding === 'medium' && {
      padding: theme.spacing(2),
    }),
    ...(padding === 'large' && {
      padding: theme.spacing(3),
    }),
    
    // Interactive styles
    ...(interactive && {
      cursor: 'pointer',
      '&:hover': {
        boxShadow: variant === 'elevated' ? theme.shadows[4] : theme.shadows[1],
        transform: 'translateY(-2px)',
        ...(variant === 'outlined' && {
          borderColor: theme.palette.primary.main,
        }),
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    }),
    
    // Selected styles
    ...(selected && {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.selected,
    }),
  })
);

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'medium',
  interactive = false,
  selected = false,
  fullHeight = false,
  children,
  ...props
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      interactive={interactive}
      selected={selected}
      fullHeight={fullHeight}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

/**
 * CardHeader Component
 */
export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

const StyledCardHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(2),
}));

const HeaderContent = styled('div')({
  flex: 1,
});

const HeaderTitle = styled('h3')(({ theme }) => ({
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const HeaderSubtitle = styled('p')(({ theme }) => ({
  margin: 0,
  marginTop: theme.spacing(0.5),
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
}));

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <StyledCardHeader>
      <HeaderContent>
        <HeaderTitle>{title}</HeaderTitle>
        {subtitle && <HeaderSubtitle>{subtitle}</HeaderSubtitle>}
      </HeaderContent>
      {action && <div>{action}</div>}
    </StyledCardHeader>
  );
};

/**
 * CardContent Component
 */
export interface CardContentProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const StyledCardContent = styled('div')<{ noPadding?: boolean }>(
  ({ theme, noPadding }) => ({
    padding: noPadding ? 0 : theme.spacing(2),
  })
);

export const CardContent: React.FC<CardContentProps> = ({ children, noPadding = false }) => {
  return <StyledCardContent noPadding={noPadding}>{children}</StyledCardContent>;
};

/**
 * CardActions Component
 */
export interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const StyledCardActions = styled('div')<{ align?: string }>(({ theme, align }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
}));

export const CardActions: React.FC<CardActionsProps> = ({ children, align = 'right' }) => {
  return <StyledCardActions align={align}>{children}</StyledCardActions>;
};