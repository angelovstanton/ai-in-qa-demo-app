import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Alert,
  LinearProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  InfoOutlined,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, type RegistrationFormData } from '../schemas/formSchemas';
import { 
  calculatePasswordStrength, 
  validateBusinessEmail,
  Sanitization,
  XSSPrevention 
} from '../utils/validation';
import { debounce } from 'lodash';

/**
 * Comprehensive Registration Form Component
 * Demonstrates all validation features and best practices for the AI in QA Demo Application
 */

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function RegistrationForm({
  onSubmit,
  onSuccess,
  onError,
}: RegistrationFormProps) {
  // Form state management
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    trigger,
    getValues,
    setError,
    clearErrors,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      accountType: 'CITIZEN',
      preferredLanguage: 'EN',
      communicationMethod: 'EMAIL',
      agreesToTerms: false,
      agreesToPrivacy: false,
      marketingEmails: false,
      serviceUpdates: true,
    },
  });

  // Watch specific fields for conditional validation
  const watchedFields = useWatch({
    control,
    name: ['password', 'accountType', 'email', 'securityQuestion'],
  });
  const [password, accountType, email, securityQuestion] = watchedFields;

  // Component state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);

  // Form steps for wizard interface
  const steps = [
    'Personal Information',
    'Contact Details', 
    'Account Setup',
    'Preferences',
    'Review & Submit'
  ];

  // Password strength calculation
  const updatePasswordStrength = useCallback((pwd: string) => {
    if (pwd) {
      const strength = calculatePasswordStrength(pwd);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, []);

  // Real-time password validation
  React.useEffect(() => {
    if (password) {
      updatePasswordStrength(password);
    }
  }, [password, updatePasswordStrength]);

  // Debounced email uniqueness check
  const checkEmailUniqueness = useMemo(
    () => debounce(async (emailValue: string) => {
      if (!emailValue || errors.email) return;
      
      setIsEmailChecking(true);
      try {
        // Simulate API call to check email uniqueness
        const response = await fetch(`/api/v1/auth/check-email?email=${emailValue}`);
        const result = await response.json();
        
        if (!result.available) {
          setError('email', {
            type: 'custom',
            message: 'This email address is already registered'
          });
        } else {
          clearErrors('email');
        }
      } catch (error) {
        console.error('Email check failed:', error);
      } finally {
        setIsEmailChecking(false);
      }
    }, 500),
    [setError, clearErrors, errors.email]
  );

  // Trigger email check when email changes
  React.useEffect(() => {
    if (email && !errors.email) {
      checkEmailUniqueness(email);
    }
  }, [email, checkEmailUniqueness, errors.email]);

  // Business email validation for business accounts
  React.useEffect(() => {
    if (accountType === 'BUSINESS' && email) {
      const isBusinessEmail = validateBusinessEmail(email);
      if (!isBusinessEmail) {
        setError('email', {
          type: 'custom',
          message: 'Business accounts require a business email address'
        });
      } else {
        clearErrors('email');
      }
    }
  }, [accountType, email, setError, clearErrors]);

  // Form submission with comprehensive error handling
  const onFormSubmit = async (data: RegistrationFormData) => {
    setSubmitError(null);
    
    try {
      // Additional security checks
      const hasXSS = Object.values(data).some((value) => {
        if (typeof value === 'string') {
          return XSSPrevention.containsXSS(value);
        }
        return false;
      });

      if (hasXSS) {
        throw new Error('Input contains potentially malicious content');
      }

      // Sanitize all string inputs
      const sanitizedData = {
        ...data,
        firstName: Sanitization.sanitizeForDatabase(data.firstName),
        lastName: Sanitization.sanitizeForDatabase(data.lastName),
        streetAddress: Sanitization.sanitizeForDatabase(data.streetAddress),
        businessName: data.businessName ? Sanitization.sanitizeForDatabase(data.businessName) : undefined,
        securityAnswer: data.securityAnswer ? Sanitization.sanitizeForDatabase(data.securityAnswer) : undefined,
      };

      await onSubmit(sanitizedData);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Step navigation
  const handleNext = async () => {
    const stepFields = getStepFields(currentStep);
    const isStepValid = await trigger(stepFields);
    
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Get fields for current step
  function getStepFields(step: number): (keyof RegistrationFormData)[] {
    switch (step) {
      case 0:
        return ['firstName', 'lastName', 'email'];
      case 1:
        return ['phone', 'streetAddress', 'city', 'state', 'postalCode', 'country'];
      case 2:
        return ['password', 'confirmPassword', 'accountType', 'businessName'];
      case 3:
        return ['preferredLanguage', 'communicationMethod', 'securityQuestion', 'securityAnswer'];
      case 4:
        return ['agreesToTerms', 'agreesToPrivacy'];
      default:
        return [];
    }
  }

  // Password strength indicator
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'error';
    if (passwordStrength.score <= 3) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 3) return 'Medium';
    return 'Strong';
  };

  // Character count component
  const CharacterCount = ({ value, maxLength, testId }: {
    value: string;
    maxLength: number;
    testId: string;
  }) => (
    <Typography
      variant="caption"
      color={value.length > maxLength * 0.9 ? 'error' : 'textSecondary'}
      data-testid={testId}
    >
      {value.length}/{maxLength}
    </Typography>
  );

  // Enhanced text field with validation
  const ValidatedTextField = ({
    name,
    label,
    type = 'text',
    required = false,
    multiline = false,
    rows,
    maxLength,
    helperText,
    showCharCount = false,
    endAdornment,
    ...props
  }: any) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type={type}
          multiline={multiline}
          rows={rows}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || helperText}
          required={required}
          fullWidth
          margin="normal"
          data-testid={`cs-registration-${name}`}
          inputProps={{
            maxLength,
            'aria-describedby': fieldState.error ? `cs-registration-error-${name}` : undefined,
            'aria-invalid': !!fieldState.error,
          }}
          InputProps={{
            endAdornment: showCharCount && maxLength ? (
              <InputAdornment position="end">
                <CharacterCount
                  value={field.value || ''}
                  maxLength={maxLength}
                  testId={`cs-registration-char-count-${name}`}
                />
              </InputAdornment>
            ) : endAdornment,
          }}
        />
      )}
    />
  );

  // Enhanced select field
  const ValidatedSelect = ({ name, label, options, required = false, ...props }: any) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth margin="normal" error={!!fieldState.error} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            {...props}
            label={label}
            data-testid={`cs-registration-${name}`}
            aria-describedby={fieldState.error ? `cs-registration-error-${name}` : undefined}
            aria-invalid={!!fieldState.error}
          >
            {options.map((option: any) => (
              <MenuItem
                key={option.value}
                value={option.value}
                data-testid={`cs-registration-option-${option.value}`}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && (
            <FormHelperText
              id={`cs-registration-error-${name}`}
              role="alert"
              aria-live="polite"
            >
              {fieldState.error.message}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ValidatedTextField
                name="firstName"
                label="First Name"
                required
                maxLength={50}
                showCharCount
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ValidatedTextField
                name="lastName"
                label="Last Name"
                required
                maxLength={50}
                showCharCount
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedTextField
                name="email"
                label="Email Address"
                type="email"
                required
                endAdornment={
                  isEmailChecking && (
                    <InputAdornment position="end">
                      <LinearProgress size={20} />
                    </InputAdornment>
                  )
                }
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ValidatedTextField
                name="phone"
                label="Phone Number"
                required
                helperText="Include country code (e.g., +1234567890)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ValidatedTextField
                name="alternatePhone"
                label="Alternate Phone (Optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedTextField
                name="streetAddress"
                label="Street Address"
                required
                maxLength={100}
                showCharCount
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ValidatedTextField
                name="city"
                label="City"
                required
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ValidatedTextField
                name="state"
                label="State/Province"
                required
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ValidatedTextField
                name="postalCode"
                label="Postal Code"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedTextField
                name="country"
                label="Country"
                required
                maxLength={50}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ValidatedSelect
                name="accountType"
                label="Account Type"
                required
                options={[
                  { value: 'CITIZEN', label: 'Individual Citizen' },
                  { value: 'BUSINESS', label: 'Business/Organization' },
                ]}
              />
            </Grid>
            
            {accountType === 'BUSINESS' && (
              <Grid item xs={12}>
                <ValidatedTextField
                  name="businessName"
                  label="Business Name"
                  required={accountType === 'BUSINESS'}
                  maxLength={100}
                  showCharCount
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <ValidatedTextField
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              
              {password && (
                <Box mt={1} data-testid="cs-registration-password-strength">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption">
                      Password Strength: {getPasswordStrengthText()}
                    </Typography>
                    {passwordStrength.score >= 4 ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : passwordStrength.score >= 2 ? (
                      <Warning color="warning" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={(passwordStrength.score / 5) * 100}
                    color={getPasswordStrengthColor()}
                    sx={{ mt: 0.5 }}
                  />
                  
                  {passwordStrength.feedback.length > 0 && (
                    <Box mt={1}>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          color="textSecondary"
                          display="block"
                        >
                          • {feedback}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <ValidatedTextField
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label="toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ValidatedSelect
                name="preferredLanguage"
                label="Preferred Language"
                required
                options={[
                  { value: 'EN', label: 'English' },
                  { value: 'BG', label: 'Bulgarian' },
                  { value: 'ES', label: 'Spanish' },
                  { value: 'FR', label: 'French' },
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ValidatedSelect
                name="communicationMethod"
                label="Preferred Communication"
                required
                options={[
                  { value: 'EMAIL', label: 'Email' },
                  { value: 'PHONE', label: 'Phone' },
                  { value: 'SMS', label: 'SMS/Text' },
                  { value: 'MAIL', label: 'Postal Mail' },
                ]}
              />
            </Grid>

            <Grid item xs={12}>
              <ValidatedSelect
                name="securityQuestion"
                label="Security Question (Optional)"
                options={[
                  { value: '', label: 'Select a security question...' },
                  { value: 'pet', label: "What was your first pet's name?" },
                  { value: 'school', label: 'What elementary school did you attend?' },
                  { value: 'city', label: 'What city were you born in?' },
                  { value: 'mother', label: "What is your mother's maiden name?" },
                ]}
              />
            </Grid>

            {securityQuestion && (
              <Grid item xs={12}>
                <ValidatedTextField
                  name="securityAnswer"
                  label="Security Answer"
                  required={!!securityQuestion}
                  maxLength={100}
                  showCharCount
                  helperText="This will help you recover your account if needed"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              
              <Controller
                name="serviceUpdates"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        data-testid="cs-registration-service-updates"
                      />
                    }
                    label="Receive important service updates"
                  />
                )}
              />
              
              <Controller
                name="marketingEmails"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        data-testid="cs-registration-marketing-emails"
                      />
                    }
                    label="Receive promotional emails and newsletters"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Review Your Information
                </Typography>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  Please review your information before submitting. You can go back to make changes if needed.
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography><strong>Name:</strong> {getValues('firstName')} {getValues('lastName')}</Typography>
                  <Typography><strong>Email:</strong> {getValues('email')}</Typography>
                  <Typography><strong>Phone:</strong> {getValues('phone')}</Typography>
                  <Typography><strong>Account Type:</strong> {getValues('accountType')}</Typography>
                  {accountType === 'BUSINESS' && (
                    <Typography><strong>Business:</strong> {getValues('businessName')}</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="agreesToTerms"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        data-testid="cs-registration-terms"
                        color={fieldState.error ? 'error' : 'primary'}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>I agree to the </span>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => window.open('/terms', '_blank')}
                        >
                          Terms and Conditions
                        </Button>
                      </Box>
                    }
                  />
                )}
              />
              {errors.agreesToTerms && (
                <FormHelperText error id="cs-registration-error-terms">
                  {errors.agreesToTerms.message}
                </FormHelperText>
              )}
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="agreesToPrivacy"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        data-testid="cs-registration-privacy"
                        color={fieldState.error ? 'error' : 'primary'}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>I agree to the </span>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => window.open('/privacy', '_blank')}
                        >
                          Privacy Policy
                        </Button>
                      </Box>
                    }
                  />
                )}
              />
              {errors.agreesToPrivacy && (
                <FormHelperText error id="cs-registration-error-privacy">
                  {errors.agreesToPrivacy.message}
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box data-testid="cs-registration-form">
      {/* Progress Stepper */}
      <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {submitError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          data-testid="cs-registration-error"
        >
          {submitError}
        </Alert>
      )}

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit(onFormSubmit)}>
        {renderStepContent(currentStep)}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={currentStep === 0}
            onClick={handleBack}
            data-testid="cs-registration-back"
          >
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !isValid}
              data-testid="cs-registration-submit"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              data-testid="cs-registration-next"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading Overlay */}
      {isSubmitting && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0,0,0,0.3)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
          data-testid="cs-registration-submitting"
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>Creating your account...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}