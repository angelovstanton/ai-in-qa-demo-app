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
  Divider,
  Grid,
  IconButton,
} from '@mui/material';
import { Person, Work, AdminPanelSettings, Build, SupervisorAccount } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo account credentials
  const demoAccounts = [
    {
      role: 'Citizen',
      email: 'john@example.com',
      password: 'password123',
      icon: <Person />,
      color: 'primary' as const,
      description: 'Submit and track service requests'
    },
    {
      role: 'Clerk',
      email: 'mary.clerk@city.gov',
      password: 'password123',
      icon: <Work />,
      color: 'secondary' as const,
      description: 'Process and manage requests'
    },
    {
      role: 'Supervisor',
      email: 'supervisor@city.gov',
      password: 'password123',
      icon: <SupervisorAccount />,
      color: 'warning' as const,
      description: 'Assign tasks and oversee workflow'
    },
    {
      role: 'Field Agent',
      email: 'field.agent@city.gov',
      password: 'password123',
      icon: <Build />,
      color: 'info' as const,
      description: 'Complete field work and update status'
    },
    {
      role: 'Admin',
      email: 'admin@city.gov',
      password: 'password123',
      icon: <AdminPanelSettings />,
      color: 'error' as const,
      description: 'System configuration and feature flags'
    }
  ];

  const handlePrefillAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      data-testid="cs-login-page"
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
            <Typography
              variant="h4"
              component="h1"
              align="center"
              gutterBottom
              data-testid="cs-login-title"
            >
              City Services Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-login-error">
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              data-testid="cs-login-form"
              sx={{ mt: 2 }}
            >
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                data-testid="cs-login-email"
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                data-testid="cs-login-password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                data-testid="cs-login-submit"
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" color="primary" data-testid="cs-login-register-link">
                  Create Account
                </Link>
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" data-testid="cs-demo-accounts-title">
                Demo Accounts - Click to Prefill:
              </Typography>
              <Grid container spacing={1}>
                {demoAccounts.map((account, index) => (
                  <Grid item xs={12} sm={6} key={account.role}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color={account.color}
                      startIcon={account.icon}
                      onClick={() => handlePrefillAccount(account.email, account.password)}
                      data-testid={`cs-prefill-${account.role.toLowerCase().replace(' ', '-')}`}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        p: 1.5,
                        minHeight: 60,
                        '&:hover': {
                          backgroundColor: `${account.color}.50`,
                        }
                      }}
                      aria-label={`Prefill login form with ${account.role} demo account credentials`}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {account.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {account.description}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }} data-testid="cs-demo-info">
                <Typography variant="caption">
                  All demo accounts use password: <strong>password123</strong>
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;