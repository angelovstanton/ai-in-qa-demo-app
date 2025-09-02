import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  BugReport as BugIcon,
  Speed as SpeedIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useFeatureFlags, FeatureFlag } from '../../contexts/FeatureFlagsContext';
import { useAuth } from '../../contexts/AuthContext';

const FeatureFlagsPage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const { 
    allFlags, 
    loading, 
    error, 
    toggleFlag, 
    refreshFlags,
    isEnabled,
    simulateRandomError,
    simulateSlowRequest,
    simulateUploadError,
  } = useFeatureFlags();
  
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has admin access
  if (user?.role !== 'ADMIN') {
    return (
      <Box data-testid="cs-feature-flags-unauthorized">
        <Alert severity="error">
          {t('common:errorMessage')}
        </Alert>
      </Box>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'API': return <BugIcon />;
      case 'UI': return <ViewIcon />;
      case 'PERFORMANCE': return <SpeedIcon />;
      case 'UPLOAD': return <UploadIcon />;
      case 'VALIDATION': return <SecurityIcon />;
      default: return <WarningIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'API': return 'error';
      case 'UI': return 'primary';
      case 'PERFORMANCE': return 'warning';
      case 'UPLOAD': return 'info';
      case 'VALIDATION': return 'secondary';
      default: return 'default';
    }
  };

  const handleToggle = async (flagName: string) => {
    try {
      await toggleFlag(flagName);
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFlags();
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestFlag = (flag: FeatureFlag) => {
    const testResult: any = {
      flagName: flag.name,
      enabled: isEnabled(flag.name),
      testedAt: new Date().toISOString(),
    };

    switch (flag.name) {
      case 'API_Random500':
        testResult.shouldError = simulateRandomError();
        testResult.description = testResult.shouldError 
          ? 'Would return HTTP 500 error' 
          : 'Would work normally';
        break;
      
      case 'API_SlowRequests':
        testResult.shouldSlow = simulateSlowRequest();
        testResult.description = testResult.shouldSlow 
          ? 'Would add 3-5 second delay' 
          : 'Would respond normally';
        break;
      
      case 'API_UploadIntermittentFail':
        testResult.shouldFail = simulateUploadError();
        testResult.description = testResult.shouldFail 
          ? 'Upload would fail' 
          : 'Upload would succeed';
        break;
      
      default:
        testResult.description = flag.enabled 
          ? 'Feature is currently enabled' 
          : 'Feature is currently disabled';
    }

    setTestResults(prev => ({
      ...prev,
      [flag.name]: testResult,
    }));

    setSelectedFlag(flag);
    setDialogOpen(true);
  };

  const groupedFlags = allFlags.reduce((acc: Record<string, FeatureFlag[]>, flag: FeatureFlag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  const enabledCount = allFlags.filter((flag: FeatureFlag) => flag.enabled).length;
  const totalCount = allFlags.length;

  return (
    <Box data-testid="cs-feature-flags-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('admin:featureFlags.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="cs-feature-flags-refresh"
        >
          {refreshing ? t('admin:featureFlags.refreshing') : t('common:refresh')}
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} data-testid="cs-feature-flags-error">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {enabledCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin:featureFlags.enabledFlags')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.primary">
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin:featureFlags.totalFlags')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {Object.keys(groupedFlags).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin:featureFlags.categories')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {allFlags.filter((f: FeatureFlag) => f.enabled && f.category === 'API').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin:featureFlags.activeApiBugs')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Flags by Category */}
      {Object.entries(groupedFlags).map(([category, flags]) => (
        <Card key={category} sx={{ mb: 3 }} data-testid={`cs-feature-flags-category-${category.toLowerCase()}`}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getCategoryIcon(category)}
              <Typography variant="h6" sx={{ ml: 1, mr: 2 }}>
                {t(`admin:featureFlags.categoryLabels.${category.toLowerCase()}`, { defaultValue: category })} {t('admin:featureFlags.features')}
              </Typography>
              <Chip
                label={t('admin:featureFlags.enabledCount', { 
                  enabled: flags.filter((f: FeatureFlag) => f.enabled).length,
                  total: flags.length
                })}
                color={getCategoryColor(category) as any}
                size="small"
              />
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin:featureFlags.feature')}</TableCell>
                    <TableCell>{t('admin:featureFlags.description')}</TableCell>
                    <TableCell align="center">{t('common:status')}</TableCell>
                    <TableCell align="center">{t('admin:featureFlags.lastUpdated')}</TableCell>
                    <TableCell align="center">{t('common:actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flags.map((flag: FeatureFlag) => (
                    <TableRow 
                      key={flag.id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        bgcolor: flag.enabled ? 'warning.50' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {flag.name}
                          </Typography>
                          {flag.enabled && (
                            <Chip 
                              label={t('admin:featureFlags.active')} 
                              color="warning" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {flag.description}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={flag.enabled}
                              onChange={() => handleToggle(flag.name)}
                              color="warning"
                              data-testid={`cs-feature-flag-toggle-${flag.name.toLowerCase()}`}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="caption">
                          {format(new Date(flag.updatedAt), 'MMM dd, HH:mm')}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title={t('admin:featureFlags.testFlagBehavior')}>
                          <IconButton
                            size="small"
                            onClick={() => handleTestFlag(flag)}
                            data-testid={`cs-feature-flag-test-${flag.name.toLowerCase()}`}
                          >
                            <BugIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* Test Results Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="cs-feature-flag-test-dialog"
      >
        {selectedFlag && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getCategoryIcon(selectedFlag.category)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {t('admin:featureFlags.testFlag')}: {selectedFlag.name}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>{t('admin:featureFlags.description')}:</strong> {selectedFlag.description}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>{t('admin:featureFlags.category')}:</strong> {selectedFlag.category}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('common:status')}:</strong> {selectedFlag.enabled ? t('admin:featureFlags.enabled') : t('admin:featureFlags.disabled')}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {testResults[selectedFlag.name] && (
                <Alert 
                  severity={testResults[selectedFlag.name].shouldError || testResults[selectedFlag.name].shouldFail ? 'warning' : 'info'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>{t('admin:featureFlags.testResult')}:</strong> {testResults[selectedFlag.name].description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {t('admin:featureFlags.testedAt')}: {format(new Date(testResults[selectedFlag.name].testedAt), 'PPpp')}
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {t('admin:featureFlags.usageDescription')}
              </Typography>
            </DialogContent>
            
            <DialogActions>
              <Button
                variant="outlined"
                color={selectedFlag.enabled ? 'error' : 'primary'}
                onClick={() => {
                  handleToggle(selectedFlag.name);
                  setDialogOpen(false);
                }}
                data-testid="cs-feature-flag-dialog-toggle"
              >
                {selectedFlag.enabled ? t('admin:featureFlags.disableFlag') : t('admin:featureFlags.enableFlag')}
              </Button>
              
              <Button 
                onClick={() => setDialogOpen(false)}
                data-testid="cs-feature-flag-dialog-close"
              >
                {t('common:close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default FeatureFlagsPage;