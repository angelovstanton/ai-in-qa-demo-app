import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  CameraAlt as CameraIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Navigation as NavigationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  DirectionsRun as DirectionsRunIcon,
  Build as BuildIcon,
  Done as DoneIcon,
  Notes as NotesIcon,
  AttachFile as AttachFileIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  Map as MapIcon,
  PhotoCamera as PhotoCameraIcon,
  AddAPhoto as AddAPhotoIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import fieldAgentService from '../../services/fieldAgentService';
import type { WorkOrder, FieldPhoto } from '../../services/fieldAgentService';
import AuthenticatedImage from '../../components/AuthenticatedImage';

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
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [photos, setPhotos] = useState<{ byType: Record<string, FieldPhoto[]>, count: any } | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'BEFORE' | 'DURING' | 'AFTER'>('BEFORE');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
      loadPhotos();
    }
  }, [id]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fieldAgentService.getWorkOrder(id!);
      setWorkOrder(response.data);
    } catch (err) {
      console.error('Failed to load work order:', err);
      setError('Failed to load work order details');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await fieldAgentService.getWorkOrderPhotos(id!);
      setPhotos(response.data);
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };

  const handleStatusUpdate = async (newStatus: WorkOrder['status']) => {
    if (!workOrder) return;

    try {
      if (newStatus === 'ON_SITE' && navigator.geolocation) {
        // Get current location for check-in
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await fieldAgentService.checkIn(workOrder.id, {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            await loadWorkOrder();
          },
          (error) => {
            console.error('Failed to get location:', error);
            // Proceed without location
            updateStatus(newStatus);
          }
        );
      } else {
        await updateStatus(newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update work order status');
    }
  };

  const updateStatus = async (newStatus: WorkOrder['status']) => {
    if (!workOrder) return;
    
    await fieldAgentService.updateWorkOrder(workOrder.id, { status: newStatus });
    await loadWorkOrder();
  };

  const handleComplete = async () => {
    if (!workOrder) return;

    try {
      await fieldAgentService.updateWorkOrder(workOrder.id, {
        status: 'COMPLETED',
        completionNotes
      });
      
      if (workOrder.checkInTime) {
        await fieldAgentService.checkOut(workOrder.id);
      }
      
      setShowCompleteDialog(false);
      await loadWorkOrder();
    } catch (err) {
      console.error('Failed to complete work order:', err);
      setError('Failed to complete work order');
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!workOrder || files.length === 0) return;

    try {
      setUploadingPhotos(true);
      const fileArray = Array.from(files);
      
      await fieldAgentService.uploadPhotos(
        workOrder.id,
        fileArray,
        { photoType: selectedPhotoType }
      );
      
      setShowPhotoUpload(false);
      await loadPhotos();
    } catch (err) {
      console.error('Failed to upload photos:', err);
      setError('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getNextStatus = (currentStatus: string): WorkOrder['status'] | null => {
    switch (currentStatus) {
      case 'ASSIGNED': return 'EN_ROUTE';
      case 'EN_ROUTE': return 'ON_SITE';
      case 'ON_SITE': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'COMPLETED';
      default: return null;
    }
  };

  const getStatusSteps = () => [
    { label: 'Assigned', status: 'ASSIGNED' },
    { label: 'En Route', status: 'EN_ROUTE' },
    { label: 'On Site', status: 'ON_SITE' },
    { label: 'In Progress', status: 'IN_PROGRESS' },
    { label: 'Completed', status: 'COMPLETED' }
  ];

  const getCurrentStepIndex = () => {
    if (!workOrder) return 0;
    const steps = getStatusSteps();
    return steps.findIndex(step => step.status === workOrder.status);
  };

  const speedDialActions = [
    { icon: <CameraIcon />, name: 'Take Photo', action: () => setShowPhotoUpload(true) },
    { icon: <TimerIcon />, name: 'Time Tracking', action: () => navigate(`/agent/time-tracking?workOrderId=${id}`) },
    { icon: <PhoneIcon />, name: 'Call Customer', action: () => workOrder?.request.phone && window.open(`tel:${workOrder.request.phone}`) },
    { icon: <NavigationIcon />, name: 'Navigate', action: () => workOrder?.navigationLink && window.open(workOrder.navigationLink, '_blank') }
  ];

  if (loading) {
    return <LinearProgress />;
  }

  if (!workOrder) {
    return (
      <Alert severity="error">
        Work order not found
      </Alert>
    );
  }

  return (
    <Box data-testid="cs-work-order-detail" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5">
                Work Order {workOrder.request.code}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={workOrder.status.replace('_', ' ')} 
                  color={getStatusColor(workOrder.status) as any}
                />
                <Chip 
                  label={workOrder.priority} 
                  color={getPriorityColor(workOrder.priority) as any}
                  variant="outlined"
                />
                <Chip 
                  label={workOrder.taskType} 
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          
          {/* Action Button */}
          {workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
            <Button
              variant="contained"
              size="large"
              startIcon={
                workOrder.status === 'IN_PROGRESS' ? <DoneIcon /> : <PlayIcon />
              }
              onClick={() => {
                const nextStatus = getNextStatus(workOrder.status);
                if (nextStatus === 'COMPLETED') {
                  setShowCompleteDialog(true);
                } else if (nextStatus) {
                  handleStatusUpdate(nextStatus);
                }
              }}
            >
              {workOrder.status === 'IN_PROGRESS' ? 'Complete' : `Start ${getNextStatus(workOrder.status)?.replace('_', ' ')}`}
            </Button>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Progress Stepper */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stepper activeStep={getCurrentStepIndex()} orientation={isMobile ? 'vertical' : 'horizontal'}>
            {getStatusSteps().map((step) => (
              <Step key={step.status}>
                <StepLabel>{step.label}</StepLabel>
                {isMobile && (
                  <StepContent>
                    {step.status === workOrder.status && (
                      <Typography variant="caption" color="text.secondary">
                        Current Status
                      </Typography>
                    )}
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Details" />
          <Tab label={`Photos (${photos?.count.total || 0})`} />
          <Tab label="Customer Info" />
          <Tab label="Time Tracking" />
          <Tab label="Notes" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Work Order Details */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Service Request</Typography>
                <Typography variant="body1" gutterBottom>
                  {workOrder.request.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {workOrder.request.description}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Category</Typography>
                    <Typography variant="body2">{workOrder.request.category}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Department</Typography>
                    <Typography variant="body2">{workOrder.request.department?.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Estimated Duration</Typography>
                    <Typography variant="body2">{workOrder.estimatedDuration} minutes</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Actual Duration</Typography>
                    <Typography variant="body2">{workOrder.actualDuration ? `${workOrder.actualDuration} minutes` : 'N/A'}</Typography>
                  </Grid>
                </Grid>

                {workOrder.safetyNotes && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Safety Notes</Typography>
                    <Typography variant="body2">{workOrder.safetyNotes}</Typography>
                  </Alert>
                )}

                {workOrder.requiredTools && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Required Tools</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {JSON.parse(workOrder.requiredTools).map((tool: string) => (
                        <Chip key={tool} label={tool} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Location Card */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <LocationIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Location
                </Typography>
                <Typography variant="body2">
                  {workOrder.request.streetAddress}
                </Typography>
                <Typography variant="body2">
                  {workOrder.request.city} {workOrder.request.postalCode}
                </Typography>
                {workOrder.request.landmark && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Landmark: {workOrder.request.landmark}
                  </Typography>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<NavigationIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => workOrder.navigationLink && window.open(workOrder.navigationLink, '_blank')}
                  disabled={!workOrder.navigationLink}
                >
                  Navigate
                </Button>
              </CardContent>
            </Card>

            {/* Time Tracking Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TimerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Time Tracking
                </Typography>
                <List dense>
                  {workOrder.checkInTime && (
                    <ListItem>
                      <ListItemText 
                        primary="Check In"
                        secondary={format(parseISO(workOrder.checkInTime), 'MMM dd, HH:mm')}
                      />
                    </ListItem>
                  )}
                  {workOrder.checkOutTime && (
                    <ListItem>
                      <ListItemText 
                        primary="Check Out"
                        secondary={format(parseISO(workOrder.checkOutTime), 'MMM dd, HH:mm')}
                      />
                    </ListItem>
                  )}
                </List>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TimerIcon />}
                  onClick={() => navigate(`/agent/time-tracking?workOrderId=${id}`)}
                >
                  View Time Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Photos */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Photos</Typography>
              <Button
                variant="contained"
                startIcon={<AddAPhotoIcon />}
                onClick={() => setShowPhotoUpload(true)}
              >
                Add Photos
              </Button>
            </Box>

            {photos && photos.byType && (
              <Box>
                {['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY'].map((type) => {
                  const typePhotos = photos.byType[type] || [];
                  if (typePhotos.length === 0) return null;

                  return (
                    <Box key={type} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {type} Photos ({typePhotos.length})
                      </Typography>
                      <ImageList sx={{ width: '100%' }} cols={isMobile ? 2 : 4} rowHeight={200}>
                        {typePhotos.map((photo) => (
                          <ImageListItem key={photo.id}>
                            <AuthenticatedImage
                              photoId={photo.id}
                              alt={photo.caption || photo.filename}
                              style={{ cursor: 'pointer', width: '100%', height: 'auto' }}
                              onClick={() => {
                                // Open in new tab using blob URL
                                fieldAgentService.getPhotoBlob(photo.id).then(url => {
                                  window.open(url, '_blank');
                                }).catch(err => console.error('Failed to open photo:', err));
                              }}
                            />
                            <ImageListItemBar
                              title={photo.caption || photo.filename}
                              subtitle={format(parseISO(photo.timestamp), 'MMM dd, HH:mm')}
                            />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Customer Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Name"
                  secondary={workOrder.request.creator?.name || 'N/A'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary={workOrder.request.creator?.email || workOrder.request.email || 'N/A'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone"
                  secondary={workOrder.request.creator?.phone || workOrder.request.phone || 'N/A'}
                />
                {workOrder.request.phone && (
                  <ListItemIcon>
                    <IconButton onClick={() => window.open(`tel:${workOrder.request.phone}`)}>
                      <PhoneIcon />
                    </IconButton>
                  </ListItemIcon>
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Address"
                  secondary={
                    workOrder.request.creator?.streetAddress ? 
                    `${workOrder.request.creator.streetAddress}, ${workOrder.request.creator.city} ${workOrder.request.creator.postalCode}` :
                    'N/A'
                  }
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Work Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Completion Notes"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
          <Button onClick={handleComplete} variant="contained" color="primary">
            Complete Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onClose={() => setShowPhotoUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photos</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Photo Type</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY'].map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => setSelectedPhotoType(type as any)}
                  color={selectedPhotoType === type ? 'primary' : 'default'}
                  variant={selectedPhotoType === type ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
          
          <Button
            variant="contained"
            component="label"
            fullWidth
            startIcon={<CloudUploadIcon />}
            disabled={uploadingPhotos}
          >
            Select Photos
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
            />
          </Button>
          
          {uploadingPhotos && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPhotoUpload(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Speed Dial for Mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                setSpeedDialOpen(false);
                action.action();
              }}
            />
          ))}
        </SpeedDial>
      )}
    </Box>
  );
};

export default WorkOrderDetailPage;