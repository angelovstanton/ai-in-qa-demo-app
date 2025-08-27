import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Checkbox,
  Switch,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import StepperWizard, { StepperStep } from '../../components/StepperWizard';
import { useCreateServiceRequest } from '../../hooks/useServiceRequests';
import { serviceRequestSchema, ServiceRequestFormData, FormValidationTestIds } from '../../schemas/formSchemas';

// Local storage key for form persistence
const FORM_STORAGE_KEY = 'new-request-form-data';

// Custom debounce hook to replace lodash
const useDebounce = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const timeoutRef = useRef<number | null>(null);

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay) as unknown as number;
  }, [callback, delay]);
};

// Rate limiting for form submissions
const useRateLimit = (maxAttempts: number = 5, timeWindow: number = 60000) => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < timeWindow);
    
    if (recentAttempts.length >= maxAttempts) {
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), timeWindow);
      return false;
    }
    
    setAttempts([...recentAttempts, now]);
    return true;
  }, [attempts, maxAttempts, timeWindow]);

  return { isBlocked, checkRateLimit };
};

// Character count component with validation styling
const CharacterCount: React.FC<{
  current: number;
  max: number;
  fieldName: string;
  formName: string;
}> = ({ current, max, fieldName, formName }) => {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 80;
  const isError = percentage > 100;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        color={isError ? 'error' : isWarning ? 'warning.main' : 'text.secondary'}
        data-testid={FormValidationTestIds.CHAR_COUNT(formName, fieldName)}
      >
        {current}/{max} characters
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={isError ? 'error' : isWarning ? 'warning' : 'primary'}
        sx={{ height: 2, mt: 0.5 }}
      />
    </Box>
  );
};

// Validation feedback component
const ValidationFeedback: React.FC<{
  field: any;
  error?: any;
  fieldName: string;
  formName: string;
  isValidating?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  securityCheck?: boolean;
}> = ({ field, error, fieldName, formName, isValidating, maxLength, showCharCount, securityCheck }) => {
  const value = field.value || '';
  const hasXSS = securityCheck && value && /<script|javascript:|on\w+=/i.test(value);
  
  return (
    <Box>
      {isValidating && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            data-testid={FormValidationTestIds.VALIDATION_LOADING(formName, fieldName)}
          >
            Validating...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 1 }}
          data-testid={FormValidationTestIds.FIELD_ERROR(formName, fieldName)}
          role="alert"
          aria-live="polite"
        >
          {error.message}
        </Typography>
      )}
      
      {hasXSS && (
        <Alert severity="error" sx={{ mt: 1 }} icon={<WarningIcon />}>
          <Typography variant="caption">
            Content contains potentially harmful elements. Please remove any script tags or suspicious content.
          </Typography>
        </Alert>
      )}
      
      {showCharCount && maxLength && (
        <CharacterCount
          current={value.length}
          max={maxLength}
          fieldName={fieldName}
          formName={formName}
        />
      )}
    </Box>
  );
};

const categories = [
  'roads-transportation',
  'street-lighting', 
  'waste-management',
  'water-sewer',
  'parks-recreation',
  'public-safety',
  'building-permits',
  'snow-removal',
  'traffic-signals',
  'sidewalk-maintenance',
  'tree-services',
  'noise-complaints',
  'animal-control',
  'other'
];

const categoryLabels: Record<string, string> = {
  'roads-transportation': 'Roads and Transportation',
  'street-lighting': 'Street Lighting',
  'waste-management': 'Waste Management',
  'water-sewer': 'Water and Sewer',
  'parks-recreation': 'Parks and Recreation',
  'public-safety': 'Public Safety',
  'building-permits': 'Building and Permits',
  'snow-removal': 'Snow Removal',
  'traffic-signals': 'Traffic Signals',
  'sidewalk-maintenance': 'Sidewalk Maintenance',
  'tree-services': 'Tree Services',
  'noise-complaints': 'Noise Complaints',
  'animal-control': 'Animal Control',
  'other': 'Other'
};

