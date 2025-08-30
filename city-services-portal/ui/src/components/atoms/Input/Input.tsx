/**
 * Input Component
 * Atomic input component with validation and helper text
 * Reusable across all forms
 */

import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Typography } from '@mui/material';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: boolean | string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const InputWrapper = styled('div')<{ fullWidth?: boolean }>(({ fullWidth }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: fullWidth ? '100%' : 'auto',
}));

const Label = styled('label')(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
}));

const InputContainer = styled('div')<{ error?: boolean; size?: string }>(
  ({ theme, error, size }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['border-color', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
    
    ...(size === 'small' && {
      height: '32px',
    }),
    ...(size === 'medium' && {
      height: '40px',
    }),
    ...(size === 'large' && {
      height: '48px',
    }),
    
    '&:hover': {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
    },
    
    '&:focus-within': {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${
        error 
          ? theme.palette.error.main + '20' 
          : theme.palette.primary.main + '20'
      }`,
    },
  })
);

const StyledInput = styled('input')<{ hasStartAdornment?: boolean; hasEndAdornment?: boolean }>(
  ({ theme, hasStartAdornment, hasEndAdornment }) => ({
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    padding: theme.spacing(1),
    paddingLeft: hasStartAdornment ? 0 : theme.spacing(1.5),
    paddingRight: hasEndAdornment ? 0 : theme.spacing(1.5),
    fontSize: '1rem',
    color: theme.palette.text.primary,
    fontFamily: theme.typography.body1.fontFamily,
    
    '&::placeholder': {
      color: theme.palette.text.disabled,
    },
    
    '&:disabled': {
      color: theme.palette.text.disabled,
      cursor: 'not-allowed',
    },
  })
);

const Adornment = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  color: theme.palette.text.secondary,
}));

const HelperText = styled(Typography)<{ error?: boolean }>(({ theme, error }) => ({
  fontSize: '0.75rem',
  marginTop: theme.spacing(0.5),
  color: error ? theme.palette.error.main : theme.palette.text.secondary,
  minHeight: '1rem',
}));

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'medium',
      fullWidth = false,
      startAdornment,
      endAdornment,
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : helperText;
    
    return (
      <InputWrapper fullWidth={fullWidth}>
        {label && (
          <Label htmlFor={inputId}>
            {label}
            {props.required && <span style={{ color: 'red' }}> *</span>}
          </Label>
        )}
        
        <InputContainer error={hasError} size={size}>
          {startAdornment && <Adornment>{startAdornment}</Adornment>}
          
          <StyledInput
            ref={ref}
            id={inputId}
            hasStartAdornment={Boolean(startAdornment)}
            hasEndAdornment={Boolean(endAdornment)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={hasError}
            aria-describedby={errorMessage ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {endAdornment && <Adornment>{endAdornment}</Adornment>}
        </InputContainer>
        
        {(errorMessage || (!hasError && helperText)) && (
          <HelperText
            id={`${inputId}-helper`}
            error={hasError}
            variant="caption"
          >
            {errorMessage || helperText}
          </HelperText>
        )}
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';