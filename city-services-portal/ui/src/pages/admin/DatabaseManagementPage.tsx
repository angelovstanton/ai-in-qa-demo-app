import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as DatabaseIcon,
  DeleteSweep as ResetIcon,
  BuildCircle as SeedIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  DataUsage as DataIcon,
  Assessment as StatsIcon,
  Backup as BackupIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Assignment as RequestIcon,
  Comment as CommentIcon,
  AttachFile as AttachIcon,
  Speed as SpeedIcon,
  BugReport as BugIcon,
  Timer as TimerIcon,
  Category as CategoryIcon,
  LocalShipping as FieldWorkIcon,
  Star as QualityIcon
} from '@mui/icons-material';
import { useAdminActions } from '../../hooks/useAdmin';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const DatabaseManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { seedDatabase, resetDatabase, loading: adminLoading, error: adminError, getStats } = useAdminActions();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase();
      setSuccessMessage('Database seeded successfully with test data');
      setTimeout(() => setSuccessMessage(null), 5000);
      loadDatabaseStats();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      setResetDialogOpen(false);
      setSuccessMessage('Database reset successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
      loadDatabaseStats();
    } catch (error) {
      setResetDialogOpen(false);
      // Error is handled by the hook
    }
  };

  const loadDatabaseStats = async () => {
    if (!getStats) return;
    
    setLoadingStats(true);
    try {
      const stats = await getStats();
      setDbStats(stats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load database stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadDatabaseStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You must be an administrator to access database management.
        </Alert>
      </Box>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }: any) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
            {loadingStats ? <CircularProgress size={24} /> : (value ?? '-')}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {icon}
          {trend !== undefined && trend !== 0 && (
            <Chip
              size="small"
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${trend > 0 ? '+' : ''}${trend}`}
              color={trend > 0 ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box data-testid="cs-database-management-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DatabaseIcon />
          {t('navigation:database-management', 'Database Management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh (5s)"
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDatabaseStats}
            disabled={loadingStats}
            variant="outlined"
            data-testid="cs-admin-refresh"
          >
            {t('common:refresh', 'Refresh Stats')}
          </Button>
        </Box>
      </Box>

      {adminError && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-admin-error">
          {adminError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} data-testid="cs-admin-success">
          {successMessage}
        </Alert>
      )}

      {/* Last Updated Banner */}
      {dbStats && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<TimerIcon />}>
          Last updated: {lastRefresh.toLocaleTimeString()} | 
          {autoRefresh ? ' Auto-refreshing every 5 seconds' : ' Auto-refresh disabled'}
        </Alert>
      )}

      {/* Statistics Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Users" />
            <Tab label="Requests" />
            <Tab label="Activity" />
            <Tab label="System" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Overview Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Total Users"
                  value={dbStats?.users?.total}
                  subtitle={`${dbStats?.users?.active || 0} active`}
                  icon={<PeopleIcon color="primary" />}
                  color="primary"
                  trend={dbStats?.users?.newToday}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Service Requests"
                  value={dbStats?.requests?.total}
                  subtitle={`${dbStats?.requests?.newToday || 0} today`}
                  icon={<RequestIcon color="secondary" />}
                  color="secondary"
                  trend={dbStats?.requests?.newToday}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Comments"
                  value={dbStats?.engagement?.comments}
                  subtitle={`${dbStats?.engagement?.commentsToday || 0} today`}
                  icon={<CommentIcon color="success" />}
                  color="success"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Testing Flags"
                  value={`${dbStats?.testingFlags?.enabled || 0}/${dbStats?.testingFlags?.total || 0}`}
                  subtitle={`${dbStats?.testingFlags?.percentage || 0}% enabled`}
                  icon={<BugIcon color="warning" />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Users Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User Distribution</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Total Users"
                      value={dbStats?.users?.total}
                      icon={<PeopleIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Active Users"
                      value={dbStats?.users?.active}
                      icon={<CheckIcon color="success" />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="New Today"
                      value={dbStats?.users?.newToday}
                      icon={<TrendingUpIcon color="primary" />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="New This Week"
                      value={dbStats?.users?.newThisWeek}
                      icon={<TrendingUpIcon color="secondary" />}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Users by Role</Typography>
                <List dense>
                  {dbStats?.users?.byRole && Object.entries(dbStats.users.byRole).map(([role, count]: any) => (
                    <ListItem key={role}>
                      <ListItemText primary={role} />
                      <Chip label={count} size="small" color="primary" />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Requests Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Request Status</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <StatCard
                      title="Total"
                      value={dbStats?.requests?.total}
                      color="default"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard
                      title="Submitted"
                      value={dbStats?.requests?.submitted}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard
                      title="In Progress"
                      value={dbStats?.requests?.inProgress}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatCard
                      title="Resolved"
                      value={dbStats?.requests?.resolved}
                      color="success"
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Request Activity</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <StatCard
                      title="New Today"
                      value={dbStats?.requests?.newToday}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="New This Week"
                      value={dbStats?.requests?.newThisWeek}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="Updated Today"
                      value={dbStats?.requests?.updatedToday}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>By Priority</Typography>
                <List dense>
                  {dbStats?.requests?.byPriority && Object.entries(dbStats.requests.byPriority).map(([priority, count]: any) => (
                    <ListItem key={priority}>
                      <ListItemText primary={priority} />
                      <Chip 
                        label={count} 
                        size="small" 
                        color={priority === 'URGENT' ? 'error' : priority === 'HIGH' ? 'warning' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Top Categories</Typography>
                <List dense>
                  {dbStats?.requests?.topCategories?.map((cat: any) => (
                    <ListItem key={cat.category}>
                      <ListItemText primary={cat.category} />
                      <Chip label={cat.count} size="small" />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Activity Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Engagement Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Total Comments"
                      value={dbStats?.engagement?.comments}
                      icon={<CommentIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Comments Today"
                      value={dbStats?.engagement?.commentsToday}
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Attachments"
                      value={dbStats?.engagement?.attachments}
                      icon={<AttachIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Upvotes"
                      value={dbStats?.engagement?.upvotes}
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Field Work</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Total Orders"
                      value={dbStats?.fieldWork?.total}
                      icon={<FieldWorkIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Active"
                      value={dbStats?.fieldWork?.active}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Completed"
                      value={dbStats?.fieldWork?.completed}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Completion Rate"
                      value={`${dbStats?.fieldWork?.completionRate || 0}%`}
                      icon={<SpeedIcon />}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {/* System Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>System Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Departments"
                      value={dbStats?.system?.departments}
                      subtitle={`of ${dbStats?.system?.totalDepartments}`}
                      icon={<CategoryIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Events Today"
                      value={dbStats?.system?.eventsToday}
                      icon={<TimerIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Events This Week"
                      value={dbStats?.system?.eventsThisWeek}
                      icon={<TimerIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Test Users"
                      value={dbStats?.users?.test}
                      icon={<PeopleIcon />}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Quality Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Quality Reviews"
                      value={dbStats?.quality?.totalReviews}
                      icon={<QualityIcon />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Avg Quality Score"
                      value={dbStats?.quality?.averageScore}
                      subtitle="out of 10"
                      icon={<QualityIcon color="warning" />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Testing Flags Status</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress
                          variant="determinate"
                          value={dbStats?.testingFlags?.percentage || 0}
                          size={60}
                          thickness={4}
                          color={dbStats?.testingFlags?.percentage > 50 ? 'warning' : 'primary'}
                        />
                        <Box>
                          <Typography variant="h6">
                            {dbStats?.testingFlags?.enabled || 0} / {dbStats?.testingFlags?.total || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Testing flags enabled
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Database Operations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DataIcon />
                <Typography variant="h6">
                  {t('admin:databaseOperations', 'Database Operations')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SeedIcon />}
                  onClick={handleSeedDatabase}
                  disabled={adminLoading}
                  fullWidth
                  size="large"
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
                  size="large"
                  data-testid="cs-admin-reset-button"
                >
                  {t('admin:resetDatabase', 'Reset Database')}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  disabled
                  fullWidth
                  size="large"
                >
                  {t('admin:backupDatabase', 'Backup Database (Coming Soon)')}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('admin:seed', 'Seed Database')}
                    secondary={t('admin:seedDescription', 'Adds comprehensive test data including users, requests, and comments.')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('admin:reset', 'Reset Database')}
                    secondary={t('admin:resetDescription', 'Clears all data and reinitializes with fresh seed data. This action cannot be undone.')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Accounts Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon />
                {t('admin:testAccounts', 'Test Accounts')}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                All test accounts use the password: <strong>password123</strong>
              </Alert>

              <Stack spacing={1}>
                {[
                  { role: 'CITIZEN', email: 'john@example.com', color: 'primary' },
                  { role: 'CLERK', email: 'mary.clerk@city.gov', color: 'secondary' },
                  { role: 'SUPERVISOR', email: 'supervisor@city.gov', color: 'warning' },
                  { role: 'FIELD_AGENT', email: 'field.agent@city.gov', color: 'success' },
                  { role: 'ADMIN', email: 'admin@city.gov', color: 'error' }
                ].map((account) => (
                  <Paper key={account.email} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {account.email}
                      </Typography>
                      <Chip label={account.role} size="small" color={account.color as any} />
                    </Box>
                  </Paper>
                ))}
              </Stack>
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
        <DialogTitle>
          {t('admin:confirmReset', 'Confirm Database Reset')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin:resetWarning', 'This will delete all existing data and reinitialize the database with fresh seed data. This action cannot be undone.')}
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
            {adminLoading ? t('admin:resetting', 'Resetting...') : t('admin:confirmResetButton', 'Reset Database')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseManagementPage;