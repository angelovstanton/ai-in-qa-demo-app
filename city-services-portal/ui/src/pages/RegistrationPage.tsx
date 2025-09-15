import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { countries } from '../data/countries';
import RegistrationSuccess from '../components/RegistrationSuccess';

// Enhanced validation schema for registration
const registrationSchema = z.object({
  // Basic Information
  firstName: z.string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я]+([\s'-][a-zA-ZÀ-ÿĀ-žА-я]+)*$/, 
      'First name must contain only letters (special characters allowed: space, hyphen, apostrophe between words)')
    .refine(val => val.length >= 2, 'First name must be at least 2 characters'),
  
  lastName: z.string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я]+([\s'-][a-zA-ZÀ-ÿĀ-žА-я]+)*$/, 
      'Last name must contain only letters (special characters allowed: space, hyphen, apostrophe between words)')
    .refine(val => val.length >= 2, 'Last name must be at least 2 characters'),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/, 
      'Email must be in format: username@domain.com')
    .refine(val => !val.includes('..'), 'Email cannot contain consecutive dots')
    .refine(val => {
      const [localPart] = val.split('@');
      return localPart.length >= 1 && localPart.length <= 64;
    }, 'Email username must be between 1 and 64 characters'),
  
  // Password Requirements with enhanced validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#^()]/, 'Password must contain at least one special character (@$!%*?&#^())')
    .refine(val => !/\s/.test(val), 'Password cannot contain spaces')
    .refine(val => !/(012|123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210)/.test(val), 
      'Password cannot contain sequential numbers')
    .refine(val => !/(.)\1{2,}/.test(val), 'Password cannot contain more than 2 repeated characters'),
  
  confirmPassword: z.string(),
  
  // Contact Information with international support
  phone: z.string()
    .trim()
    .regex(/^[+]?[1-9][0-9]{9,14}$/, 'Phone number must start with country code (+1) or area code, 10-15 digits total')
    .refine(val => {
      const cleaned = val.replace(/[^0-9]/g, '');
      return cleaned.length >= 10 && cleaned.length <= 15;
    }, 'Phone number must be 10-15 digits')
    .refine(val => {
      // Check for valid phone patterns (not all same digit, not sequential)
      const cleaned = val.replace(/[^0-9]/g, '');
      return !/^(\d)\1+$/.test(cleaned) && !/^(012345|123456|234567|345678|456789|567890|678901|789012|890123|901234)/.test(cleaned);
    }, 'Please enter a valid phone number'),
  
  // Address Information with enhanced validation
  streetAddress: z.string()
    .trim()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address cannot exceed 100 characters')
    .regex(/^[0-9]+[a-zA-Z0-9\s,.-]*$/, 'Street address must start with a number (e.g., 123 Main St)')
    .refine(val => {
      // Must contain at least one number and one letter
      return /\d/.test(val) && /[a-zA-Z]/.test(val);
    }, 'Street address must contain both numbers and letters'),
  
  city: z.string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я]+([\s'-][a-zA-ZÀ-ÿĀ-žА-я]+)*$/, 
      'City name must contain only letters'),
  
  state: z.string()
    .trim()
    .min(2, 'State/Province must be at least 2 characters')
    .max(50, 'State/Province cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я]+([\s'-][a-zA-ZÀ-ÿĀ-žА-я]+)*$/, 
      'State/Province must contain only letters'),
  
  postalCode: z.string()
    .trim()
    .refine(val => {
      // US ZIP code (5 digits or 5+4)
      const usZip = /^\d{5}(-\d{4})?$/;
      // Canadian postal code
      const caPostal = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i;
      // UK postal code
      const ukPostal = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;
      // Generic international (alphanumeric with optional spaces/hyphens)
      const generic = /^[A-Z0-9]{3,10}$/i;
      
      return usZip.test(val) || caPostal.test(val) || ukPostal.test(val) || generic.test(val);
    }, 'Invalid postal/ZIP code format (examples: 12345, K1A 0B1, SW1A 1AA)'),
  
  country: z.string()
    .min(2, 'Country is required')
    .max(50, 'Country name too long'),
  
  // Communication Preferences
  preferredLanguage: z.enum(['EN', 'BG', 'ES', 'FR']),
  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL']),
  marketingEmails: z.boolean(),
  serviceUpdates: z.boolean(),
  
  // Account Type
  accountType: z.enum(['CITIZEN', 'BUSINESS']),
  businessName: z.string().optional(),
  
  // Legal
  agreesToTerms: z.boolean().refine(val => val === true, 'You must agree to terms and conditions'),
  agreesToPrivacy: z.boolean().refine(val => val === true, 'You must agree to privacy policy'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.accountType === 'BUSINESS') {
    return data.businessName && data.businessName.length > 0;
  }
  return true;
}, {
  message: "Business name is required for business accounts",
  path: ["businessName"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      preferredLanguage: 'EN',
      communicationMethod: 'EMAIL',
      marketingEmails: true,
      serviceUpdates: true,
      accountType: 'CITIZEN',
      businessName: '',
      agreesToTerms: false,
      agreesToPrivacy: false,
    },
  });

  const watchAccountType = watch('accountType');

  const onSubmit = async (data: RegistrationFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Construct the full name and prepare API payload
      const apiData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
      };

      const response = await api.post('/auth/register', apiData);
      
      // Log confirmation link to browser console
      if (response.data.requiresEmailConfirmation) {
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log('%c📧 EMAIL CONFIRMATION REQUIRED', 'color: #2196F3; font-size: 16px; font-weight: bold');
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log('%cUser:', 'font-weight: bold', data.email);
        
        // Show actual confirmation link in development
        if (response.data.confirmationLink) {
          console.log('%cConfirmation Link:', 'color: #2196F3; font-weight: bold', response.data.confirmationLink);
          console.log('%cToken:', 'font-weight: bold', response.data.confirmationToken);
        } else {
          console.log('%cNote:', 'color: #FF9800; font-weight: bold', 'Check the API console for the actual confirmation link');
        }
        
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        
        setSuccess('Registration successful! Please check your email (see browser console and API console) to confirm your account.');
      } else {
        setSuccess('Registration successful! Please login with your credentials.');
      }
      
      // Don't redirect immediately if email confirmation is required
      if (!response.data.requiresEmailConfirmation) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }

    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" data-testid="cs-registration-page">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              {t('auth:register.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('auth:register.subtitle')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-registration-error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-registration-success">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              {t('auth:register.personalInfo')}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.firstNameLabel')}
                      placeholder={t('auth:register.firstNamePlaceholder')}
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      data-testid="cs-registration-first-name"
                    />
                  )
                }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.lastNameLabel')}
                      placeholder={t('auth:register.lastNamePlaceholder')}
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      data-testid="cs-registration-last-name"
                    />
                  )
                }
                />
              </Grid>
            </Grid>

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('auth:register.emailLabel')}
                  placeholder={t('auth:register.emailPlaceholder')}
                  type="email"
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  data-testid="cs-registration-email"
                />
              )}
            />

            {/* Password Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              {t('auth:register.passwordSecurity')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.passwordLabel')}
                      placeholder={t('auth:register.passwordPlaceholder')}
                      type={showPassword ? 'text' : 'password'}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              data-testid="cs-registration-toggle-password"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      data-testid="cs-registration-password"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.confirmPasswordLabel')}
                      placeholder={t('auth:register.confirmPasswordPlaceholder')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              data-testid="cs-registration-toggle-confirm-password"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      data-testid="cs-registration-confirm-password"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Contact Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              {t('auth:register.contactInfo')}
            </Typography>

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('auth:register.phoneLabel')}
                  placeholder={t('auth:register.phonePlaceholder')}
                  margin="normal"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  data-testid="cs-registration-phone"
                />
              )}
            />

            {/* Address Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              {t('auth:register.addressInfo')}
            </Typography>

            <Controller
              name="streetAddress"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('auth:register.addressLabel')}
                  placeholder={t('auth:register.addressPlaceholder')}
                  margin="normal"
                  error={!!errors.streetAddress}
                  helperText={errors.streetAddress?.message}
                  data-testid="cs-registration-street-address"
                />
              )}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.cityLabel')}
                      placeholder={t('auth:register.cityPlaceholder')}
                      margin="normal"
                      error={!!errors.city}
                      helperText={errors.city?.message}
                      data-testid="cs-registration-city"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.stateLabel')}
                      placeholder={t('auth:register.statePlaceholder')}
                      margin="normal"
                      error={!!errors.state}
                      helperText={errors.state?.message}
                      data-testid="cs-registration-state"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:register.postalCodeLabel')}
                      placeholder={t('auth:register.postalCodePlaceholder')}
                      margin="normal"
                      error={!!errors.postalCode}
                      helperText={errors.postalCode?.message}
                      data-testid="cs-registration-postal-code"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Controller
              name="country"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Autocomplete
                  value={value || 'United States'}
                  onChange={(_, newValue) => onChange(newValue || '')}
                  options={countries}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('auth:register.countryLabel')}
                      margin="normal"
                      error={!!errors.country}
                      helperText={errors.country?.message}
                      data-testid="cs-registration-country"
                      required
                    />
                  )}
                  fullWidth
                  disableClearable
                />
              )}
            />

            {/* Account Type & Preferences */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              {t('auth:register.accountPrefs')}
            </Typography>

            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('auth:register.accountTypeLabel')}</InputLabel>
                  <Select
                    {...field}
                    label={t('auth:register.accountTypeLabel')}
                    data-testid="cs-registration-account-type"
                  >
                    <MenuItem value="CITIZEN">{t('auth:register.individualCitizen')}</MenuItem>
                    <MenuItem value="BUSINESS">{t('auth:register.businessOrg')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {watchAccountType === 'BUSINESS' && (
              <Controller
                name="businessName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('auth:register.businessNameLabel')}
                    placeholder={t('auth:register.businessNamePlaceholder')}
                    margin="normal"
                    error={!!errors.businessName}
                    helperText={errors.businessName?.message}
                    data-testid="cs-registration-business-name"
                  />
                )}
              />
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="preferredLanguage"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{t('auth:register.preferredLanguageLabel')}</InputLabel>
                      <Select
                        {...field}
                        label={t('auth:register.preferredLanguageLabel')}
                        data-testid="cs-registration-language"
                      >
                        <MenuItem value="EN">English</MenuItem>
                        <MenuItem value="BG">Български</MenuItem>
                        <MenuItem value="ES">Español</MenuItem>
                        <MenuItem value="FR">Français</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="communicationMethod"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{t('auth:register.communicationLabel')}</InputLabel>
                      <Select
                        {...field}
                        label={t('auth:register.communicationLabel')}
                        data-testid="cs-registration-communication"
                      >
                        <MenuItem value="EMAIL">{t('auth:register.communicationEmail')}</MenuItem>
                        <MenuItem value="PHONE">{t('auth:register.communicationPhone')}</MenuItem>
                        <MenuItem value="SMS">{t('auth:register.communicationSms')}</MenuItem>
                        <MenuItem value="MAIL">{t('auth:register.communicationMail')}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            {/* Communication Preferences */}
            <Box sx={{ mt: 2 }}>
              <Controller
                name="serviceUpdates"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="cs-registration-service-updates"
                      />
                    }
                    label={t('auth:register.serviceUpdatesLabel')}
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
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="cs-registration-marketing-emails"
                      />
                    }
                    label={t('auth:register.marketingLabel')}
                  />
                )}
              />
            </Box>

            {/* Legal Agreements */}
            <Divider sx={{ my: 3 }} />
            
            <Controller
              name="agreesToTerms"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      color="primary"
                      required
                      data-testid="cs-registration-agree-terms"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('auth:register.termsLabel')}{' '}
                      <Link href="/terms" target="_blank" color="primary">
                        {t('common:termsOfService')}
                      </Link>
                    </Typography>
                  }
                />
              )}
            />
            {errors.agreesToTerms && (
              <Typography variant="caption" color="error" display="block">
                {errors.agreesToTerms.message}
              </Typography>
            )}

            <Controller
              name="agreesToPrivacy"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      color="primary"
                      required
                      data-testid="cs-registration-agree-privacy"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('auth:register.privacyLabel')}{' '}
                      <Link href="/privacy" target="_blank" color="primary">
                        {t('common:privacyPolicy')}
                      </Link>
                    </Typography>
                  }
                />
              )}
            />
            {errors.agreesToPrivacy && (
              <Typography variant="caption" color="error" display="block">
                {errors.agreesToPrivacy.message}
              </Typography>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              data-testid="cs-registration-submit"
            >
              {loading ? t('auth:register.submitting') : t('auth:register.submitButton')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                {t('auth:register.haveAccount')}{' '}
                <Link component={RouterLink} to="/login" color="primary">
                  {t('auth:register.signIn')}
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegistrationPage;