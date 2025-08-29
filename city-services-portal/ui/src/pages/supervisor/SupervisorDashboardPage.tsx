import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface DashboardData {
  departmentMetrics: {
    totalRequests: number;
    pendingRequests: number;
    resolvedRequests: number;
    resolutionRate: number;
    avgQualityScore: number;
  };
  performanceGoals: {
    active: number;
    overdue: number;
    upcomingDeadlines: number;
  };
  teamPerformance: {
    recentScores: any[];
    topPerformers: any[];
  };
  alerts: {
    overdueGoals: number;
    upcomingDeadlines: number;
    lowQualityAlerts: number;
  };
  recentActivity: {
    upcomingDeadlines: any[];
  };
}

const SupervisorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/supervisor/dashboard-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box m={2}>
        <Alert severity="info">No dashboard data available.</Alert>
      </Box>
    );
  }

  return (
    <Box data-testid="cs-supervisor-dashboard-page">
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Supervisor Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.firstName || user?.name}
          </Typography>
        </Box>
        <Tooltip title="Refresh dashboard">
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Requests
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.departmentMetrics.totalRequests}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pending Requests
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.departmentMetrics.pendingRequests}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Resolution Rate
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.departmentMetrics.resolutionRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Quality Score
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.departmentMetrics.avgQualityScore.toFixed(1)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <StarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {(dashboardData.alerts.overdueGoals > 0 || 
        dashboardData.alerts.upcomingDeadlines > 0 || 
        dashboardData.alerts.lowQualityAlerts > 0) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Action Required:
          </Typography>
          {dashboardData.alerts.overdueGoals > 0 && (
            <Typography variant="body2">
              • {dashboardData.alerts.overdueGoals} overdue performance goals
            </Typography>
          )}
          {dashboardData.alerts.upcomingDeadlines > 0 && (
            <Typography variant="body2">
              • {dashboardData.alerts.upcomingDeadlines} upcoming deadlines
            </Typography>
          )}
          {dashboardData.alerts.lowQualityAlerts > 0 && (
            <Typography variant="body2">
              • {dashboardData.alerts.lowQualityAlerts} low quality alerts
            </Typography>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab icon={<PeopleIcon />} label="Team Performance" />
          <Tab icon={<AnalyticsIcon />} label="Performance Goals" />
          <Tab icon={<DashboardIcon />} label="Recent Activity" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Recent Performance Scores */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Performance Scores
                </Typography>
                <List>
                  {dashboardData.teamPerformance.recentScores.slice(0, 5).map((score, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar>
                          {score.user.name?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={score.user.name || score.user.email}
                        secondary={`Quality Score: ${score.qualityScore.toFixed(1)} | Period: ${score.performancePeriod}`}
                      />
                      <Chip 
                        size="small" 
                        label={score.qualityScore.toFixed(1)}
                        color={score.qualityScore >= 8 ? 'success' : score.qualityScore >= 6 ? 'warning' : 'error'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View All Performance Data
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Top Performers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <List>
                  {dashboardData.teamPerformance.topPerformers.slice(0, 5).map((performer, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={performer.user.name || performer.user.email}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Quality: {performer.qualityScore.toFixed(1)} | 
                              Satisfaction: {performer.citizenSatisfactionRating.toFixed(1)}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={performer.productivityScore} 
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Team Leaderboard
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  Active Goals
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h3" color="success.main">
                    {dashboardData.performanceGoals.active}
                  </Typography>
                  <ArrowUpwardIcon color="success" sx={{ ml: 1 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Goals currently in progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error.main">
                  Overdue Goals
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h3" color="error.main">
                    {dashboardData.performanceGoals.overdue}
                  </Typography>
                  {dashboardData.performanceGoals.overdue > 0 && (
                    <WarningIcon color="error" sx={{ ml: 1 }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Goals past their deadline
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Upcoming Deadlines
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h3" color="warning.main">
                    {dashboardData.performanceGoals.upcomingDeadlines}
                  </Typography>
                  {dashboardData.performanceGoals.upcomingDeadlines > 0 && (
                    <WarningIcon color="warning" sx={{ ml: 1 }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Goals due within 7 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {dashboardData.recentActivity.upcomingDeadlines.length === 0 ? (
              <Typography color="text.secondary">
                No recent activity to display.
              </Typography>
            ) : (
              <List>
                {dashboardData.recentActivity.upcomingDeadlines.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`Activity ${index + 1}`}
                      secondary="Recent activity item"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default SupervisorDashboardPage;