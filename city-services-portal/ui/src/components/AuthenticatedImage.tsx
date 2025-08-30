import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';
import apiClient from '../lib/api';

interface AuthenticatedImageProps {
  photoId: string;
  alt?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  photoId,
  alt = 'Field photo',
  style,
  onClick,
  className
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Fetch image with authentication
        const response = await apiClient.get(`/field-photos/${photoId}`, {
          responseType: 'blob'
        });
        
        if (isMounted) {
          // Create object URL from blob
          const url = URL.createObjectURL(response.data);
          setImageUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup function to revoke object URL
    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [photoId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: style?.height || 200,
          bgcolor: 'grey.100'
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: style?.height || 200,
          bgcolor: 'grey.100',
          color: 'text.secondary'
        }}
      >
        <BrokenImageIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="caption">Failed to load image</Typography>
      </Box>
    );
  }

  return (
    <img
      src={imageUrl || ''}
      alt={alt}
      style={style}
      onClick={onClick}
      className={className}
      loading="lazy"
    />
  );
};

export default AuthenticatedImage;