import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Grid,
  Divider,
  LinearProgress,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import {
  Person,
  Lock,
  Save,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, passwordChangeSchema, ProfileUpdateData, PasswordChangeData } from '../schemas/formSchemas';
import { useAuth } from '../contexts/AuthContext';
import { calculatePasswordStrength } from '../utils/validation';
import api from '../lib/api';

const EditProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      phone: '',
      alternatePhone: '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      serviceUpdates: true,
    }
  });

  // Password change form
  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  const newPassword = passwordForm.watch('newPassword');
  const passwordStrength = calculatePasswordStrength(newPassword || '');

  const handleProfileUpdate = async (data: ProfileUpdateData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.patch('/auth/profile', data);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordChangeData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/change-password', data);
      setSuccess('Password changed successfully! Please log in again.');
      passwordForm.reset();
      // Auto logout after password change for security
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (): 'error' | 'warning' | 'info' | 'success' => {
    if (passwordStrength.score <= 1) return 'error';
    if (passwordStrength.score <= 2) return 'warning';
    if (passwordStrength.score <= 3) return 'info';
    return 'success';
  };

  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 2) return 'Fair';
    if (passwordStrength.score <= 3) return 'Good';
    return 'Strong';
  };

  return (
    <Container maxWidth="md" data-testid="cs-edit-profile-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom data-testid="cs-edit-profile-title">
          Edit Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-edit-profile-error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-edit-profile-success">
            {success}
          </Alert>
        )}

        {/* General Validation Summary */}
        {Object.keys(profileForm.formState.errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-profile-validation-summary">
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {Object.entries(profileForm.formState.errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> {error?.message}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 1 }} />
                  <Typography variant="h6">Personal Information</Typography>
                </Box>

                <Box component="form" onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="firstName"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="First Name"
                            error={!!profileForm.formState.errors.firstName}
                            helperText={profileForm.formState.errors.firstName?.message}
                            data-testid="cs-profile-first-name"
                            required
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="lastName"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Last Name"
                            error={!!profileForm.formState.errors.lastName}
                            helperText={profileForm.formState.errors.lastName?.message}
                            data-testid="cs-profile-last-name"
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="phone"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Phone Number"
                            error={!!profileForm.formState.errors.phone}
                            helperText={profileForm.formState.errors.phone?.message}
                            data-testid="cs-profile-phone"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="alternatePhone"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Alternate Phone (Optional)"
                            error={!!profileForm.formState.errors.alternatePhone}
                            helperText={profileForm.formState.errors.alternatePhone?.message}
                            data-testid="cs-profile-alternate-phone"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="streetAddress"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Street Address"
                            error={!!profileForm.formState.errors.streetAddress}
                            helperText={profileForm.formState.errors.streetAddress?.message}
                            data-testid="cs-profile-street-address"
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="city"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="City"
                            error={!!profileForm.formState.errors.city}
                            helperText={profileForm.formState.errors.city?.message}
                            data-testid="cs-profile-city"
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="state"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="State/Province"
                            error={!!profileForm.formState.errors.state}
                            helperText={profileForm.formState.errors.state?.message}
                            data-testid="cs-profile-state"
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="postalCode"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Postal Code"
                            error={!!profileForm.formState.errors.postalCode}
                            helperText={profileForm.formState.errors.postalCode?.message}
                            data-testid="cs-profile-postal-code"
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="country"
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Country"
                            error={!!profileForm.formState.errors.country}
                            helperText={profileForm.formState.errors.country?.message}
                            data-testid="cs-profile-country"
                            required
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>Preferences</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="emailNotifications"
                        control={profileForm.control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="cs-profile-email-notifications"
                              />
                            }
                            label="Email Notifications"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="smsNotifications"
                        control={profileForm.control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="cs-profile-sms-notifications"
                              />
                            }
                            label="SMS Notifications"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="serviceUpdates"
                        control={profileForm.control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="cs-profile-service-updates"
                              />
                            }
                            label="Service Updates"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="marketingEmails"
                        control={profileForm.control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="cs-profile-marketing-emails"
                              />
                            }
                            label="Marketing Emails"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={isLoading}
                    sx={{ mt: 3 }}
                    data-testid="cs-profile-save"
                  >
                    Save Profile Changes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Change */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Lock sx={{ mr: 1 }} />
                  <Typography variant="h6">Change Password</Typography>
                </Box>

                <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                  <Controller
                    name="currentPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Current Password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        error={!!passwordForm.formState.errors.currentPassword}
                        helperText={passwordForm.formState.errors.currentPassword?.message}
                        margin="normal"
                        data-testid="cs-password-current"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              edge="end"
                              data-testid="cs-password-current-toggle"
                            >
                              {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="newPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <Box>
                        <TextField
                          {...field}
                          fullWidth
                          label="New Password"
                          type={showNewPassword ? 'text' : 'password'}
                          error={!!passwordForm.formState.errors.newPassword}
                          helperText={passwordForm.formState.errors.newPassword?.message}
                          margin="normal"
                          data-testid="cs-password-new"
                          InputProps={{
                            endAdornment: (
                              <IconButton
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                edge="end"
                                data-testid="cs-password-new-toggle"
                              >
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            ),
                          }}
                          required
                        />
                        
                        {newPassword && (
                          <Box sx={{ mt: 1 }} data-testid="cs-password-strength">
                            <Typography variant="caption" gutterBottom>
                              Password Strength: {getPasswordStrengthLabel()}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(passwordStrength.score / 4) * 100}
                              color={getPasswordStrengthColor()}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            {passwordStrength.feedback.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {passwordStrength.feedback.map((feedback, index) => (
                                  <Chip
                                    key={index}
                                    label={feedback}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  />

                  <Controller
                    name="confirmNewPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        error={!!passwordForm.formState.errors.confirmNewPassword}
                        helperText={passwordForm.formState.errors.confirmNewPassword?.message}
                        margin="normal"
                        data-testid="cs-password-confirm"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              data-testid="cs-password-confirm-toggle"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                        required
                      />
                    )}
                  />

                  <Button
                    type="submit"
                    variant="outlined"
                    startIcon={<Lock />}
                    disabled={isLoading}
                    fullWidth
                    sx={{ mt: 2 }}
                    data-testid="cs-password-change"
                  >
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Security Tips</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  � Use a strong password with at least 8 characters
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  � Include uppercase, lowercase, numbers, and symbols
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  � Don't reuse passwords from other accounts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  � Change your password regularly
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default EditProfilePage;