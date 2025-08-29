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
  Chip,
  Alert,
  LinearProgress,
  Fab,
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import fieldAgentService from '../../services/fieldAgentService';

interface FieldPhoto {
  id: string;
  workOrderId: string;
  photoType: string;
  filename: string;
  caption?: string;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
  workOrder: {
    id: string;
    request: {
      code: string;
      title: string;
    };
  };
}

const PhotosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState('DURING');
  const [caption, setCaption] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get field photos
      // For now, simulate empty array
      setPhotos([]);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !workOrderId) return;

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('photoType', photoType);
      formData.append('caption', caption);
      formData.append('workOrderId', workOrderId);

      // This would be a new API endpoint to upload field photos
      // await fieldAgentService.uploadFieldPhoto(formData);
      
      setUploadDialog(false);
      setSelectedFile(null);
      setCaption('');
      loadPhotos();
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Failed to upload photo');
    }
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

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <ImageList cols={isMobile ? 1 : 3} gap={16}>
          {photos.map((photo) => (
            <ImageListItem key={photo.id}>
              <img
                src={`/api/field-photos/${photo.id}`}
                alt={photo.caption || 'Field photo'}
                loading="lazy"
                style={{ height: 200, objectFit: 'cover' }}
              />
              <ImageListItemBar
                title={photo.caption || 'No caption'}
                subtitle={
                  <Box>
                    <Chip 
                      label={photo.photoType} 
                      size="small" 
                      color={getPhotoTypeColor(photo.photoType) as any}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Typography variant="caption" display="block">
                      {photo.workOrder.request.code}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {format(new Date(photo.timestamp), 'MMM dd, yyyy HH:mm')}
                    </Typography>
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
                Start documenting your work by taking photos
              </Typography>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={() => setUploadDialog(true)}
              >
                Take First Photo
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mobile FAB */}
      {isMobile && (
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
        onClose={() => setUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Take Field Photo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                sx={{ py: 2 }}
              >
                {selectedFile ? selectedFile.name : 'Select Photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handleFileSelect}
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
                SelectProps={{ native: true }}
              >
                <option value="BEFORE">Before</option>
                <option value="DURING">During Work</option>
                <option value="AFTER">After</option>
                <option value="ISSUE">Issue/Problem</option>
                <option value="SAFETY">Safety Concern</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe what this photo shows..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Work Order ID"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                placeholder="Enter work order ID"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !workOrderId}
            startIcon={<UploadIcon />}
          >
            Upload Photo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotosPage;