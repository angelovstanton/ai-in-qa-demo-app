import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Close,
} from '@mui/icons-material';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface ImageUploadProps {
  onImagesChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in bytes
  allowedTypes?: string[];
  displaySize?: { width: number; height: number };
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 5,
  maxSizePerImage = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'],
  displaySize = { width: 200, height: 150 },
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIdCounter = useRef(0);

  const validateImage = (file: File): string | null => {
    // File size validation
    if (file.size > maxSizePerImage) {
      return `File size must be less than ${Math.round(maxSizePerImage / (1024 * 1024))}MB`;
    }

    // File type validation
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return `Only ${allowedTypes.join(', ').replace(/image\//g, '').toUpperCase()} files are allowed`;
    }

    // File name validation
    if (!file.name || file.name.trim().length === 0) {
      return 'File must have a valid name';
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.php$/i, /\.js$/i, /\.html$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return 'File type not allowed for security reasons';
    }

    return null;
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 255);
  };

  const simulateUpload = async (image: UploadedImage): Promise<void> => {
    const updateProgress = (progress: number) => {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, progress } : img
      ));
    };

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        updateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate successful upload
      const uploadedUrl = `/uploads/images/${image.id}_${sanitizeFileName(image.file.name)}`;
      
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, status: 'success' as const, progress: 100, url: uploadedUrl }
          : img
      ));
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, status: 'error' as const, error: 'Upload failed' }
          : img
      ));
    }
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    setError(null);

    // Check if adding these files would exceed the maximum
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateImage(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      const imageId = `upload_${++uploadIdCounter.current}_${Date.now()}`;
      const preview = URL.createObjectURL(file);

      const newImage: UploadedImage = {
        id: imageId,
        file,
        preview,
        status: 'uploading',
        progress: 0,
      };

      newImages.push(newImage);
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Start upload simulation for each new image
      newImages.forEach(image => simulateUpload(image));
      
      // Notify parent component
      onImagesChange?.(updatedImages);
    }
  }, [images, maxImages, maxSizePerImage, allowedTypes, onImagesChange]);

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const updated = prev.filter(img => img.id !== imageId);
      onImagesChange?.(updated);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  return (
    <Box data-testid="cs-image-upload">
      <Typography variant="h6" gutterBottom>
        Image Upload
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="cs-image-upload-error">
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          backgroundColor: isDragOver ? 'primary.50' : 'grey.50',
          cursor: 'pointer',
          textAlign: 'center',
          mb: 3,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          },
        }}
        data-testid="cs-image-upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          data-testid="cs-image-upload-input"
        />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragOver ? 'Drop images here' : 'Drag & drop images or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports JPEG and PNG files up to {Math.round(maxSizePerImage / (1024 * 1024))}MB each
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum {maxImages} images allowed
        </Typography>
      </Paper>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Images ({images.length}/{maxImages})
          </Typography>
          
          <Grid container spacing={2} data-testid="cs-image-upload-grid">
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                <Card
                  sx={{
                    position: 'relative',
                    '&:hover .image-overlay': {
                      opacity: 1,
                    },
                  }}
                  data-testid={`cs-image-item-${image.id}`}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: displaySize.height,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    
                    {/* Overlay */}
                    <Box
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                    >
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                        data-testid={`cs-image-delete-${image.id}`}
                        sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap title={image.file.name}>
                      {image.file.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(image.file.size / 1024)}KB
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {image.status === 'uploading' && (
                          <Box sx={{ width: 40, mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={image.progress}
                            />
                          </Box>
                        )}
                        
                        <Chip
                          size="small"
                          label={image.status}
                          color={
                            image.status === 'success' ? 'success' :
                            image.status === 'error' ? 'error' : 'default'
                          }
                        />
                      </Box>
                    </Box>
                    
                    {image.status === 'error' && image.error && (
                      <Typography variant="caption" color="error" display="block">
                        {image.error}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
        data-testid="cs-image-preview-dialog"
      >
        {selectedImage && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedImage.file.name}</Typography>
              <IconButton
                onClick={() => setSelectedImage(null)}
                data-testid="cs-image-preview-close"
              >
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={selectedImage.preview}
                  alt={selectedImage.file.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain',
                  }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Size: {Math.round(selectedImage.file.size / 1024)}KB | 
                  Type: {selectedImage.file.type} |
                  Status: {selectedImage.status}
                </Typography>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button
                color="error"
                startIcon={<Delete />}
                onClick={() => {
                  removeImage(selectedImage.id);
                  setSelectedImage(null);
                }}
                data-testid="cs-image-preview-delete"
              >
                Delete Image
              </Button>
              
              <Button onClick={() => setSelectedImage(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ImageUpload;