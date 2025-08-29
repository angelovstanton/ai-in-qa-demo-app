import React, { useState, useEffect } from 'react';
import { Box, BoxProps, CircularProgress } from '@mui/material';

interface AuthenticatedImageProps extends Omit<BoxProps, 'component'> {
  src: string;
  alt: string;
  testId?: string;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ 
  src, 
  alt, 
  testId,
  sx,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        
        // Cleanup function will be called when component unmounts or src changes
        return () => URL.revokeObjectURL(objectUrl);
      } catch (err) {
        console.error('Failed to load authenticated image:', src, err);
        setError(true);
        // Fallback to default image
        setImageSrc('/images/service-request-default-image.png');
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [src]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx
        }}
        {...props}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={imageSrc}
      alt={alt}
      sx={sx}
      onError={(e) => {
        console.error('Image failed to display:', imageSrc);
        if (!error) {
          setError(true);
          e.currentTarget.src = '/images/service-request-default-image.png';
        }
      }}
      data-testid={testId}
      {...props}
    />
  );
};

export default AuthenticatedImage;