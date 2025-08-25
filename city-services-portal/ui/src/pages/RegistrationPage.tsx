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
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../lib/api';

// Enhanced validation schema for registration
const registrationSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  
  // Password Requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
  
  // Contact Information
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\d{10,15}$/, 'Phone number must contain only digits'),
  
  // Address Information
  streetAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(5, 'Valid postal code required'),
  country: z.string().min(2, 'Country is required'),
  
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

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Bulgaria',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Other',
];

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      await api.post('/auth/register', apiData);
      
      setSuccess('Registration successful! Please login with your credentials.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

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
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join our city services portal to submit and track service requests
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
              Personal Information
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
                      label="First Name"
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
                      label="Last Name"
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
                  label="Email Address"
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
              Password & Security
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
                      label="Password"
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
                      label="Confirm Password"
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
              Contact Information
            </Typography>

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Phone Number"
                  margin="normal"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  data-testid="cs-registration-phone"
                />
              )}
            />

            {/* Address Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Address Information
            </Typography>

            <Controller
              name="streetAddress"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Street Address"
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
                      label="City"
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
                      label="State/Province"
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
                      label="Postal Code"
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
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Country</InputLabel>
                  <Select
                    {...field}
                    label="Country"
                    data-testid="cs-registration-country"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Account Type & Preferences */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Account & Preferences
            </Typography>

            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    {...field}
                    label="Account Type"
                    data-testid="cs-registration-account-type"
                  >
                    <MenuItem value="CITIZEN">Individual Citizen</MenuItem>
                    <MenuItem value="BUSINESS">Business/Organization</MenuItem>
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
                    label="Business Name"
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
                      <InputLabel>Preferred Language</InputLabel>
                      <Select
                        {...field}
                        label="Preferred Language"
                        data-testid="cs-registration-language"
                      >
                        <MenuItem value="EN">English</MenuItem>
                        <MenuItem value="BG">?????????</MenuItem>
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
                      <InputLabel>Preferred Communication</InputLabel>
                      <Select
                        {...field}
                        label="Preferred Communication"
                        data-testid="cs-registration-communication"
                      >
                        <MenuItem value="EMAIL">Email</MenuItem>
                        <MenuItem value="PHONE">Phone</MenuItem>
                        <MenuItem value="SMS">SMS</MenuItem>
                        <MenuItem value="MAIL">Mail</MenuItem>
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
                    label="Receive updates about my service requests"
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
                    label="Receive newsletters and city announcements"
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
                      I agree to the{' '}
                      <Link href="#" color="primary">
                        Terms and Conditions
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
                      I agree to the{' '}
                      <Link href="#" color="primary">
                        Privacy Policy
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" color="primary">
                  Sign In
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