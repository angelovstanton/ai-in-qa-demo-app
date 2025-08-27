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
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

  // Demo account credentials - Main accounts
  const mainDemoAccounts = [
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

  // All demo accounts including additional ones
  const allDemoAccounts = [
    ...mainDemoAccounts,
    // Additional Citizens
    ...Array.from({ length: 20 }, (_, i) => ({
      role: 'Citizen',
      email: `citizen${i + 1}@example.com`,
      password: 'password123',
      icon: <Person />,
      color: 'primary' as const,
      description: `Citizen ${i + 1}`
    })),
    // Additional Clerks
    ...Array.from({ length: 5 }, (_, i) => ({
      role: 'Clerk',
      email: `clerk${i + 1}@city.gov`,
      password: 'password123',
      icon: <Work />,
      color: 'secondary' as const,
      description: `Clerk ${i + 1}`
    })),
    // Additional Supervisors
    ...Array.from({ length: 3 }, (_, i) => ({
      role: 'Supervisor',
      email: `supervisor${i + 1}@city.gov`,
      password: 'password123',
      icon: <SupervisorAccount />,
      color: 'warning' as const,
      description: `Supervisor ${i + 1}`
    })),
    // Additional Field Agents
    ...Array.from({ length: 3 }, (_, i) => ({
      role: 'Field Agent',
      email: `agent${i + 1}@city.gov`,
      password: 'password123',
      icon: <Build />,
      color: 'info' as const,
      description: `Field Agent ${i + 1}`
    })),
    // Additional Admins
    ...Array.from({ length: 2 }, (_, i) => ({
      role: 'Admin',
      email: `admin${i + 1}@city.gov`,
      password: 'password123',
      icon: <AdminPanelSettings />,
      color: 'error' as const,
      description: `Admin ${i + 1}`
    }))
  ];

  const [selectedDemoAccount, setSelectedDemoAccount] = useState('');

  const handlePrefillAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const handleDemoAccountSelect = (accountEmail: string) => {
    const account = allDemoAccounts.find(acc => acc.email === accountEmail);
    if (account) {
      handlePrefillAccount(account.email, account.password);
      setSelectedDemoAccount(accountEmail);
    }
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
              
              {/* Dropdown for all demo accounts */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Demo Account</InputLabel>
                <Select
                  value={selectedDemoAccount}
                  label="Select Demo Account"
                  onChange={(e) => handleDemoAccountSelect(e.target.value)}
                  data-testid="cs-demo-account-dropdown"
                >
                  <MenuItem value="">
                    <em>Choose an account...</em>
                  </MenuItem>
                  {allDemoAccounts.map((account, index) => (
                    <MenuItem key={`${account.role}-${index}`} value={account.email}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {account.icon}
                        <Typography variant="body2">
                          <strong>{account.role}</strong> - {account.email}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={1}>
                {mainDemoAccounts.map((account, index) => (
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