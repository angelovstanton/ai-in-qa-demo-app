/**
 * Button Component
 * Atomic button component with variants and loading states
 * Following composition pattern for reusability
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const StyledButton = styled('button')<ButtonProps>(({ theme, variant, size, fullWidth }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  fontFamily: theme.typography.button.fontFamily,
  fontWeight: theme.typography.button.fontWeight,
  textTransform: 'none',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  width: fullWidth ? '100%' : 'auto',
  
  // Size variants
  ...(size === 'small' && {
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.875rem',
    minHeight: '32px',
  }),
  ...(size === 'medium' && {
    padding: theme.spacing(1, 2),
    fontSize: '1rem',
    minHeight: '40px',
  }),
  ...(size === 'large' && {
    padding: theme.spacing(1.5, 3),
    fontSize: '1.125rem',
    minHeight: '48px',
  }),
  
  // Variant styles
  ...(variant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  }),
  
  ...(variant === 'secondary' && {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  }),
  
  ...(variant === 'danger' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  }),
  
  ...(variant === 'success' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  }),
  
  ...(variant === 'ghost' && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      color: theme.palette.action.disabled,
    },
  }),
  
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <CircularProgress
            size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
            color="inherit"
          />
        )}
        {!loading && startIcon}
        {children}
        {!loading && endIcon}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';