import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/api/v1/auth/confirm-email`, {
          params: { token }
        });

        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been successfully confirmed! You can now log in to your account.');
          // Logout the user to ensure they log in with the confirmed account
          logout();
        } else {
          setStatus('error');
          setMessage('Failed to confirm email. The link may have expired or is invalid.');
        }
      } catch (error: any) {
        setStatus('error');
        if (error.response?.data?.error?.message) {
          setMessage(error.response.data.error.message);
        } else {
          setMessage('An error occurred while confirming your email. Please try again or contact support.');
        }
      }
    };

    confirmEmail();
  }, [searchParams, logout]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Card elevation={3} sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {status === 'loading' && (
              <>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h5" gutterBottom>
                  Confirming Your Email
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please wait while we verify your email address...
                </Typography>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                <Typography variant="h5" gutterBottom color="success.dark">
                  Email Confirmed!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {message}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  data-testid="cs-go-to-login"
                  sx={{ mt: 2 }}
                >
                  Go to Login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
                <Typography variant="h5" gutterBottom color="error.dark">
                  Confirmation Failed
                </Typography>
                <Alert severity="error" sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
                  {message}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/register')}
                    data-testid="cs-go-to-register"
                  >
                    Register Again
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/login')}
                    data-testid="cs-go-to-login"
                  >
                    Go to Login
                  </Button>
                </Box>
              </>
            )}
          </Box>

          {status !== 'loading' && (
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Need help? Contact support at{' '}
                <Typography component="span" color="primary">
                  support@cityservices.gov
                </Typography>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailConfirmationPage;