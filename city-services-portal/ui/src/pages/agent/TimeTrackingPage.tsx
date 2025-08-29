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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Work as WorkIcon,
  DirectionsCar as CarIcon,
  Build as BuildIcon,
  Description as DocumentationIcon,
  Coffee as CoffeeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import fieldAgentService from '../../services/fieldAgentService';
import type { TimeTracking, WorkOrder } from '../../services/fieldAgentService';

const TimeTrackingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeTracking[]>([]);
  const [activeTracking, setActiveTracking] = useState<TimeTracking | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startDialog, setStartDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('');
  const [selectedTimeType, setSelectedTimeType] = useState('WORK');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activeResponse, workOrdersResponse] = await Promise.all([
        fieldAgentService.getActiveTimeTracking().catch(() => ({ data: null })),
        fieldAgentService.getWorkOrders({ limit: 50, status: 'IN_PROGRESS' })
      ]);
      
      setActiveTracking(activeResponse.data);
      setWorkOrders(workOrdersResponse.data);
      
      // Load recent time entries - this would need a new API endpoint
      // For now, just use empty array
      setTimeEntries([]);
    } catch (err) {
      console.error('Failed to load time tracking data:', err);
      setError('Failed to load time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTracking = async () => {
    try {
      await fieldAgentService.startTimeTracking({
        workOrderId: selectedWorkOrder,
        timeType: selectedTimeType as any,
        notes
      });
      setStartDialog(false);
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to start time tracking:', err);
      setError('Failed to start time tracking');
    }
  };

  const handleStopTracking = async () => {
    if (!activeTracking) return;
    
    try {
      await fieldAgentService.endTimeTracking(activeTracking.id, notes);
      setActiveTracking(null);
      loadData();
    } catch (err) {
      console.error('Failed to stop time tracking:', err);
      setError('Failed to stop time tracking');
    }
  };

  const getTimeTypeIcon = (timeType: string) => {
    switch (timeType) {
      case 'TRAVEL': return <CarIcon />;
      case 'WORK': return <WorkIcon />;
      case 'SETUP': return <BuildIcon />;
      case 'DOCUMENTATION': return <DocumentationIcon />;
      case 'BREAK': return <CoffeeIcon />;
      default: return <TimerIcon />;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
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
    <Box data-testid="cs-time-tracking-page" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Time Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your work time for accurate reporting
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Tracking Card */}
      {activeTracking ? (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getTimeTypeIcon(activeTracking.timeType)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {activeTracking.timeType.replace('_', ' ')}
                  </Typography>
                  <Chip 
                    label="ACTIVE" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 2 }}
                  />
                </Box>
                <Typography variant="body2">
                  Started: {formatDistanceToNow(new Date(activeTracking.startTime))} ago
                </Typography>
                {activeTracking.workOrder && (
                  <Typography variant="body2">
                    Work Order: {activeTracking.workOrder.request.code}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopTracking}
                >
                  Stop Tracking
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <TimerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Active Time Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start tracking time for your current work activities
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => setStartDialog(true)}
              >
                Start Tracking
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Time Entries */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Time Entries
          </Typography>
          
          {timeEntries.length > 0 ? (
            <List>
              {timeEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getTimeTypeIcon(entry.timeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {entry.timeType.replace('_', ' ')}
                          </Typography>
                          <Chip 
                            label={formatDuration(entry.duration)} 
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {format(new Date(entry.startTime), 'MMM dd, yyyy HH:mm')}
                            {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                          </Typography>
                          {entry.notes && (
                            <Typography variant="caption" color="text.secondary">
                              {entry.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No time entries found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Start Tracking Dialog */}
      <Dialog 
        open={startDialog} 
        onClose={() => setStartDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start Time Tracking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Work Order"
                value={selectedWorkOrder}
                onChange={(e) => setSelectedWorkOrder(e.target.value)}
                required
                SelectProps={{ native: true }}
              >
                <option value="">Select Work Order</option>
                {workOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.request.code} - {order.request.title}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Activity Type"
                value={selectedTimeType}
                onChange={(e) => setSelectedTimeType(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="TRAVEL">Travel</option>
                <option value="SETUP">Setup</option>
                <option value="WORK">Work</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="BREAK">Break</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStartTracking}
            variant="contained"
            disabled={!selectedWorkOrder}
          >
            Start Tracking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeTrackingPage;