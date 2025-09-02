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
  Link,
  CircularProgress,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/forgot-password', data);
      
      // Log reset link info to browser console
      console.log('%c========================================', 'color: #FF6B6B; font-weight: bold');
      console.log('%c🔐 PASSWORD RESET REQUESTED', 'color: #4ECDC4; font-size: 16px; font-weight: bold');
      console.log('%c========================================', 'color: #FF6B6B; font-weight: bold');
      console.log('%cEmail:', 'font-weight: bold', data.email);
      console.log('%cStatus:', 'font-weight: bold', 'Reset link generated');
      
      // Show actual reset link in development
      if (response.data.resetLink) {
        console.log('%cReset Link:', 'color: #4ECDC4; font-weight: bold', response.data.resetLink);
        console.log('%cToken:', 'font-weight: bold', response.data.resetToken);
      } else {
        console.log('%cNote:', 'color: #FFD93D; font-weight: bold', 'Check the API console for the actual reset link');
      }
      
      console.log('%cExpiry:', 'font-weight: bold', '1 hour from now');
      console.log('%c========================================', 'color: #FF6B6B; font-weight: bold');
      
      setSuccess(response.data.message);
      setEmailSent(true);
      
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      data-testid="cs-forgot-password-page"
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
              <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                data-testid="cs-forgot-password-title"
              >
                {t('auth:forgotPassword.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('auth:forgotPassword.subtitle')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-forgot-password-error">
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-forgot-password-success">
                {success}
              </Alert>
            )}

            {!emailSent ? (
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                data-testid="cs-forgot-password-form"
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('auth:forgotPassword.emailLabel')}
                      type="email"
                      margin="normal"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      data-testid="cs-forgot-password-email"
                      autoComplete="email"
                      autoFocus
                      placeholder={t('auth:forgotPassword.emailPlaceholder')}
                    />
                  )}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  data-testid="cs-forgot-password-submit"
                  sx={{ mt: 3, mb: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <Email />}
                >
                  {loading ? t('auth:forgotPassword.sending') : t('auth:forgotPassword.submitButton')}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    color="primary"
                    data-testid="cs-forgot-password-back-to-login"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <ArrowBack fontSize="small" />
                    {t('auth:forgotPassword.backToLogin')}
                  </Link>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>{t('auth:forgotPassword.checkEmail')}</strong>
                  </Typography>
                  <Typography variant="body2">
                    {t('auth:forgotPassword.success')}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    For testing: Check browser console and API console for the reset link.
                  </Typography>
                </Alert>
                
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  data-testid="cs-forgot-password-return-to-login"
                  startIcon={<ArrowBack />}
                >
                  {t('auth:forgotPassword.backToLogin')}
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Security Note:</strong> For security reasons, we don't reveal whether an email exists in our system. 
                If you don't receive an email, please check your spam folder or contact support.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;