const NewRequestPage: React.FC = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAsyncValidating, setIsAsyncValidating] = useState<Record<string, boolean>>({});
  const { createRequest, loading: isSubmitting } = useCreateServiceRequest();
  const { isBlocked, checkRateLimit } = useRateLimit(5, 60000);

  // Load saved form data from localStorage
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
    return null;
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValidating },
    setValue,
    getValues,
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: loadSavedFormData() || {
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      dateOfRequest: new Date(), // Default to today
      streetAddress: '',
      city: '',
      postalCode: '',
      locationText: '',
      landmark: '',
      accessInstructions: '',
      contactMethod: 'EMAIL',
      alternatePhone: '',
      bestTimeToContact: '',
      issueType: '',
      severity: 5,
      isRecurring: false,
      isEmergency: false,
      hasPermits: false,
      affectedServices: [],
      estimatedValue: 0,
      additionalContacts: [],
      attachments: [],
      satisfactionRating: undefined,
      comments: '',
      agreesToTerms: false,
      wantsUpdates: true,
      preferredDate: undefined,
      preferredTime: '',
    },
  });

  const watchedValues = watch();

  // Save form data to localStorage whenever form values change
  const debouncedSave = useDebounce((data: ServiceRequestFormData) => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }, 1000);

  useEffect(() => {
    debouncedSave(watchedValues);
  }, [watchedValues, debouncedSave]);

  // Clear saved form data when component unmounts or form is submitted successfully
  const clearSavedFormData = useCallback(() => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear saved form data:', error);
    }
  }, []);

  // Debounced validation for real-time feedback
  const debouncedValidation = useDebounce(async (fieldName: string) => {
    setIsAsyncValidating(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      // Simulate async validation (e.g., checking for duplicates)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await trigger(fieldName as any);
    } finally {
      setIsAsyncValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  }, 300);

  // Handle emergency toggle with validation
  const handleEmergencyChange = useCallback((checked: boolean) => {
    setValue('isEmergency', checked);
    if (checked) {
      // Emergency requests must have HIGH or URGENT priority
      if (!['HIGH', 'URGENT'].includes(getValues('priority'))) {
        setValue('priority', 'HIGH');
      }
    }
    trigger(['isEmergency', 'priority', 'alternatePhone']);
  }, [setValue, getValues, trigger]);

  // Sanitize input on change
  const handleInputChange = useCallback((fieldName: string, value: string) => {
    // Simple sanitization
    const sanitized = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    setValue(fieldName as any, sanitized);
    debouncedValidation(fieldName);
  }, [setValue, debouncedValidation]);

  // Step validation function
  const validateStep = useCallback(async (stepIndex: number): Promise<{ isValid: boolean; errors: string[] }> => {
    const stepFields = getStepFields(stepIndex);
    const results = await Promise.all(stepFields.map(field => trigger(field as any)));
    const isValid = results.every(result => result);
    
    // Collect errors for this step
    const stepErrors: string[] = [];
    stepFields.forEach(field => {
      const fieldError = getFieldError(errors, field);
      if (fieldError) {
        stepErrors.push(`${getFieldLabel(field)}: ${fieldError.message}`);
      }
    });

    // Check for emergency request validation
    if (stepIndex === 2 && watchedValues.isEmergency && !watchedValues.alternatePhone) {
      stepErrors.push('Emergency requests require alternate phone number');
    }

    return {
      isValid: isValid && stepErrors.length === 0,
      errors: stepErrors
    };
  }, [trigger, errors, watchedValues]);

  // Get fields for each step
  const getStepFields = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Basic Information
        return ['title', 'description', 'category', 'priority', 'dateOfRequest'];
      case 1: // Location
        return ['streetAddress', 'city', 'postalCode', 'locationText'];
      case 2: // Contact & Services
        return ['contactMethod', 'affectedServices', ...(watchedValues.isEmergency ? ['alternatePhone'] : [])];
      case 3: // Additional Info
        return ['agreesToTerms'];
      case 4: // Review
        return []; // No specific validation for review step
      default:
        return [];
    }
  };

  // Get field error
  const getFieldError = (errors: any, fieldPath: string): any => {
    const parts = fieldPath.split('.');
    let current = errors;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  };

  // Get field label
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      title: 'Request Title',
      description: 'Description',
      category: 'Category',
      priority: 'Priority',
      dateOfRequest: 'Date of Request',
      streetAddress: 'Street Address',
      city: 'City',
      postalCode: 'Postal Code',
      locationText: 'Location Details',
      contactMethod: 'Contact Method',
      alternatePhone: 'Alternate Phone',
      affectedServices: 'Affected Services',
      agreesToTerms: 'Terms Agreement',
    };
    return labels[fieldName] || fieldName;
  };

  // Handle step change
  const handleStepChange = useCallback((fromStep: number, toStep: number) => {
    console.log(`Moving from step ${fromStep} to step ${toStep}`);
  }, []);

  const handleFormSubmit = async () => {
    if (!checkRateLimit()) {
      setSubmitError('Too many submission attempts. Please wait before trying again.');
      return;
    }

    setSubmitError(null);
    
    try {
      await handleSubmit(async (data) => {
        // Final XSS check before submission
        const textFields = ['title', 'description', 'locationText', 'comments'];
        for (const field of textFields) {
          const value = data[field as keyof ServiceRequestFormData] as string;
          if (value && /<script|javascript:|on\w+=/i.test(value)) {
            throw new Error(`${field} contains potentially harmful content. Please remove any script tags or suspicious content.`);
          }
        }

        // Generate idempotency key
        const idempotencyKey = `new-request-${Date.now()}-${Math.random()}`;
        
        // Convert the enhanced data to the basic API format with proper sanitization
        const apiData = {
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          locationText: `${data.streetAddress}, ${data.city}, ${data.postalCode}${data.landmark ? ` (Near: ${data.landmark})` : ''}`,
        };
        
        await createRequest(apiData, idempotencyKey);
        
        // Clear saved form data on successful submission
        clearSavedFormData();
        
        // Redirect to requests list on success
        window.location.href = '/citizen/requests';
      })();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit request');
      throw error;
    }
  };

  const handleCancel = () => {
    // Clear saved form data on cancel
    clearSavedFormData();
    window.location.href = '/citizen/requests';
  };

  // Step 1: Basic Information
  const BasicInfoStep = (
    <Box data-testid="cs-new-request-step-1">
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Request Title"
              margin="normal"
              error={!!errors.title}
              required
              inputProps={{
                maxLength: 120,
                'aria-describedby': errors.title ? FormValidationTestIds.FIELD_ERROR('new-request', 'title') : undefined,
              }}
              data-testid="cs-new-request-title"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('title', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.title}
              fieldName="title"
              formName="new-request"
              isValidating={isAsyncValidating.title}
              maxLength={120}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Detailed Description"
              multiline
              rows={4}
              margin="normal"
              error={!!errors.description}
              required
              inputProps={{
                maxLength: 2000,
                'aria-describedby': errors.description ? FormValidationTestIds.FIELD_ERROR('new-request', 'description') : undefined,
              }}
              data-testid="cs-new-request-description"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('description', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.description}
              fieldName="description"
              formName="new-request"
              isValidating={isAsyncValidating.description}
              maxLength={2000}
              showCharCount
              securityCheck
            />
            <FormHelperText>
              Please provide at least 10 words describing the issue in detail
            </FormHelperText>
          </Box>
        )}
      />

      <Controller
        name="dateOfRequest"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              type="date"
              label="Date of Request"
              margin="normal"
              error={!!errors.dateOfRequest}
              required
              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const dateValue = e.target.value ? new Date(e.target.value) : null;
                field.onChange(dateValue);
              }}
              inputProps={{
                max: new Date().toISOString().split('T')[0],
                min: (() => {
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return oneMonthAgo.toISOString().split('T')[0];
                })(),
                'aria-describedby': errors.dateOfRequest ? FormValidationTestIds.FIELD_ERROR('new-request', 'dateOfRequest') : undefined,
              }}
              data-testid="cs-new-request-date"
              helperText={errors.dateOfRequest?.message || "Select the date when the issue occurred (cannot be more than 1 month ago)"}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.dateOfRequest}
              fieldName="dateOfRequest"
              formName="new-request"
            />
          </Box>
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.category} required>
                <InputLabel>Category</InputLabel>
                <Select
                  {...field}
                  label="Category"
                  data-testid="cs-new-request-category"
                  aria-describedby={errors.category ? FormValidationTestIds.FIELD_ERROR('new-request', 'category') : undefined}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {categoryLabels[category]}
                    </MenuItem>
                  ))}
                </Select>
                <ValidationFeedback
                  field={field}
                  error={errors.category}
                  fieldName="category"
                  formName="new-request"
                />
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl margin="normal" error={!!errors.priority} required>
                <FormLabel component="legend">Priority</FormLabel>
                <RadioGroup
                  {...field}
                  row
                  data-testid="cs-new-request-priority"
                  aria-describedby={errors.priority ? FormValidationTestIds.FIELD_ERROR('new-request', 'priority') : undefined}
                >
                  <FormControlLabel value="LOW" control={<Radio />} label="Low" />
                  <FormControlLabel value="MEDIUM" control={<Radio />} label="Medium" />
                  <FormControlLabel value="HIGH" control={<Radio />} label="High" />
                  <FormControlLabel value="URGENT" control={<Radio />} label="Urgent" />
                </RadioGroup>
                <ValidationFeedback
                  field={field}
                  error={errors.priority}
                  fieldName="priority"
                  formName="new-request"
                />
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="isEmergency"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(e) => handleEmergencyChange(e.target.checked)}
                color="error"
                data-testid="cs-new-request-emergency"
                aria-label="Is this an emergency"
              />
            }
            label="Is this an emergency?"
          />
        )}
      />

      {watchedValues.isEmergency && (
        <Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Emergency requests require alternate contact information and will be prioritized accordingly.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );

  // Step 2: Location Information
  const LocationStep = (
    <Box data-testid="cs-new-request-step-2">
      <Typography variant="h6" gutterBottom>
        Location Information
      </Typography>
      
      <Controller
        name="streetAddress"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Street Address"
              margin="normal"
              error={!!errors.streetAddress}
              required
              inputProps={{
                maxLength: 100,
                'aria-describedby': errors.streetAddress ? FormValidationTestIds.FIELD_ERROR('new-request', 'streetAddress') : undefined,
              }}
              data-testid="cs-new-request-street-address"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('streetAddress', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.streetAddress}
              fieldName="streetAddress"
              formName="new-request"
              isValidating={isAsyncValidating.streetAddress}
              maxLength={100}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="City"
                  margin="normal"
                  error={!!errors.city}
                  required
                  inputProps={{
                    maxLength: 50,
                    'aria-describedby': errors.city ? FormValidationTestIds.FIELD_ERROR('new-request', 'city') : undefined,
                  }}
                  data-testid="cs-new-request-city"
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange('city', e.target.value);
                  }}
                />
                <ValidationFeedback
                  field={field}
                  error={errors.city}
                  fieldName="city"
                  formName="new-request"
                  isValidating={isAsyncValidating.city}
                  maxLength={50}
                  showCharCount
                  securityCheck
                />
              </Box>
            )}
          />
        </Grid>
        <Grid item xs={4}>
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Postal Code"
                  margin="normal"
                  error={!!errors.postalCode}
                  required
                  inputProps={{
                    maxLength: 10,
                    'aria-describedby': errors.postalCode ? FormValidationTestIds.FIELD_ERROR('new-request', 'postalCode') : undefined,
                  }}
                  data-testid="cs-new-request-postal-code"
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange('postalCode', e.target.value);
                  }}
                />
                <ValidationFeedback
                  field={field}
                  error={errors.postalCode}
                  fieldName="postalCode"
                  formName="new-request"
                  isValidating={isAsyncValidating.postalCode}
                  maxLength={10}
                  showCharCount
                  securityCheck
                />
              </Box>
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="locationText"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Additional Location Details"
              margin="normal"
              error={!!errors.locationText}
              required
              inputProps={{
                maxLength: 500,
                'aria-describedby': errors.locationText ? FormValidationTestIds.FIELD_ERROR('new-request', 'locationText') : 'location-helper-text',
              }}
              data-testid="cs-new-request-location-text"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('locationText', e.target.value);
              }}
            />
            <FormHelperText id="location-helper-text">
              Describe the exact location of the issue (minimum 10 characters)
            </FormHelperText>
            <ValidationFeedback
              field={field}
              error={errors.locationText}
              fieldName="locationText"
              formName="new-request"
              isValidating={isAsyncValidating.locationText}
              maxLength={500}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />
    </Box>
  );

  // Step 3: Contact & Services
  const ContactServicesStep = (
    <Box data-testid="cs-new-request-step-3">
      <Typography variant="h6" gutterBottom>
        Contact & Service Information
      </Typography>
      
      <Controller
        name="contactMethod"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Preferred Contact Method</InputLabel>
            <Select
              {...field}
              label="Preferred Contact Method"
              data-testid="cs-new-request-contact-method"
              aria-describedby={errors.contactMethod ? FormValidationTestIds.FIELD_ERROR('new-request', 'contactMethod') : undefined}
            >
              <MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="PHONE">Phone</MenuItem>
              <MenuItem value="SMS">SMS</MenuItem>
              <MenuItem value="MAIL">Mail</MenuItem>
            </Select>
            <ValidationFeedback
              field={field}
              error={errors.contactMethod}
              fieldName="contactMethod"
              formName="new-request"
            />
          </FormControl>
        )}
      />

      {watchedValues.isEmergency && (
        <Controller
          name="alternatePhone"
          control={control}
          render={({ field }) => (
            <Box>
              <TextField
                {...field}
                fullWidth
                label="Alternate Phone (Required for Emergency)"
                margin="normal"
                error={!!errors.alternatePhone}
                required
                inputProps={{
                  maxLength: 15,
                  'aria-describedby': errors.alternatePhone ? FormValidationTestIds.FIELD_ERROR('new-request', 'alternatePhone') : undefined,
                }}
                data-testid="cs-new-request-alternate-phone"
                onChange={(e) => {
                  field.onChange(e);
                  handleInputChange('alternatePhone', e.target.value);
                }}
              />
              <ValidationFeedback
                field={field}
                error={errors.alternatePhone}
                fieldName="alternatePhone"
                formName="new-request"
                isValidating={isAsyncValidating.alternatePhone}
              />
            </Box>
          )}
        />
      )}

      <Controller
        name="affectedServices"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.affectedServices} required>
            <FormLabel component="legend">Affected Services</FormLabel>
            <Box>
              <Autocomplete
                multiple
                options={['Water Supply', 'Electrical', 'Gas', 'Internet/Cable', 'Garbage Collection']}
                value={field.value || []}
                onChange={(_, value) => field.onChange(value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Select affected services"
                    error={!!errors.affectedServices}
                    inputProps={{
                      ...params.inputProps,
                      'aria-describedby': errors.affectedServices ? FormValidationTestIds.FIELD_ERROR('new-request', 'affectedServices') : undefined,
                    }}
                    data-testid="cs-new-request-affected-services"
                  />
                )}
              />
              <ValidationFeedback
                field={field}
                error={errors.affectedServices}
                fieldName="affectedServices"
                formName="new-request"
              />
            </Box>
          </FormControl>
        )}
      />
    </Box>
  );

  // Step 4: Additional Information
  const AdditionalInfoStep = (
    <Box data-testid="cs-new-request-step-4">
      <Typography variant="h6" gutterBottom>
        Additional Information
      </Typography>

      <Controller
        name="agreesToTerms"
        control={control}
        render={({ field }) => (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  color="primary"
                  required
                  data-testid="cs-new-request-agree-terms"
                  aria-label="Agree to terms and conditions"
                />
              }
              label="I agree to the terms and conditions and confirm that the information provided is accurate"
            />
            <ValidationFeedback
              field={field}
              error={errors.agreesToTerms}
              fieldName="agreesToTerms"
              formName="new-request"
            />
          </Box>
        )}
      />
    </Box>
  );

  // Step 5: Review
  const ReviewStep = (
    <Box data-testid="cs-new-request-step-5">
      <Typography variant="h6" gutterBottom>
        Review Your Request
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Basic Information</Typography>
              <Typography variant="body2"><strong>Title:</strong> {watchedValues.title}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {categoryLabels[watchedValues.category] || watchedValues.category}</Typography>
              <Typography variant="body2"><strong>Priority:</strong> {watchedValues.priority}</Typography>
              <Typography variant="body2"><strong>Emergency:</strong> {watchedValues.isEmergency ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Date of Request:</strong> {watchedValues.dateOfRequest ? new Date(watchedValues.dateOfRequest).toLocaleDateString() : 'Not selected'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Location</Typography>
              <Typography variant="body2"><strong>Address:</strong> {watchedValues.streetAddress}</Typography>
              <Typography variant="body2"><strong>City:</strong> {watchedValues.city}</Typography>
              <Typography variant="body2"><strong>Postal Code:</strong> {watchedValues.postalCode}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Description</Typography>
              <Typography variant="body1">{watchedValues.description}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Contact Information</Typography>
              <Typography variant="body2"><strong>Preferred Method:</strong> {watchedValues.contactMethod}</Typography>
              {watchedValues.alternatePhone && (
                <Typography variant="body2"><strong>Alternate Phone:</strong> {watchedValues.alternatePhone}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {submitError && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          data-testid={FormValidationTestIds.FORM_ERROR('new-request')}
        >
          {submitError}
        </Alert>
      )}

      {isBlocked && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Too many submission attempts. Please wait before trying again.
        </Alert>
      )}
    </Box>
  );

  const steps: StepperStep[] = [
    {
      label: 'Basic Information',
      component: BasicInfoStep,
    },
    {
      label: 'Location',
      component: LocationStep,
    },
    {
      label: 'Contact & Services',
      component: ContactServicesStep,
    },
    {
      label: 'Additional Details',
      component: AdditionalInfoStep,
    },
    {
      label: 'Review',
      component: ReviewStep,
    },
  ];

  return (
    <Box data-testid="cs-new-request-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Submit New Service Request
      </Typography>

      {isValidating && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary">
            Validating form...
          </Typography>
        </Box>
      )}

      <StepperWizard
        steps={steps}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting || isBlocked}
        submitLabel="Submit Request"
        testId="cs-new-request-wizard"
        onStepValidation={validateStep}
        onStepChange={handleStepChange}
      />
    </Box>
  );
};

export default NewRequestPage;