import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { ServiceRequest } from '../../types';
import AuthenticatedImage from './AuthenticatedImage';

interface AttachmentsSectionProps {
  request: ServiceRequest;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({ request }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Attachments
      </Typography>
      <Box sx={{ mb: 3 }}>
        {request.attachments && request.attachments.length > 0 ? (
          <Grid container spacing={2}>
            {request.attachments.map((attachment, index) => (
              <Grid item xs={12} sm={6} md={4} key={attachment.id || index}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    {attachment.mime?.startsWith('image/') ? (
                      <AuthenticatedImage
                        src={`http://localhost:3001/api/v1/attachments/${attachment.id}/image`}
                        alt={attachment.filename || `Attachment ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 1,
                        }}
                        testId={`cs-attachment-image-${attachment.id}`}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          mb: 1,
                        }}
                        data-testid={`cs-attachment-file-${attachment.id}`}
                      >
                        <Typography variant="h4" color="text.secondary">
                          ??
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" noWrap title={attachment.filename}>
                      {attachment.filename || 'Attachment'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50' }}>
            <CardContent>
              <Box
                component="img"
                src="/images/service-request-default-image.png"
                alt="No attachments placeholder"
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 1,
                  mb: 2,
                  opacity: 0.7,
                }}
                onError={(e) => {
                  // Hide image if default image is also not available
                  e.currentTarget.style.display = 'none';
                }}
                data-testid="cs-default-attachment-image"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No attachments uploaded for this request
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};

export default AttachmentsSection;