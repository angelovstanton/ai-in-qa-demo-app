import React, { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../lib/api';
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
  Button,
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
    const recentAttempts = (Array.isArray(attempts) ? attempts : []).filter(time => now - time < timeWindow);
    
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
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isAsyncValidating, setIsAsyncValidating] = useState<Record<string, boolean>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { createRequest, loading: isSubmitting, error: createError } = useCreateServiceRequest();
  const { isBlocked, checkRateLimit } = useRateLimit(5, 60000);

  // Load saved form data from localStorage
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        console.log('Loading saved form data from localStorage:', parsedData);
        
        // Check for data corruption (contactMethod data in address fields)
        if (parsedData.streetAddress === 'PHONE' || parsedData.streetAddress === 'EMAIL' || parsedData.streetAddress === 'SMS' || parsedData.streetAddress === 'MAIL') {
          console.warn('Detected corrupted localStorage data, clearing...');
          localStorage.removeItem(FORM_STORAGE_KEY);
          return null;
        }
        
        return parsedData;
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
    console.log('No saved form data found, using defaults');
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
      email: '',
      phone: '',
      alternatePhone: '',
      bestTimeToContact: '',
      mailingStreetAddress: '',
      mailingCity: '',
      mailingPostalCode: '',
      issueType: '',
      severity: 5,
      isRecurring: false,
      isEmergency: false,
      hasPermits: false,
      affectedServices: [],
      estimatedValue: 0,
      additionalContacts: [],
      // attachments: undefined, // Don't set default, let it be undefined
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
      // Create a copy without File objects for localStorage (Files can't be serialized)
      const dataToSave = {
        ...data,
        // Convert Date objects to ISO strings for serialization (with validation)
        dateOfRequest: data.dateOfRequest instanceof Date && !isNaN(data.dateOfRequest.getTime()) ? data.dateOfRequest.toISOString() : data.dateOfRequest,
        preferredDate: data.preferredDate instanceof Date && !isNaN(data.preferredDate.getTime()) ? data.preferredDate.toISOString() : data.preferredDate,
        attachments: data.attachments?.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type,
          // Don't save the actual File object
        })) // Leave as undefined if no attachments
      };
      console.log('Saving form data to localStorage:', dataToSave);
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
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
    } else {
      // Clear alternate phone when emergency is disabled
      setValue('alternatePhone', '');
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
    console.log(`Validating step ${stepIndex}`);
    
    const stepFields = getStepFields(stepIndex);
    if (!Array.isArray(stepFields)) {
      console.log(`Step ${stepIndex} has invalid field configuration:`, stepFields);
      return { isValid: false, errors: ['Invalid step configuration'] };
    }
    
    console.log(`Step ${stepIndex} fields:`, stepFields);
    
    const results = await Promise.all(stepFields.map(field => trigger(field as any)));
    const isValid = Array.isArray(results) ? results.every(result => result) : false;
    
    console.log(`Step ${stepIndex} validation results:`, results);
    
    // Collect errors for this step
    const stepErrors: string[] = [];
    stepFields.forEach(field => {
      const fieldError = getFieldError(errors, field);
      if (fieldError) {
        console.log(`Step ${stepIndex} field error:`, field, fieldError.message);
        stepErrors.push(`${getFieldLabel(field)}: ${fieldError.message}`);
      }
    });

    // Emergency validation is handled by schema, no need for duplicate check

    const finalResult = {
      isValid: isValid && stepErrors.length === 0,
      errors: stepErrors
    };
    
    console.log(`Step ${stepIndex} final validation:`, finalResult);
    
    return finalResult;
  }, [trigger, errors, watchedValues]);

  // Get fields for each step
  const getStepFields = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0: // Basic Information
        return ['title', 'description', 'category', 'priority', 'dateOfRequest'];
      case 1: // Location
        // Only require locationText for location step
        // Address fields are optional and can be filled in contact step for MAIL method
        return ['locationText'];
      case 2: // Contact & Services
        const contactFields = ['contactMethod'];
        
        // Add required contact field based on method
        if (watchedValues.contactMethod === 'EMAIL' || !watchedValues.contactMethod) {
          contactFields.push('email');
        } else if (watchedValues.contactMethod === 'PHONE' || watchedValues.contactMethod === 'SMS') {
          contactFields.push('phone');
        }
        // MAIL contact method doesn't require any additional fields (address is optional)
        
        // Add emergency phone if needed (only when emergency is enabled)
        if (watchedValues.isEmergency) {
          contactFields.push('alternatePhone');
        }
        
        return contactFields;
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
    
    // Clear any errors when navigating between steps to prevent conflicts
    if (toStep < fromStep) {
      // Going back - clear errors for current step
      setSubmitError(null);
    }
  }, []);

  const handleFormSubmit = async () => {
    if (!checkRateLimit()) {
      setSubmitError('Too many submission attempts. Please wait before trying again.');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    
    try {
      // Use handleSubmit to validate and get form data
      const formData = getValues();
      console.log('Form data being submitted:', formData);
      console.log('Current form errors:', errors);
      console.log('Form values for debugging:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        locationText: formData.locationText,
        agreesToTerms: formData.agreesToTerms,
        affectedServices: formData.affectedServices
      });
      
      // Validate all required fields
      const isValid = await trigger();
      if (!isValid) {
        console.log('Form validation failed:', errors);
        
        // Collect specific validation errors
        const errorMessages: string[] = [];
        
        if (errors.title) errorMessages.push(`Title: ${errors.title.message}`);
        if (errors.description) errorMessages.push(`Description: ${errors.description.message}`);
        if (errors.category) errorMessages.push(`Category: ${errors.category.message}`);
        if (errors.priority) errorMessages.push(`Priority: ${errors.priority.message}`);
        if (errors.dateOfRequest) errorMessages.push(`Date: ${errors.dateOfRequest.message}`);
        if (errors.streetAddress) errorMessages.push(`Street Address: ${errors.streetAddress.message}`);
        if (errors.city) errorMessages.push(`City: ${errors.city.message}`);
        if (errors.postalCode) errorMessages.push(`Postal Code: ${errors.postalCode.message}`);
        if (errors.locationText) errorMessages.push(`Location Details: ${errors.locationText.message}`);
        if (errors.contactMethod) errorMessages.push(`Contact Method: ${errors.contactMethod.message}`);
        if (errors.affectedServices) errorMessages.push(`Affected Services: ${errors.affectedServices.message}`);
        if (errors.agreesToTerms) errorMessages.push(`Terms Agreement: ${errors.agreesToTerms.message}`);
        if (errors.alternatePhone) errorMessages.push(`Alternate Phone: ${errors.alternatePhone.message}`);
        if (errors.issueType) errorMessages.push(`Issue Type: ${errors.issueType.message}`);
        if (errors.preferredTime) errorMessages.push(`Preferred Time: ${errors.preferredTime.message}`);
        // Don't show attachment errors since they're completely optional
        
        const errorMessage = errorMessages.length > 0 
          ? `Please fix the following errors:\n• ${errorMessages.join('\n• ')}`
          : 'Please fix all validation errors before submitting.';
          
        setSubmitError(errorMessage);
        return;
      }
      
      // Check minimum required fields manually
      if (!formData.title || formData.title.trim().length < 5) {
        setSubmitError('Title must be at least 5 characters long.');
        return;
      }
      
      if (!formData.description || formData.description.trim().length < 30) {
        setSubmitError('Description must be at least 30 characters long.');
        return;
      }
      
      if (!formData.category) {
        setSubmitError('Please select a category.');
        return;
      }
      
      if (!formData.locationText || formData.locationText.trim().length < 1) {
        setSubmitError('Please provide location details.');
        return;
      }
      
      if (!formData.agreesToTerms) {
        setSubmitError('You must agree to the terms and conditions.');
        return;
      }
      
      // Final XSS check before submission
      const textFields = ['title', 'description', 'locationText', 'comments'];
      for (const field of textFields) {
        const value = formData[field as keyof ServiceRequestFormData] as string;
        if (value && /<script|javascript:|on\w+=/i.test(value)) {
          setSubmitError(`${field} contains potentially harmful content. Please remove any script tags or suspicious content.`);
          return;
        }
      }

      // Generate idempotency key
      const idempotencyKey = `new-request-${Date.now()}-${Math.random()}`;
      
      // Build location text from available fields
      let locationText = formData.locationText || '';
      if (formData.streetAddress || formData.city || formData.postalCode) {
        const addressParts = [formData.streetAddress, formData.city, formData.postalCode].filter(Boolean);
        locationText = addressParts.join(', ');
        if (formData.landmark) {
          locationText += ` (Near: ${formData.landmark})`;
        }
      }
      
      // Convert the enhanced data to the API format
      const apiData = {
        // Basic fields
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority || 'MEDIUM',
        
        // Date fields (with validation)
        dateOfRequest: (() => {
          if (formData.dateOfRequest) {
            const date = new Date(formData.dateOfRequest);
            return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
          }
          return new Date().toISOString();
        })(),
        
        // Location fields
        streetAddress: formData.streetAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        locationText: locationText,
        landmark: formData.landmark,
        accessInstructions: formData.accessInstructions,
        
        // Contact fields
        contactMethod: formData.contactMethod,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        bestTimeToContact: formData.bestTimeToContact,
        
        // Mailing address (use mailing fields if provided, otherwise fall back to location fields)
        mailingStreetAddress: formData.mailingStreetAddress || formData.streetAddress,
        mailingCity: formData.mailingCity || formData.city,
        mailingPostalCode: formData.mailingPostalCode || formData.postalCode,
        
        // Issue details
        issueType: formData.issueType,
        severity: formData.severity,
        isRecurring: formData.isRecurring,
        isEmergency: formData.isEmergency,
        hasPermits: formData.hasPermits,
        
        // Service impact
        affectedServices: formData.affectedServices,
        estimatedValue: formData.estimatedValue,
        
        // Additional contacts
        additionalContacts: formData.additionalContacts,
        
        // User experience
        satisfactionRating: formData.satisfactionRating,
        formComments: formData.comments, // Map comments field to formComments
        
        // Legal and preferences
        agreesToTerms: formData.agreesToTerms,
        wantsUpdates: formData.wantsUpdates,
        
        // Scheduled service
        preferredDate: (() => {
          if (formData.preferredDate) {
            const date = new Date(formData.preferredDate);
            return !isNaN(date.getTime()) ? date.toISOString() : undefined;
          }
          return undefined;
        })(),
        preferredTime: formData.preferredTime,
      };
      
      console.log('API data being sent:', apiData);
      
      // Call the API to create the request
      const result = await createRequest(apiData, idempotencyKey);
      
      console.log('Request created successfully:', result);
      
      // Upload file if one was selected
      if (uploadedFile && result.id) {
        try {
          console.log('Uploading file:', uploadedFile.name);
          
          const formData = new FormData();
          formData.append('files', uploadedFile);
          
          const uploadResponse = await api.post(`/requests/${result.id}/attachments`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('File uploaded successfully:', uploadResponse.data);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          // Don't fail the entire submission if file upload fails
          setSubmitError('Request created successfully, but file upload failed. You can add attachments later.');
          return;
        }
      }
      
      // Clear saved form data on successful submission
      clearSavedFormData();
      
      // Show success message
      setSubmitSuccess('Your service request has been submitted successfully! Redirecting...');
      
      // Redirect to requests list on success after a short delay
      setTimeout(() => {
        window.location.href = '/citizen/requests';
      }, 2000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = createError || (error instanceof Error ? error.message : 'Failed to submit request');
      setSubmitError(errorMessage);
    }
  };

  const handleCancel = () => {
    // Clear saved form data on cancel
    clearSavedFormData();
    window.location.href = '/citizen/requests';
  };

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    // Clear any previous errors
    setSubmitError(null);
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setSubmitError(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed size is 5MB.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Update form with file info (for validation)
    setValue('attachments', [{
      name: file.name,
      size: file.size,
      type: file.type,
      file: file // Store the actual file object
    }]);
    
    console.log('File uploaded:', file.name, file.size, 'bytes');
  }, [setValue]);

  // Handle file removal
  const handleFileRemove = useCallback(() => {
    setUploadedFile(null);
    setImagePreview(null);
    setValue('attachments', undefined); // Set to undefined instead of empty array
    
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    console.log('File removed');
  }, [setValue]);

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
              value={(() => {
                if (!field.value) return '';
                try {
                  const date = new Date(field.value);
                  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                } catch {
                  return '';
                }
              })()}
              onChange={(e) => {
                try {
                  const dateValue = e.target.value ? new Date(e.target.value) : null;
                  // Validate the date before setting it
                  if (dateValue && !isNaN(dateValue.getTime())) {
                    field.onChange(dateValue);
                  } else if (!e.target.value) {
                    field.onChange(null);
                  }
                } catch {
                  // If date parsing fails, set to null
                  field.onChange(null);
                }
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
              label="Street Address (Optional)"
              margin="normal"
              error={!!errors.streetAddress}
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
                  label="City (Optional)"
                  margin="normal"
                  error={!!errors.city}
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
                  label="Postal Code (Optional)"
                  margin="normal"
                  error={!!errors.postalCode}
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
              value={field.value || 'EMAIL'} // Ensure there's always a value
              label="Preferred Contact Method"
              data-testid="cs-new-request-contact-method"
              aria-describedby={errors.contactMethod ? FormValidationTestIds.FIELD_ERROR('new-request', 'contactMethod') : undefined}
              onChange={(e) => {
                console.log('Contact method changed to:', e.target.value);
                field.onChange(e.target.value);
              }}
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

      {/* Email field - shown when EMAIL is selected */}
      {(watchedValues.contactMethod === 'EMAIL' || !watchedValues.contactMethod) && (
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Box>
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                error={!!errors.email}
                required
                inputProps={{
                  maxLength: 254,
                  'aria-describedby': errors.email ? FormValidationTestIds.FIELD_ERROR('new-request', 'email') : undefined,
                }}
                data-testid="cs-new-request-email"
                onChange={(e) => {
                  field.onChange(e);
                  handleInputChange('email', e.target.value);
                }}
              />
              <ValidationFeedback
                field={field}
                error={errors.email}
                fieldName="email"
                formName="new-request"
                isValidating={isAsyncValidating.email}
              />
            </Box>
          )}
        />
      )}

      {/* Phone field - shown when PHONE or SMS is selected */}
      {(watchedValues.contactMethod === 'PHONE' || watchedValues.contactMethod === 'SMS') && (
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Box>
              <TextField
                {...field}
                fullWidth
                label="Phone Number"
                type="tel"
                margin="normal"
                error={!!errors.phone}
                required
                inputProps={{
                  maxLength: 15,
                  'aria-describedby': errors.phone ? FormValidationTestIds.FIELD_ERROR('new-request', 'phone') : undefined,
                }}
                data-testid="cs-new-request-phone"
                onChange={(e) => {
                  field.onChange(e);
                  handleInputChange('phone', e.target.value);
                }}
              />
              <ValidationFeedback
                field={field}
                error={errors.phone}
                fieldName="phone"
                formName="new-request"
                isValidating={isAsyncValidating.phone}
              />
            </Box>
          )}
        />
      )}

      {/* Address fields - shown when MAIL is selected */}
      {watchedValues.contactMethod === 'MAIL' && (
        <Box>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Mailing Address (Optional)
          </Typography>
          
          <Controller
            name="mailingStreetAddress"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Street Address"
                  margin="normal"
                  error={!!errors.mailingStreetAddress}
                  inputProps={{
                    maxLength: 100,
                    'aria-describedby': errors.mailingStreetAddress ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingStreetAddress') : undefined,
                  }}
                  data-testid="cs-new-request-mail-address"
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange('mailingStreetAddress', e.target.value);
                  }}
                />
                <ValidationFeedback
                  field={field}
                  error={errors.mailingStreetAddress}
                  fieldName="mailingStreetAddress"
                  formName="new-request"
                  isValidating={isAsyncValidating.mailingStreetAddress}
                />
              </Box>
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="mailingCity"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      margin="normal"
                      error={!!errors.mailingCity}
                      inputProps={{
                        maxLength: 50,
                        'aria-describedby': errors.mailingCity ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingCity') : undefined,
                      }}
                      data-testid="cs-new-request-mail-city"
                      onChange={(e) => {
                        field.onChange(e);
                        handleInputChange('mailingCity', e.target.value);
                      }}
                    />
                    <ValidationFeedback
                      field={field}
                      error={errors.mailingCity}
                      fieldName="mailingCity"
                      formName="new-request"
                      isValidating={isAsyncValidating.mailingCity}
                    />
                  </Box>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="mailingPostalCode"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                      margin="normal"
                      error={!!errors.mailingPostalCode}
                      inputProps={{
                        maxLength: 10,
                        'aria-describedby': errors.mailingPostalCode ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingPostalCode') : undefined,
                      }}
                      data-testid="cs-new-request-mail-postal"
                      onChange={(e) => {
                        field.onChange(e);
                        handleInputChange('mailingPostalCode', e.target.value);
                      }}
                    />
                    <ValidationFeedback
                      field={field}
                      error={errors.mailingPostalCode}
                      fieldName="mailingPostalCode"
                      formName="new-request"
                      isValidating={isAsyncValidating.mailingPostalCode}
                    />
                  </Box>
                )}
              />
            </Grid>
          </Grid>
        </Box>
      )}

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
            <FormControl fullWidth margin="normal" error={!!errors.affectedServices}>
              <FormLabel component="legend">Affected Services (Optional)</FormLabel>
            <Box>
              <Autocomplete
                multiple
                options={['Water Supply', 'Electrical', 'Gas', 'Internet/Cable', 'Garbage Collection']}
                value={Array.isArray(field.value) ? field.value : []}
                onChange={(_, value) => field.onChange(Array.isArray(value) ? value : [])}
                renderTags={(value, getTagProps) =>
                  (Array.isArray(value) ? value : []).map((option, index) => (
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

      {/* Image Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Attach Photo (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a photo to help illustrate the issue. Supported formats: JPG, PNG, GIF (max 5MB)
        </Typography>
        <Box
          sx={{
            border: '2px dashed #ddd',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: '#fafafa',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          {!uploadedFile ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="image-upload"
                data-testid="cs-new-request-image-upload"
              />
              <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" color="primary">
                    📷
                  </Typography>
                  <Typography variant="body1">
                    Click to upload an image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    or drag and drop here
                  </Typography>
                </Box>
              </label>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}
                />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="success.dark">
                  ✓ {uploadedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleFileRemove}
                data-testid="cs-remove-image"
              >
                Remove
              </Button>
            </Box>
          )}
        </Box>
      </Box>

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
              <Typography variant="body2"><strong>Address:</strong> {watchedValues.streetAddress || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>City:</strong> {watchedValues.city || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>Postal Code:</strong> {watchedValues.postalCode || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>Location Details:</strong> {watchedValues.locationText || 'Not provided'}</Typography>
              {watchedValues.landmark && <Typography variant="body2"><strong>Landmark:</strong> {watchedValues.landmark}</Typography>}
              {watchedValues.accessInstructions && <Typography variant="body2"><strong>Access Instructions:</strong> {watchedValues.accessInstructions}</Typography>}
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Contact Information</Typography>
              <Typography variant="body2"><strong>Preferred Contact Method:</strong> {watchedValues.contactMethod || 'EMAIL'}</Typography>
              {watchedValues.email && <Typography variant="body2"><strong>Email:</strong> {watchedValues.email}</Typography>}
              {watchedValues.phone && <Typography variant="body2"><strong>Phone:</strong> {watchedValues.phone}</Typography>}
              {watchedValues.alternatePhone && <Typography variant="body2"><strong>Alternate Phone:</strong> {watchedValues.alternatePhone}</Typography>}
              {watchedValues.bestTimeToContact && <Typography variant="body2"><strong>Best Time to Contact:</strong> {watchedValues.bestTimeToContact}</Typography>}
              {/* Mailing Address (when MAIL is selected) */}
              {watchedValues.contactMethod === 'MAIL' && (
                <>
                  {watchedValues.mailingStreetAddress && <Typography variant="body2"><strong>Mailing Address:</strong> {watchedValues.mailingStreetAddress}</Typography>}
                  {watchedValues.mailingCity && <Typography variant="body2"><strong>Mailing City:</strong> {watchedValues.mailingCity}</Typography>}
                  {watchedValues.mailingPostalCode && <Typography variant="body2"><strong>Mailing Postal Code:</strong> {watchedValues.mailingPostalCode}</Typography>}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Issue Details</Typography>
              {watchedValues.issueType && <Typography variant="body2"><strong>Issue Type:</strong> {watchedValues.issueType}</Typography>}
              {watchedValues.severity && <Typography variant="body2"><strong>Severity:</strong> {watchedValues.severity}/10</Typography>}
              <Typography variant="body2"><strong>Recurring Issue:</strong> {watchedValues.isRecurring ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Has Permits:</strong> {watchedValues.hasPermits ? 'Yes' : 'No'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {watchedValues.affectedServices && watchedValues.affectedServices.length > 0 ? (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Affected Services</Typography>
                {watchedValues.affectedServices.map((service, index) => (
                  <Typography key={index} variant="body2">• {service}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ) : null}

        {watchedValues.estimatedValue && watchedValues.estimatedValue > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Estimated Value</Typography>
                <Typography variant="body2"><strong>Estimated Impact Value:</strong> ${watchedValues.estimatedValue}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {watchedValues.preferredDate && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Scheduling Preferences</Typography>
                <Typography variant="body2"><strong>Preferred Date:</strong> {new Date(watchedValues.preferredDate).toLocaleDateString()}</Typography>
                {watchedValues.preferredTime && <Typography variant="body2"><strong>Preferred Time:</strong> {watchedValues.preferredTime}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        )}

        {uploadedFile && imagePreview && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Attachments</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Attached image"
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}
                  />
                  <Box>
                    <Typography variant="body2">📷 {uploadedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {watchedValues.formComments && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Additional Comments</Typography>
                <Typography variant="body1">{watchedValues.formComments}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}


      </Grid>

      {submitError && (
        <Alert severity="error" sx={{ mt: 2 }} data-testid="cs-submit-error">
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mt: 2 }} data-testid="cs-submit-success">
          {submitSuccess}
        </Alert>
      )}

      {isBlocked && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Too many submission attempts. Please wait before trying again.
        </Alert>
      )}
    </Box>
  );

  // Wrap step components to prevent rendering errors
  const safeStepWrapper = (stepComponent: React.ReactNode, stepName: string) => {
    try {
      return stepComponent;
    } catch (error) {
      console.error(`Error rendering ${stepName}:`, error);
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">
            Error loading {stepName}. Please try refreshing the page.
          </Typography>
        </Box>
      );
    }
  };

  const steps: StepperStep[] = [
    {
      label: 'Basic Information',
      component: safeStepWrapper(BasicInfoStep, 'Basic Information'),
    },
    {
      label: 'Location',
      component: safeStepWrapper(LocationStep, 'Location'),
    },
    {
      label: 'Contact & Services',
      component: safeStepWrapper(ContactServicesStep, 'Contact & Services'),
    },
    {
      label: 'Additional Details',
      component: safeStepWrapper(AdditionalInfoStep, 'Additional Details'),
    },
    {
      label: 'Review',
      component: safeStepWrapper(ReviewStep, 'Review'),
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

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="cs-form-submit-error">
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="cs-form-submit-success">
          {submitSuccess}
        </Alert>
      )}

      {/* Temporary debug button - remove in production */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Debug Info:</Typography>
        <Button 
          size="small" 
          onClick={() => {
            console.log('=== DEBUG INFO ===');
            console.log('Form Values:', getValues());
            console.log('Form Errors:', errors);
            console.log('Form Valid:', Object.keys(errors).length === 0);
            console.log('=================');
          }}
        >
          Log Form State
        </Button>
      </Box>

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