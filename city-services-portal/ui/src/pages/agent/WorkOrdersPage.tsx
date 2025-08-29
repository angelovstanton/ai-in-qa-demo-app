import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Grid,
  Badge,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Navigation as NavigationIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  DirectionsRun as DirectionsRunIcon,
  Build as BuildIcon,
  Done as DoneIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import fieldAgentService from '../../services/fieldAgentService';
import type { WorkOrder, WorkOrderFilters } from '../../services/fieldAgentService';

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
      id={`work-orders-tabpanel-${index}`}
      aria-labelledby={`work-orders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const WorkOrdersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<WorkOrderFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkOrders();
  }, [filters, tabValue]);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply status filter based on tab
      const statusFilter = getStatusFromTab(tabValue);
      const response = await fieldAgentService.getWorkOrders({
        ...filters,
        status: statusFilter
      });
      
      setWorkOrders(response.data);
      setTotalCount(response.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load work orders:', err);
      setError('Failed to load work orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusFromTab = (tab: number): WorkOrderFilters['status'] | undefined => {
    switch (tab) {
      case 1: return 'ASSIGNED';
      case 2: return 'EN_ROUTE';
      case 3: return 'ON_SITE';
      case 4: return 'IN_PROGRESS';
      case 5: return 'COMPLETED';
      default: return undefined;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkOrders();
  };

  const handleStartWork = async (workOrder: WorkOrder) => {
    try {
      await fieldAgentService.updateWorkOrder(workOrder.id, { status: 'EN_ROUTE' });
      handleRefresh();
    } catch (err) {
      console.error('Failed to update work order:', err);
      setError('Failed to start work');
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
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <DoneIcon />;
      case 'IN_PROGRESS': return <BuildIcon />;
      case 'ON_SITE': return <LocationIcon />;
      case 'EN_ROUTE': return <DirectionsRunIcon />;
      case 'ASSIGNED': return <AssignmentIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderWorkOrderItem = (order: WorkOrder) => (
    <React.Fragment key={order.id}>
      <ListItem
        button
        onClick={() => navigate(`/agent/work-orders/${order.id}`)}
        sx={{
          '&:hover': {
            backgroundColor: theme.palette.action.hover
          }
        }}
      >
        <ListItemIcon>
          <Badge 
            badgeContent={order.priority === 'EMERGENCY' ? '!' : undefined} 
            color="error"
          >
            {getStatusIcon(order.status)}
          </Badge>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {order.request.code}
              </Typography>
              <Chip 
                label={order.status.replace('_', ' ')} 
                size="small"
                color={getStatusColor(order.status) as any}
              />
              <Chip 
                label={order.priority} 
                size="small"
                color={getPriorityColor(order.priority) as any}
                variant="outlined"
              />
              {order.taskType && (
                <Chip 
                  label={order.taskType} 
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {order.request.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <LocationIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                {order.request.streetAddress}, {order.request.city}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <TimerIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Est. {formatDuration(order.estimatedDuration)} | 
                Created: {format(parseISO(order.createdAt), 'MMM dd, HH:mm')}
              </Typography>
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {order.navigationLink && (
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(order.navigationLink, '_blank');
                }}
                title="Navigate"
              >
                <NavigationIcon />
              </IconButton>
            )}
            {order.status === 'ASSIGNED' && (
              <IconButton 
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartWork(order);
                }}
                title="Start Work"
              >
                <PlayIcon />
              </IconButton>
            )}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      <Divider />
    </React.Fragment>
  );

  return (
    <Box data-testid="cs-work-orders-page" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Work Orders</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => {/* TODO: Open filter dialog */}}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SortIcon />}
              onClick={() => {/* TODO: Open sort menu */}}
            >
              Sort
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label={`All (${totalCount})`} />
          <Tab label="Assigned" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="En Route" icon={<DirectionsRunIcon />} iconPosition="start" />
          <Tab label="On Site" icon={<LocationIcon />} iconPosition="start" />
          <Tab label="In Progress" icon={<BuildIcon />} iconPosition="start" />
          <Tab label="Completed" icon={<DoneIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Work Orders List */}
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <Card>
              <List sx={{ p: 0 }}>
                {workOrders.length > 0 ? (
                  workOrders.map(renderWorkOrderItem)
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary="No work orders found"
                      secondary="There are no work orders matching your filters"
                      sx={{ textAlign: 'center', py: 4 }}
                    />
                  </ListItem>
                )}
              </List>
            </Card>
          </TabPanel>
          
          {[1, 2, 3, 4, 5].map((index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              <Card>
                <List sx={{ p: 0 }}>
                  {workOrders.length > 0 ? (
                    workOrders.map(renderWorkOrderItem)
                  ) : (
                    <ListItem>
                      <ListItemText 
                        primary={`No ${getStatusFromTab(index)?.toLowerCase().replace('_', ' ')} work orders`}
                        secondary="There are no work orders with this status"
                        sx={{ textAlign: 'center', py: 4 }}
                      />
                    </ListItem>
                  )}
                </List>
              </Card>
            </TabPanel>
          ))}
        </>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="add"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => navigate('/agent/my-tasks')}
        >
          <AssignmentIcon />
        </Fab>
      )}
    </Box>
  );
};

export default WorkOrdersPage;