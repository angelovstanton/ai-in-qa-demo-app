import React, { useState, useEffect, useRef } from 'react';
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
          Access denied. This page is only available to administrators.
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
          Feature Flags Administration
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="cs-feature-flags-refresh"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
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
                Enabled Flags
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
                Total Flags
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
                Categories
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
                Active API Bugs
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
                {category} Features
              </Typography>
              <Chip
                label={`${flags.filter((f: FeatureFlag) => f.enabled).length}/${flags.length} enabled`}
                color={getCategoryColor(category) as any}
                size="small"
              />
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Feature</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Last Updated</TableCell>
                    <TableCell align="center">Actions</TableCell>
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
                              label="ACTIVE" 
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
                        <Tooltip title="Test Flag Behavior">
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
                  Test Flag: {selectedFlag.name}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Description:</strong> {selectedFlag.description}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Category:</strong> {selectedFlag.category}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedFlag.enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {testResults[selectedFlag.name] && (
                <Alert 
                  severity={testResults[selectedFlag.name].shouldError || testResults[selectedFlag.name].shouldFail ? 'warning' : 'info'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>Test Result:</strong> {testResults[selectedFlag.name].description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Tested at: {format(new Date(testResults[selectedFlag.name].testedAt), 'PPpp')}
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Use this feature flag to simulate bugs and test scenarios in your QA automation. 
                When enabled, this flag will modify the application behavior as described above.
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
                {selectedFlag.enabled ? 'Disable Flag' : 'Enable Flag'}
              </Button>
              
              <Button 
                onClick={() => setDialogOpen(false)}
                data-testid="cs-feature-flag-dialog-close"
              >
                Close
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