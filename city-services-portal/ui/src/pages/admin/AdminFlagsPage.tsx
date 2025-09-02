import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as DatabaseIcon,
  DeleteSweep as ResetIcon,
  BuildCircle as SeedIcon,
} from '@mui/icons-material';
import { useFeatureFlags, useAdminActions } from '../../hooks/useAdmin';
import { useTranslation } from 'react-i18next';

// Feature flag definitions with descriptions
const FEATURE_FLAG_CONFIG = {
  'UI_WrongDefaultSort': {
    title: 'Wrong Default Sort (UI)',
    description: 'Changes default sort from createdAt:desc to title:asc for requests list',
    category: 'UI Bugs',
    impact: 'Low',
  },
  'UI_MissingAria_Search': {
    title: 'Missing ARIA for Search (UI)',
    description: 'Removes aria-label from search input field',
    category: 'Accessibility',
    impact: 'Medium',
  },
  'API_Random500': {
    title: 'Random 500 Errors (API)',
    description: '5% chance of returning 500 error on GET /requests',
    category: 'API Errors',
    impact: 'High',
  },
  'API_SlowRequests': {
    title: 'Slow API Requests',
    description: '10% chance of adding 2.5 second delay to GET /requests',
    category: 'Performance',
    impact: 'Medium',
  },
  'API_UploadIntermittentFail': {
    title: 'Upload Failures (API)',
    description: '1/15 chance of upload failure for file attachments',
    category: 'API Errors',
    impact: 'Medium',
  },
};

const AdminFlagsPage: React.FC = () => {
  const { t } = useTranslation();
  const { flags, loading, error, updateFlag, refetch } = useFeatureFlags();
  const { seedDatabase, resetDatabase, loading: adminLoading, error: adminError } = useAdminActions();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFlagToggle = async (key: string, currentValue: boolean) => {
    try {
      await updateFlag(key, !currentValue);
      setSuccessMessage(`Feature flag ${key} updated successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase();
      setSuccessMessage('Database seeded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      setResetDialogOpen(false);
      setSuccessMessage('Database reset successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setResetDialogOpen(false);
      // Error is handled by the hook
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UI Bugs':
        return 'primary';
      case 'API Errors':
        return 'error';
      case 'Performance':
        return 'warning';
      case 'Accessibility':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box data-testid="cs-admin-flags-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('navigation:admin-flags', 'Feature Flags Administration')}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refetch}
          disabled={loading}
          data-testid="cs-admin-refresh"
        >
          {t('common:refresh', 'Refresh')}
        </Button>
      </Box>

      {(error || adminError) && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-admin-error">
          {error || adminError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-admin-success">
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Feature Flags Section */}
        <Grid item xs={12} lg={8}>
          <Card data-testid="cs-admin-feature-flags">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin:featureFlags', 'Bug Mode Feature Flags')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('admin:featureFlagsDescription', 'Toggle these flags to simulate various bugs and issues for testing purposes.')}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin:flag', 'Flag')}</TableCell>
                      <TableCell>{t('admin:category', 'Category')}</TableCell>
                      <TableCell>{t('admin:impact', 'Impact')}</TableCell>
                      <TableCell>{t('common:status', 'Status')}</TableCell>
                      <TableCell>{t('common:actions', 'Action')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(FEATURE_FLAG_CONFIG).map(([key, config]) => {
                      const isEnabled = Boolean(flags[key]);
                      return (
                        <TableRow key={key} data-testid={`cs-admin-flag-${key}`}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {config.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {config.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={config.category}
                              color={getCategoryColor(config.category) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={config.impact}
                              color={getImpactColor(config.impact) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isEnabled ? t('admin:enabled', 'Enabled') : t('admin:disabled', 'Disabled')}
                              color={isEnabled ? 'success' : 'default'}
                              size="small"
                              variant={isEnabled ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isEnabled}
                                  onChange={() => handleFlagToggle(key, isEnabled)}
                                  disabled={loading}
                                  data-testid={`cs-admin-flag-toggle-${key}`}
                                />
                              }
                              label=""
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Management Section */}
        <Grid item xs={12} lg={4}>
          <Card data-testid="cs-admin-database">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DatabaseIcon />
                <Typography variant="h6">
                  {t('admin:databaseManagement', 'Database Management')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('admin:databaseManagementDescription', 'Manage the database state for testing and development.')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<SeedIcon />}
                  onClick={handleSeedDatabase}
                  disabled={adminLoading}
                  fullWidth
                  data-testid="cs-admin-seed-button"
                >
                  {adminLoading ? t('admin:seeding', 'Seeding...') : t('admin:seedDatabase', 'Seed Database')}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ResetIcon />}
                  onClick={() => setResetDialogOpen(true)}
                  disabled={adminLoading}
                  fullWidth
                  data-testid="cs-admin-reset-button"
                >
                  {t('admin:resetDatabase', 'Reset Database')}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                {t('admin:databaseOperations', 'Database Operations')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('admin:seed', 'Seed')}:</strong> {t('admin:seedDescription', 'Adds fresh test data to the database.')}
                <br />
                <strong>{t('admin:reset', 'Reset')}:</strong> {t('admin:resetDescription', 'Clears all data and reinitializes the database.')}
              </Typography>
            </CardContent>
          </Card>

          {/* Current Flag Status Summary */}
          <Card sx={{ mt: 3 }} data-testid="cs-admin-summary">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin:activeFlagsSummary', 'Active Flags Summary')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(flags).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{key}</Typography>
                    <Chip
                      label={value ? 'ON' : 'OFF'}
                      color={value ? 'success' : 'default'}
                      size="small"
                      variant={value ? 'filled' : 'outlined'}
                    />
                  </Box>
                ))}
                {Object.keys(flags).length === 0 && !loading && (
                  <Typography variant="body2" color="text.secondary">
                    {t('admin:noFeatureFlags', 'No feature flags configured')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        data-testid="cs-admin-reset-dialog"
      >
        <DialogTitle>{t('admin:confirmDatabaseReset', 'Confirm Database Reset')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin:resetDatabaseConfirmMessage', 'Are you sure you want to reset the database? This will permanently delete all data including service requests, users, and configuration. This action cannot be undone.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResetDialogOpen(false)}
            data-testid="cs-admin-reset-cancel"
          >
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleResetDatabase}
            color="error"
            variant="contained"
            disabled={adminLoading}
            data-testid="cs-admin-reset-confirm"
          >
            {adminLoading ? t('admin:resetting', 'Resetting...') : t('admin:resetDatabase', 'Reset Database')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFlagsPage;