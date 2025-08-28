import React from 'react';
import { Box, BoxProps } from '@mui/material';

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
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={sx}
      onError={(e) => {
        console.error('Failed to load attachment image:', src);
        e.currentTarget.src = '/images/service-request-default-image.png';
      }}
      loading="lazy"
      data-testid={testId}
      {...props}
    />
  );
};

export default AuthenticatedImage;