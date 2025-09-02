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
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo account credentials - Main accounts
  const mainDemoAccounts = [
    {
      role: t('auth:roles.CITIZEN'),
      email: 'john@example.com',
      password: 'password123',
      icon: <Person />,
      color: 'primary' as const,
      description: t('auth:login.citizenDesc', 'Submit and track service requests')
    },
    {
      role: t('auth:roles.CLERK'),
      email: 'mary.clerk@city.gov',
      password: 'password123',
      icon: <Work />,
      color: 'secondary' as const,
      description: t('auth:login.clerkDesc', 'Process and manage requests')
    },
    {
      role: t('auth:roles.SUPERVISOR'),
      email: 'supervisor@city.gov',
      password: 'password123',
      icon: <SupervisorAccount />,
      color: 'warning' as const,
      description: t('auth:login.supervisorDesc', 'Assign tasks and oversee workflow')
    },
    {
      role: t('auth:roles.FIELD_AGENT'),
      email: 'field.agent@city.gov',
      password: 'password123',
      icon: <Build />,
      color: 'info' as const,
      description: t('auth:login.fieldAgentDesc', 'Complete field work and update status')
    },
    {
      role: t('auth:roles.ADMIN'),
      email: 'admin@city.gov',
      password: 'password123',
      icon: <AdminPanelSettings />,
      color: 'error' as const,
      description: t('auth:login.adminDesc', 'System configuration and feature flags')
    }
  ];

  // Additional real accounts from database
  const additionalAccounts = [
    // Additional Clerks
    { role: 'Clerk', email: 'victoria.clerk4@public-safety.gov', password: 'password123', icon: <Work />, color: 'secondary' as const, description: 'Public Safety Clerk' },
    { role: 'Clerk', email: 'margarita.clerk2@waste-management.gov', password: 'password123', icon: <Work />, color: 'secondary' as const, description: 'Waste Management Clerk' },
    { role: 'Clerk', email: 'kristina.clerk4@roads-and-infrastructure.gov', password: 'password123', icon: <Work />, color: 'secondary' as const, description: 'Roads Clerk' },
    { role: 'Clerk', email: 'georgi.clerk4@parks-and-recreation.gov', password: 'password123', icon: <Work />, color: 'secondary' as const, description: 'Parks Clerk' },
    { role: 'Clerk', email: 'stoyan.clerk3@water-and-utilities.gov', password: 'password123', icon: <Work />, color: 'secondary' as const, description: 'Water Utilities Clerk' },
    
    // Additional Supervisors  
    { role: 'Supervisor', email: 'victoria.supervisor1@parks-and-recreation.gov', password: 'password123', icon: <SupervisorAccount />, color: 'warning' as const, description: 'Parks Supervisor' },
    { role: 'Supervisor', email: 'rumyana.supervisor1@water-and-utilities.gov', password: 'password123', icon: <SupervisorAccount />, color: 'warning' as const, description: 'Water Supervisor' },
    { role: 'Supervisor', email: 'yana.supervisor1@public-safety.gov', password: 'password123', icon: <SupervisorAccount />, color: 'warning' as const, description: 'Public Safety Supervisor' },
    { role: 'Supervisor', email: 'stoyan.supervisor0@water-and-utilities.gov', password: 'password123', icon: <SupervisorAccount />, color: 'warning' as const, description: 'Water Supervisor' },
    { role: 'Supervisor', email: 'angel.supervisor2@roads-and-infrastructure.gov', password: 'password123', icon: <SupervisorAccount />, color: 'warning' as const, description: 'Roads Supervisor' },
    
    // Additional Field Agents
    { role: 'Field Agent', email: 'gabriela.agent3@water-and-utilities.gov', password: 'password123', icon: <Build />, color: 'info' as const, description: 'Water Field Agent' },
    { role: 'Field Agent', email: 'asen.agent1@parks-and-recreation.gov', password: 'password123', icon: <Build />, color: 'info' as const, description: 'Parks Field Agent' },
    { role: 'Field Agent', email: 'polina.agent3@roads-and-infrastructure.gov', password: 'password123', icon: <Build />, color: 'info' as const, description: 'Roads Field Agent' },
    { role: 'Field Agent', email: 'daniela.agent1@waste-management.gov', password: 'password123', icon: <Build />, color: 'info' as const, description: 'Waste Field Agent' },
    { role: 'Field Agent', email: 'simona.agent3@public-safety.gov', password: 'password123', icon: <Build />, color: 'info' as const, description: 'Public Safety Field Agent' },
    
    // Additional Citizens
    { role: 'Citizen', email: 'margarita.aleksandrov8@example.com', password: 'password123', icon: <Person />, color: 'primary' as const, description: 'Citizen - Margarita' },
    { role: 'Citizen', email: 'simona.penchev44@example.com', password: 'password123', icon: <Person />, color: 'primary' as const, description: 'Citizen - Simona' },
    { role: 'Citizen', email: 'lilyana.yankov43@example.com', password: 'password123', icon: <Person />, color: 'primary' as const, description: 'Citizen - Lilyana' },
  ];

  // All demo accounts - combine main and additional real accounts
  const allDemoAccounts = [...mainDemoAccounts, ...additionalAccounts];

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
              {t('auth:login.title')}
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
                label={t('auth:login.emailLabel')}
                placeholder={t('auth:login.emailPlaceholder')}
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
                label={t('auth:login.passwordLabel')}
                placeholder={t('auth:login.passwordPlaceholder')}
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
                {isLoading ? t('auth:login.signingIn') : t('auth:login.submitButton')}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/forgot-password" color="primary" data-testid="cs-login-forgot-password-link">
                  {t('auth:login.forgotPassword')}
                </Link>
              </Typography>
              <Typography variant="body2">
                {t('auth:login.noAccount')}{' '}
                <Link component={RouterLink} to="/register" color="primary" data-testid="cs-login-register-link">
                  {t('auth:login.signUp')}
                </Link>
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" data-testid="cs-demo-accounts-title">
                {t('auth:login.demoAccounts', 'Demo Accounts - Click to Prefill:')}
              </Typography>
              
              {/* Dropdown for all demo accounts */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('auth:login.selectDemoAccount', 'Select Demo Account')}</InputLabel>
                <Select
                  value={selectedDemoAccount}
                  label={t('auth:login.selectDemoAccount', 'Select Demo Account')}
                  onChange={(e) => handleDemoAccountSelect(e.target.value)}
                  data-testid="cs-demo-account-dropdown"
                >
                  <MenuItem value="">
                    <em>{t('auth:login.chooseAccount', 'Choose an account...')}</em>
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