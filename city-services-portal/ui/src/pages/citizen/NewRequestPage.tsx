import React, { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../lib/api';
import {
  Box,
  Typography,
  Alert,
  Button,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import StepperWizard, { StepperStep } from '../../components/StepperWizard';
import { useCreateServiceRequest } from '../../hooks/useServiceRequests';
import { serviceRequestSchema, ServiceRequestFormData, FormValidationTestIds } from '../../schemas/formSchemas';

// Import step components
import BasicInfoStep from '../../components/forms/BasicInfoStep';
import LocationStep from '../../components/forms/LocationStep';
import ContactServicesStep from '../../components/forms/ContactServicesStep';
import AdditionalInfoStep from '../../components/forms/AdditionalInfoStep';
import ReviewStep from '../../components/forms/ReviewStep';

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
  }, [])

  const {
    control,
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
      contactMethod: 'EMAIL', // Ensure default contact method
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
      attachments: undefined, // Keep as undefined for completely optional
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
        return ['locationText'];
      case 2: // Contact & Services
        const contactFields = ['contactMethod', 'phone']; // Phone is always required

        // Add required contact field based on method
        const currentContactMethod = watchedValues.contactMethod || 'EMAIL';
        
        if (currentContactMethod === 'EMAIL') {
          contactFields.push('email');
        }

        // Add emergency phone if needed
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
      email: 'Email Address',
      phone: 'Phone Number',
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
      const formData = getValues();
      console.log('Form data being submitted:', formData);
      console.log('Current form errors:', errors);
      
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
        if (errors.locationText) errorMessages.push(`Location Details: ${errors.locationText.message}`);
        if (errors.contactMethod) errorMessages.push(`Contact Method: ${errors.contactMethod.message}`);
        if (errors.email) errorMessages.push(`Email: ${errors.email.message}`);
        if (errors.phone) errorMessages.push(`Phone: ${errors.phone.message}`);
        if (errors.agreesToTerms) errorMessages.push(`Terms Agreement: ${errors.agreesToTerms.message}`);
        if (errors.alternatePhone) errorMessages.push(`Alternate Phone: ${errors.alternatePhone.message}`);
        
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
      
      // Phone is always required
      if (!formData.phone || formData.phone.trim().length === 0) {
        setSubmitError('Phone number is required.');
        return;
      }

      // Email is required when EMAIL is selected as contact method
      if (formData.contactMethod === 'EMAIL' && (!formData.email || formData.email.trim().length === 0)) {
        setSubmitError('Email address is required when email is selected as contact method.');
        return;
      }
      
      // Emergency requests require alternate phone
      if (formData.isEmergency && (!formData.alternatePhone || formData.alternatePhone.trim().length === 0)) {
        setSubmitError('Alternate phone number is required for emergency requests.');
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
      
      // Upload file if one was selected - this is the critical fix for file persistence
      if (uploadedFile && result.id) {
        try {
          console.log('Uploading file:', uploadedFile.name);
          
          const formData = new FormData();
          formData.append('files', uploadedFile);
          
          // Add the idempotency key for file upload as well
          const uploadResponse = await api.post(`/requests/${result.id}/attachments`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Idempotency-Key': `${idempotencyKey}-file`,
            },
          });
          
          console.log('File uploaded successfully:', uploadResponse.data);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          // Show warning but don't fail the entire submission
          setSubmitError('Request created successfully, but file upload failed. You can add attachments later by editing the request.');
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
      component: safeStepWrapper(
        <BasicInfoStep
          control={control}
          errors={errors}
          watchedValues={watchedValues}
          isAsyncValidating={isAsyncValidating}
          handleInputChange={handleInputChange}
          handleEmergencyChange={handleEmergencyChange}
          ValidationFeedback={ValidationFeedback}
          categories={categories}
          categoryLabels={categoryLabels}
        />,
        'Basic Information'
      ),
    },
    {
      label: 'Location',
      component: safeStepWrapper(
        <LocationStep
          control={control}
          errors={errors}
          isAsyncValidating={isAsyncValidating}
          handleInputChange={handleInputChange}
          ValidationFeedback={ValidationFeedback}
        />,
        'Location'
      ),
    },
    {
      label: 'Contact & Services',
      component: safeStepWrapper(
        <ContactServicesStep
          control={control}
          errors={errors}
          watchedValues={watchedValues}
          isAsyncValidating={isAsyncValidating}
          handleInputChange={handleInputChange}
          ValidationFeedback={ValidationFeedback}
        />,
        'Contact & Services'
      ),
    },
    {
      label: 'Additional Details',
      component: safeStepWrapper(
        <AdditionalInfoStep
          control={control}
          errors={errors}
          uploadedFile={uploadedFile}
          imagePreview={imagePreview}
          handleFileUpload={handleFileUpload}
          handleFileRemove={handleFileRemove}
          ValidationFeedback={ValidationFeedback}
        />,
        'Additional Details'
      ),
    },
    {
      label: 'Review',
      component: safeStepWrapper(
        <ReviewStep
          watchedValues={watchedValues}
          categoryLabels={categoryLabels}
          uploadedFile={uploadedFile}
          imagePreview={imagePreview}
          submitError={submitError}
          submitSuccess={submitSuccess}
          isBlocked={isBlocked}
        />,
        'Review'
      ),
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