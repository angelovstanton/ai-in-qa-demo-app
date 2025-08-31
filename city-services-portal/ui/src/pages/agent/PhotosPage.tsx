import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Fab,
  CircularProgress,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Add as AddIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import fieldAgentService from '../../services/fieldAgentService';
import type { WorkOrder } from '../../services/fieldAgentService';
import AuthenticatedImage from '../../components/AuthenticatedImage';

interface FieldPhoto {
  id: string;
  workOrderId: string;
  photoType: string;
  filename: string;
  caption?: string;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
  agent?: {
    id: string;
    name: string;
  };
}

interface PhotosData {
  all: FieldPhoto[];
  byType: Record<string, FieldPhoto[]>;
  count: {
    total: number;
    before: number;
    during: number;
    after: number;
    issue: number;
    safety: number;
  };
}

const PhotosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState('DURING');
  const [caption, setCaption] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [selectedWorkOrderPhotos, setSelectedWorkOrderPhotos] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load work orders for the agent (all statuses, we'll filter active ones client-side)
      const workOrdersResponse = await fieldAgentService.getWorkOrders({});
      // Filter for active work orders only
      const activeWorkOrders = workOrdersResponse.data.filter((order: WorkOrder) => 
        ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(order.status)
      );
      setWorkOrders(activeWorkOrders);
      
      // If we have work orders, load photos for the first one
      if (workOrdersResponse.data.length > 0) {
        const firstWorkOrderId = workOrdersResponse.data[0].id;
        setSelectedWorkOrderPhotos(firstWorkOrderId);
        await loadPhotosForWorkOrder(firstWorkOrderId);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotosForWorkOrder = async (orderId: string) => {
    try {
      const photosResponse = await fieldAgentService.getWorkOrderPhotos(orderId);
      setPhotos(photosResponse.data.all || []);
    } catch (err) {
      console.error('Failed to load photos:', err);
      // Don't show error if it's just that there are no photos
      if ((err as any)?.response?.status !== 404) {
        setError('Failed to load photos');
      } else {
        setPhotos([]);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !workOrderId) {
      setError('Please select a photo and work order');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('photos', selectedFile);
      formData.append('workOrderId', workOrderId);
      formData.append('photoType', photoType);
      if (caption) {
        formData.append('caption', caption);
      }
      
      // Get current location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          formData.append('gpsLat', position.coords.latitude.toString());
          formData.append('gpsLng', position.coords.longitude.toString());
        } catch (err) {
          console.log('Could not get location:', err);
        }
      }
      
      await fieldAgentService.uploadFieldPhoto(formData);
      
      setSuccessMessage('Photo uploaded successfully!');
      setUploadDialog(false);
      setSelectedFile(null);
      setCaption('');
      
      // Reload photos for the selected work order
      if (workOrderId) {
        setSelectedWorkOrderPhotos(workOrderId);
        await loadPhotosForWorkOrder(workOrderId);
      }
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkOrderSelect = async (orderId: string) => {
    setSelectedWorkOrderPhotos(orderId);
    await loadPhotosForWorkOrder(orderId);
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'BEFORE': return 'primary';
      case 'DURING': return 'info';
      case 'AFTER': return 'success';
      case 'ISSUE': return 'warning';
      case 'SAFETY': return 'error';
      default: return 'default';
    }
  };

  const getSelectedWorkOrder = () => {
    return workOrders.find(wo => wo.id === selectedWorkOrderPhotos);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-photos-page" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Field Photos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document your work with photos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={() => setUploadDialog(true)}
            disabled={workOrders.length === 0}
          >
            Take Photo
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Work Order Selection */}
      {workOrders.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Work Order
            </Typography>
            <Grid container spacing={2}>
              {workOrders.map((order) => (
                <Grid item xs={12} sm={6} md={4} key={order.id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedWorkOrderPhotos === order.id ? 2 : 1,
                      borderColor: selectedWorkOrderPhotos === order.id ? 'primary.main' : 'divider',
                      bgcolor: selectedWorkOrderPhotos === order.id ? 'action.hover' : 'background.paper'
                    }}
                    onClick={() => handleWorkOrderSelect(order.id)}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {order.request.title}
                    </Typography>
                    <Chip
                      label={order.status}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Selected Work Order Info */}
      {getSelectedWorkOrder() && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing photos for Work Order #{getSelectedWorkOrder()!.orderNumber}: {getSelectedWorkOrder()!.request.title}
        </Alert>
      )}

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <ImageList cols={isMobile ? 1 : 3} gap={16}>
          {photos.map((photo) => (
            <ImageListItem key={photo.id}>
              <AuthenticatedImage
                photoId={photo.id}
                alt={photo.caption || 'Field photo'}
                style={{ height: 200, objectFit: 'cover', width: '100%' }}
              />
              <ImageListItemBar
                title={photo.caption || 'No caption'}
                subtitle={
                  <Box component="span">
                    <Chip 
                      label={photo.photoType} 
                      size="small" 
                      color={getPhotoTypeColor(photo.photoType) as any}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Box component="span" display="block" sx={{ fontSize: '0.75rem' }}>
                      By: {photo.agent?.name || 'Unknown'}
                    </Box>
                    <Box component="span" display="block" sx={{ fontSize: '0.75rem' }}>
                      {format(new Date(photo.timestamp), 'MMM dd, yyyy HH:mm')}
                    </Box>
                    {photo.gpsLat && photo.gpsLng && (
                      <Box component="span" display="block" sx={{ fontSize: '0.75rem' }}>
                        <LocationIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {photo.gpsLat.toFixed(4)}, {photo.gpsLng.toFixed(4)}
                      </Box>
                    )}
                  </Box>
                }
                actionIcon={
                  <IconButton
                    sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                    onClick={() => {/* View details */}}
                  >
                    <InfoIcon />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CameraIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Photos Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {workOrders.length === 0 
                  ? 'You need active work orders to upload photos'
                  : selectedWorkOrderPhotos 
                    ? 'No photos for this work order yet'
                    : 'Select a work order to view photos'}
              </Typography>
              {workOrders.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<CameraIcon />}
                  onClick={() => setUploadDialog(true)}
                >
                  Take First Photo
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mobile FAB */}
      {isMobile && workOrders.length > 0 && (
        <Fab
          color="primary"
          aria-label="take photo"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => setUploadDialog(true)}
        >
          <CameraIcon />
        </Fab>
      )}

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog} 
        onClose={() => !uploading && setUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Take Field Photo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Work Order"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                required
                disabled={uploading}
              >
                <MenuItem value="">
                  <em>Select a work order</em>
                </MenuItem>
                {workOrders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.request.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={selectedFile ? <CheckIcon /> : <UploadIcon />}
                sx={{ py: 2 }}
                disabled={uploading}
                color={selectedFile ? 'success' : 'primary'}
              >
                {selectedFile ? selectedFile.name : 'Select Photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Photo Type"
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                disabled={uploading}
              >
                <MenuItem value="BEFORE">Before</MenuItem>
                <MenuItem value="DURING">During Work</MenuItem>
                <MenuItem value="AFTER">After</MenuItem>
                <MenuItem value="ISSUE">Issue/Problem</MenuItem>
                <MenuItem value="SAFETY">Safety Concern</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe what this photo shows..."
                multiline
                rows={2}
                disabled={uploading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !workOrderId || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotosPage;