import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Paper,
  Divider,
  LinearProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  CameraAlt as CameraIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Navigation as NavigationIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  DirectionsCar as CarIcon,
  Coffee as CoffeeIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Map as MapIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import fieldAgentService from '../../services/fieldAgentService';
import type { WorkOrder, AgentStatus, DashboardData, TimeTracking } from '../../services/fieldAgentService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const FieldAgentDashboard: React.FC = () => {
  const { t } = useTranslation(['agent', 'dashboard', 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [activeTracking, setActiveTracking] = useState<TimeTracking | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('AVAILABLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadAgentStatus();
    loadActiveTracking();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadAgentStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fieldAgentService.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(t('agent:errors.failedToLoadDashboard'));
    }
  };

  const loadAgentStatus = async () => {
    try {
      const response = await fieldAgentService.getCurrentStatus();
      setAgentStatus(response.data);
      setSelectedStatus(response.data.status);
    } catch (err) {
      console.error('Failed to load agent status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTracking = async () => {
    try {
      const response = await fieldAgentService.getActiveTimeTracking();
      setActiveTracking(response.data);
    } catch (err) {
      console.error('Failed to load active tracking:', err);
    }
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, newStatus: string | null) => {
    if (!newStatus) return;
    
    try {
      await fieldAgentService.updateStatus({
        status: newStatus as any,
        currentTaskId: newStatus === 'OFF_DUTY' ? null : agentStatus?.currentTaskId
      });
      setSelectedStatus(newStatus);
      await loadAgentStatus();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(t('agent:errors.failedToUpdateStatus'));
    }
  };

  const handleQuickCheckIn = async () => {
    try {
      await fieldAgentService.quickCheckIn();
      await loadAgentStatus();
    } catch (err) {
      console.error('Failed to check in:', err);
      setError(t('agent:errors.failedToCheckIn'));
    }
  };

  const handleQuickCheckOut = async () => {
    try {
      await fieldAgentService.quickCheckOut();
      await loadAgentStatus();
    } catch (err) {
      console.error('Failed to check out:', err);
      setError(t('agent:errors.failedToCheckOut'));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'ON_SITE': return 'info';
      case 'EN_ROUTE': return 'warning';
      case 'ASSIGNED': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircleIcon />;
      case 'BUSY': return <WorkIcon />;
      case 'EN_ROUTE': return <CarIcon />;
      case 'BREAK': return <CoffeeIcon />;
      case 'OFF_DUTY': return <HomeIcon />;
      default: return <WorkIcon />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-field-agent-dashboard" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header with Status Toggle */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              {t('agent:fieldAgentDashboard.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('agent:fieldAgentDashboard.welcomeBack', { name: user?.name })}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
              <ToggleButtonGroup
                value={selectedStatus}
                exclusive
                onChange={handleStatusChange}
                size={isMobile ? "small" : "medium"}
              >
                <ToggleButton value="AVAILABLE" color="success">
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  {t('agent:fieldAgentDashboard.statusToggle.available')}
                </ToggleButton>
                <ToggleButton value="BUSY" color="primary">
                  <WorkIcon sx={{ mr: 1 }} />
                  {t('agent:fieldAgentDashboard.statusToggle.busy')}
                </ToggleButton>
                <ToggleButton value="BREAK" color="warning">
                  <CoffeeIcon sx={{ mr: 1 }} />
                  {t('agent:fieldAgentDashboard.statusToggle.break')}
                </ToggleButton>
                <ToggleButton value="OFF_DUTY" color="error">
                  <HomeIcon sx={{ mr: 1 }} />
                  {t('agent:fieldAgentDashboard.statusToggle.offDuty')}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {dashboardData?.statistics.total || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('agent:fieldAgentDashboard.quickStats.totalTasks')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {dashboardData?.statistics.todayCompleted || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('agent:fieldAgentDashboard.quickStats.completedToday')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {formatDuration(dashboardData?.statistics.todayWorkTimeMinutes || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('agent:fieldAgentDashboard.quickStats.workTimeToday')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {dashboardData?.statistics.byStatus?.in_progress || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('agent:fieldAgentDashboard.quickStats.inProgress')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Time Tracking */}
      {activeTracking && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate(`/agent/time-tracking`)}>
              {t('common:viewDetails')}
            </Button>
          }
        >
          {t('agent:fieldAgentDashboard.timeTracking.activeTracking', { 
            timeType: activeTracking.timeType, 
            timeAgo: formatDistanceToNow(new Date(activeTracking.startTime)) 
          })}
        </Alert>
      )}

      {/* Today's Work Orders */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('agent:fieldAgentDashboard.workOrders.title')}</Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate('/agent/work-orders')}
            >
              {t('common:viewAll')}
            </Button>
          </Box>
          
          {dashboardData?.todaysOrders && dashboardData.todaysOrders.length > 0 ? (
            <List>
              {dashboardData.todaysOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <ListItem
                    button
                    onClick={() => navigate(`/agent/work-orders/${order.id}`)}
                  >
                    <ListItemIcon>
                      <Badge 
                        badgeContent={order.priority === 'EMERGENCY' ? '!' : undefined} 
                        color="error"
                      >
                        <AssignmentIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {order.request.title}
                          </Typography>
                          <Chip 
                            label={order.status} 
                            size="small"
                            color={getStatusColor(order.status) as any}
                          />
                          <Chip 
                            label={order.priority} 
                            size="small"
                            color={getPriorityColor(order.priority) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {order.request.streetAddress}, {order.request.city}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('agent:fieldAgentDashboard.workOrders.category')}: {order.request.category} | {t('agent:fieldAgentDashboard.workOrders.estimatedTime', { duration: formatDuration(order.estimatedDuration) })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open navigation
                          if (order.navigationLink) {
                            window.open(order.navigationLink, '_blank');
                          }
                        }}
                      >
                        <NavigationIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              {t('agent:fieldAgentDashboard.workOrders.noOrdersToday')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Mobile Floating Action Buttons */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 70, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Fab 
            color="primary" 
            size="medium"
            onClick={() => navigate('/agent/work-orders/active')}
          >
            <AssignmentIcon />
          </Fab>
          <Fab 
            color="secondary" 
            size="medium"
            onClick={() => navigate('/agent/time-tracking')}
          >
            <TimerIcon />
          </Fab>
          <Fab 
            color="info" 
            size="medium"
            onClick={() => navigate('/agent/photos')}
          >
            <CameraIcon />
          </Fab>
        </Box>
      )}

      {/* Desktop Quick Actions */}
      {!isMobile && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('agent:fieldAgentDashboard.quickActions.title')}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AssignmentIcon />}
                      onClick={() => navigate('/agent/work-orders')}
                    >
                      {t('agent:fieldAgentDashboard.quickActions.workOrders')}
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<TimerIcon />}
                      onClick={() => navigate('/agent/time-tracking')}
                    >
                      {t('agent:fieldAgentDashboard.quickActions.timeTracking')}
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="info"
                      startIcon={<CameraIcon />}
                      onClick={() => navigate('/agent/photos')}
                    >
                      {t('agent:fieldAgentDashboard.quickActions.photos')}
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<MapIcon />}
                      onClick={() => navigate('/agent/map')}
                    >
                      {t('agent:fieldAgentDashboard.quickActions.mapView')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FieldAgentDashboard;