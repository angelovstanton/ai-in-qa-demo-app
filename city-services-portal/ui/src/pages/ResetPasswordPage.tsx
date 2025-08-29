import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Link,
  LinearProgress,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  Check,
  Close,
  LockReset,
} from '@mui/icons-material';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/^(?=.*[a-z])/, 'Must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Must contain at least one number')
    .regex(/^(?=.*[@$!%*?&])/, 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Password strength indicators
  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'Contains number', met: /\d/.test(newPassword) },
    { label: 'Contains special character', met: /[@$!%*?&]/.test(newPassword) },
  ];

  const passwordStrength = passwordRequirements.filter(req => req.met).length;
  const strengthPercentage = (passwordStrength / passwordRequirements.length) * 100;
  
  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return 'error';
    if (strengthPercentage <= 40) return 'warning';
    if (strengthPercentage <= 60) return 'info';
    if (strengthPercentage <= 80) return 'primary';
    return 'success';
  };

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      
      // Log success to browser console
      console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
      console.log('%c✅ PASSWORD RESET SUCCESSFUL', 'color: #4CAF50; font-size: 16px; font-weight: bold');
      console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
      console.log('%cStatus:', 'font-weight: bold', 'Password has been successfully reset');
      console.log('%cNext step:', 'font-weight: bold', 'Please login with your new password');
      console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
      
      setSuccess(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      data-testid="cs-reset-password-page"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 4 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                data-testid="cs-reset-password-title"
              >
                Reset Your Password
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please enter your new password below
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-reset-password-error">
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-reset-password-success">
                {success}
              </Alert>
            )}

            {!success && token && (
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                data-testid="cs-reset-password-form"
              >
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      margin="normal"
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      data-testid="cs-reset-password-new"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                              data-testid="cs-reset-password-toggle-new"
                            >
                              {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm New Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      margin="normal"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      data-testid="cs-reset-password-confirm"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              data-testid="cs-reset-password-toggle-confirm"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                {newPassword && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Password Strength
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={strengthPercentage}
                      color={getStrengthColor()}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      data-testid="cs-reset-password-strength"
                    />
                    <List dense>
                      {passwordRequirements.map((req, index) => (
                        <ListItem key={index} disableGutters sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            {req.met ? (
                              <Check color="success" fontSize="small" />
                            ) : (
                              <Close color="error" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={req.label}
                            primaryTypographyProps={{
                              variant: 'caption',
                              color: req.met ? 'success.main' : 'text.secondary',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !token}
                  data-testid="cs-reset-password-submit"
                  sx={{ mt: 3, mb: 2 }}
                  startIcon={<Lock />}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    color="primary"
                    data-testid="cs-reset-password-back-to-login"
                  >
                    Back to Login
                  </Link>
                </Box>
              </Box>
            )}

            {!token && (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  Invalid or expired reset link
                </Alert>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/forgot-password"
                  data-testid="cs-reset-password-request-new"
                >
                  Request New Reset Link
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;