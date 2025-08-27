import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import { ServiceRequestFormData } from '../../schemas/formSchemas';

interface ReviewStepProps {
  watchedValues: ServiceRequestFormData;
  categoryLabels: Record<string, string>;
  uploadedFile: File | null;
  imagePreview: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  isBlocked: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  watchedValues,
  categoryLabels,
  uploadedFile,
  imagePreview,
  submitError,
  submitSuccess,
  isBlocked,
}) => {
  return (
    <Box data-testid="cs-new-request-step-5">
      <Typography variant="h6" gutterBottom>
        Review Your Request
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Basic Information</Typography>
              <Typography variant="body2"><strong>Title:</strong> {watchedValues.title}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {categoryLabels[watchedValues.category] || watchedValues.category}</Typography>
              <Typography variant="body2"><strong>Priority:</strong> {watchedValues.priority}</Typography>
              <Typography variant="body2"><strong>Emergency:</strong> {watchedValues.isEmergency ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Date of Request:</strong> {watchedValues.dateOfRequest ? new Date(watchedValues.dateOfRequest).toLocaleDateString() : 'Not selected'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Location</Typography>
              <Typography variant="body2"><strong>Address:</strong> {watchedValues.streetAddress || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>City:</strong> {watchedValues.city || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>Postal Code:</strong> {watchedValues.postalCode || 'Not provided'}</Typography>
              <Typography variant="body2"><strong>Location Details:</strong> {watchedValues.locationText || 'Not provided'}</Typography>
              {watchedValues.landmark && <Typography variant="body2"><strong>Landmark:</strong> {watchedValues.landmark}</Typography>}
              {watchedValues.accessInstructions && <Typography variant="body2"><strong>Access Instructions:</strong> {watchedValues.accessInstructions}</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Description</Typography>
              <Typography variant="body1">{watchedValues.description}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Contact Information</Typography>
              <Typography variant="body2"><strong>Preferred Contact Method:</strong> {watchedValues.contactMethod || 'EMAIL'}</Typography>
              {watchedValues.email && <Typography variant="body2"><strong>Email:</strong> {watchedValues.email}</Typography>}
              {watchedValues.phone && <Typography variant="body2"><strong>Phone:</strong> {watchedValues.phone}</Typography>}
              {watchedValues.alternatePhone && <Typography variant="body2"><strong>Alternate Phone:</strong> {watchedValues.alternatePhone}</Typography>}
              {watchedValues.bestTimeToContact && <Typography variant="body2"><strong>Best Time to Contact:</strong> {watchedValues.bestTimeToContact}</Typography>}
              {/* Mailing Address (when MAIL is selected) */}
              {watchedValues.contactMethod === 'MAIL' && (
                <>
                  {watchedValues.mailingStreetAddress && <Typography variant="body2"><strong>Mailing Address:</strong> {watchedValues.mailingStreetAddress}</Typography>}
                  {watchedValues.mailingCity && <Typography variant="body2"><strong>Mailing City:</strong> {watchedValues.mailingCity}</Typography>}
                  {watchedValues.mailingPostalCode && <Typography variant="body2"><strong>Mailing Postal Code:</strong> {watchedValues.mailingPostalCode}</Typography>}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Issue Details</Typography>
              {watchedValues.issueType && <Typography variant="body2"><strong>Issue Type:</strong> {watchedValues.issueType}</Typography>}
              {watchedValues.severity && <Typography variant="body2"><strong>Severity:</strong> {watchedValues.severity}/10</Typography>}
              <Typography variant="body2"><strong>Recurring Issue:</strong> {watchedValues.isRecurring ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Has Permits:</strong> {watchedValues.hasPermits ? 'Yes' : 'No'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {watchedValues.affectedServices && watchedValues.affectedServices.length > 0 ? (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Affected Services</Typography>
                {watchedValues.affectedServices.map((service, index) => (
                  <Typography key={index} variant="body2">• {service}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ) : null}

        {watchedValues.estimatedValue && watchedValues.estimatedValue > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Estimated Value</Typography>
                <Typography variant="body2"><strong>Estimated Impact Value:</strong> ${watchedValues.estimatedValue}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {watchedValues.preferredDate && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Scheduling Preferences</Typography>
                <Typography variant="body2"><strong>Preferred Date:</strong> {new Date(watchedValues.preferredDate).toLocaleDateString()}</Typography>
                {watchedValues.preferredTime && <Typography variant="body2"><strong>Preferred Time:</strong> {watchedValues.preferredTime}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        )}

        {uploadedFile && imagePreview && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Attachments</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Attached image"
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}
                  />
                  <Box>
                    <Typography variant="body2">?? {uploadedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {watchedValues.comments && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>Additional Comments</Typography>
                <Typography variant="body1">{watchedValues.comments}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>

      {submitError && (
        <Alert severity="error" sx={{ mt: 2 }} data-testid="cs-submit-error">
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mt: 2 }} data-testid="cs-submit-success">
          {submitSuccess}
        </Alert>
      )}

      {isBlocked && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Too many submission attempts. Please wait before trying again.
        </Alert>
      )}
    </Box>
  );
};

export default ReviewStep;