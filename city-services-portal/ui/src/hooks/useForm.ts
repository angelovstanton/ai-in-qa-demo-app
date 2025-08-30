/**
 * useForm Hook
 * Custom form management hook with validation
 * Implements form state, validation, and submission handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { ValidationError } from '../../../shared/types';

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetForm: () => void;
  validateField: (name: keyof T) => boolean;
  validateForm: () => boolean;
  getFieldProps: (name: keyof T) => any;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const {
    initialValues,
    validationSchema,
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    onError
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValuesRef = useRef(initialValues);
  const isDirty = useRef(false);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  // Check if form values have changed
  useEffect(() => {
    isDirty.current = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Validate single field
  const validateField = useCallback((name: keyof T): boolean => {
    if (!validationSchema) return true;

    try {
      const fieldSchema = validationSchema.shape?.[name as string] || 
                         validationSchema.pick({ [name]: true });
      
      if (fieldSchema) {
        fieldSchema.parse(values[name]);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message || 'Invalid value';
        setErrors(prev => ({
          ...prev,
          [name as string]: fieldError
        }));
        return false;
      }
    }
    return true;
  }, [values, validationSchema]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (path && !formErrors[path]) {
            formErrors[path] = err.message;
          }
        });
        setErrors(formErrors);
        if (onError) {
          onError(formErrors);
        }
        return false;
      }
    }
    return true;
  }, [values, validationSchema, onError]);

  // Handle field change
  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    if (validateOnChange) {
      // Debounce validation
      setTimeout(() => {
        validateField(name);
      }, 300);
    }
  }, [validateOnChange, validateField]);

  // Handle field blur
  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [name as string]: true
    }));

    if (validateOnBlur) {
      validateField(name);
    }
  }, [validateOnBlur, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    const isFormValid = validateForm();
    if (!isFormValid) {
      return;
    }

    // Submit form
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error: any) {
        console.error('Form submission error:', error);
        if (error.validationErrors) {
          setErrors(error.validationErrors);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit]);

  // Set single field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set single field error
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name as string]: error
    }));
  }, []);

  // Set multiple values
  const setValuesMultiple = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  // Set multiple errors
  const setErrorsMultiple = useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors);
  }, []);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    isDirty.current = false;
  }, []);

  // Get field props for input binding
  const getFieldProps = useCallback((name: keyof T) => {
    return {
      name,
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' 
          ? e.target.checked 
          : e.target.value;
        handleChange(name, value);
      },
      onBlur: () => handleBlur(name),
      error: touched[name as string] && errors[name as string],
      helperText: touched[name as string] && errors[name as string]
    };
  }, [values, errors, touched, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty: isDirty.current,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setValues: setValuesMultiple,
    setErrors: setErrorsMultiple,
    resetForm,
    validateField,
    validateForm,
    getFieldProps
  };
}

/**
 * useFormField Hook
 * For individual form field management
 */
export interface UseFormFieldOptions<T> {
  initialValue: T;
  validate?: (value: T) => string | undefined;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormField<T>(options: UseFormFieldOptions<T>) {
  const {
    initialValue,
    validate,
    validateOnChange = true,
    validateOnBlur = true
  } = options;

  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    setIsDirty(true);

    if (validateOnChange && validate) {
      const validationError = validate(newValue);
      setError(validationError || '');
    }
  }, [validate, validateOnChange]);

  const handleBlur = useCallback(() => {
    setTouched(true);

    if (validateOnBlur && validate) {
      const validationError = validate(value);
      setError(validationError || '');
    }
  }, [value, validate, validateOnBlur]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError('');
    setTouched(false);
    setIsDirty(false);
  }, [initialValue]);

  const validateField = useCallback((): boolean => {
    if (validate) {
      const validationError = validate(value);
      setError(validationError || '');
      return !validationError;
    }
    return true;
  }, [value, validate]);

  return {
    value,
    error: touched ? error : '',
    touched,
    isDirty,
    isValid: !error,
    handleChange,
    handleBlur,
    reset,
    validate: validateField,
    setValue,
    setError,
    setTouched
  };
}