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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';

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

  // Chart data
  const performanceTrendData = [
    { month: 'Jan', quality: 8.2, satisfaction: 4.1, productivity: 85 },
    { month: 'Feb', quality: 8.5, satisfaction: 4.2, productivity: 87 },
    { month: 'Mar', quality: 8.1, satisfaction: 4.0, productivity: 83 },
    { month: 'Apr', quality: 8.7, satisfaction: 4.3, productivity: 89 },
    { month: 'May', quality: 8.9, satisfaction: 4.4, productivity: 91 },
    { month: 'Jun', quality: 8.6, satisfaction: 4.2, productivity: 88 },
  ];

  const requestVolumeData = [
    { period: 'Week 1', submitted: 45, resolved: 42, pending: 3 },
    { period: 'Week 2', submitted: 52, resolved: 48, pending: 7 },
    { period: 'Week 3', submitted: 38, resolved: 41, pending: 4 },
    { period: 'Week 4', submitted: 47, resolved: 44, pending: 6 },
  ];

  const categoryDistribution = [
    { name: 'Public Works', value: 35, color: '#8884d8' },
    { name: 'Parks & Recreation', value: 25, color: '#82ca9d' },
    { name: 'Utilities', value: 20, color: '#ffc658' },
    { name: 'Transportation', value: 15, color: '#ff7c7c' },
    { name: 'Other', value: 5, color: '#8dd1e1' },
  ];

  const goalProgressData = [
    { name: 'Resolution Time', value: 78, target: 85, color: '#8884d8' },
    { name: 'Quality Score', value: 92, target: 90, color: '#82ca9d' },
    { name: 'Satisfaction', value: 85, target: 88, color: '#ffc658' },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

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
          {/* Performance Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Quality Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      name="Satisfaction"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="#ffc658" 
                      strokeWidth={3}
                      name="Productivity %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Request Volume Chart */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Request Volume
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={requestVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="submitted" fill="#8884d8" name="Submitted" />
                    <Bar dataKey="resolved" fill="#82ca9d" name="Resolved" />
                    <Bar dataKey="pending" fill="#ffc658" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

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
                <Button size="small" color="primary" href="/supervisor/staff-performance?mode=performance&sort=qualityScore&order=desc">
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
                <Button size="small" color="primary" href="/supervisor/staff-performance?mode=leaderboard&sort=productivityScore&order=desc">
                  View Team Leaderboard
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Goal Progress Chart */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Goal Progress Overview
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart 
                    cx="40%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="70%" 
                    data={goalProgressData}
                    margin={{ top: 20, right: 80, bottom: 20, left: 20 }}
                  >
                    <RadialBar 
                      minAngle={15} 
                      label={{ position: 'insideStart', fill: '#fff' }} 
                      background 
                      clockWise 
                      dataKey="value" 
                      fill={(entry, index) => goalProgressData[index]?.color || '#8884d8'}
                    />
                    <Legend 
                      iconSize={12} 
                      width={120} 
                      height={140} 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ 
                        paddingLeft: '20px',
                        fontSize: '12px',
                        lineHeight: '20px'
                      }}
                    />
                    <RechartsTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Distribution */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Request Category Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

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