import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ServiceRequestFormData } from '../../schemas/formSchemas';
import LocationDisplayMap from '../LocationDisplayMap';

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
  const { t } = useTranslation();
  
  return (
    <Box data-testid="cs-new-request-step-5">
      <Typography variant="h6" gutterBottom>
        {t('requests:form.reviewTitle', 'Review Your Request')}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.step1', 'Basic Information')}</Typography>
              <Typography variant="body2"><strong>{t('requests:form.titleLabel', 'Title')}:</strong> {watchedValues.title}</Typography>
              <Typography variant="body2"><strong>{t('requests:category', 'Category')}:</strong> {categoryLabels[watchedValues.category] || watchedValues.category}</Typography>
              <Typography variant="body2"><strong>{t('requests:priority', 'Priority')}:</strong> {watchedValues.priority}</Typography>
              <Typography variant="body2"><strong>{t('requests:form.isEmergency', 'Emergency')}:</strong> {watchedValues.isEmergency ? t('common:yes', 'Yes') : t('common:no', 'No')}</Typography>
              <Typography variant="body2"><strong>{t('requests:form.dateOfRequest', 'Date of Request')}:</strong> {watchedValues.dateOfRequest ? new Date(watchedValues.dateOfRequest).toLocaleDateString() : t('requests:review.notSelected', 'Not selected')}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.step2', 'Location')}</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>{t('common:address', 'Address')}:</strong> {watchedValues.streetAddress || t('requests:review.notProvided', 'Not provided')}</Typography>
                  <Typography variant="body2"><strong>{t('common:city', 'City')}:</strong> {watchedValues.city || t('requests:review.notProvided', 'Not provided')}</Typography>
                  <Typography variant="body2"><strong>{t('common:postalCode', 'Postal Code')}:</strong> {watchedValues.postalCode || t('requests:review.notProvided', 'Not provided')}</Typography>
                  <Typography variant="body2"><strong>{t('requests:form.locationLabel', 'Location Details')}:</strong> {watchedValues.locationText || t('requests:review.notProvided', 'Not provided')}</Typography>
                  {watchedValues.landmark && <Typography variant="body2"><strong>{t('requests:form.landmarkLabel', 'Landmark')}:</strong> {watchedValues.landmark}</Typography>}
                  {watchedValues.accessInstructions && <Typography variant="body2"><strong>{t('requests:form.accessInstructionsLabel', 'Access Instructions')}:</strong> {watchedValues.accessInstructions}</Typography>}
                  {watchedValues.latitude && watchedValues.longitude && (
                    <Typography variant="body2"><strong>{t('requests:form.coordinatesLabel', 'Coordinates')}:</strong> {watchedValues.latitude.toFixed(6)}, {watchedValues.longitude.toFixed(6)}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {watchedValues.latitude && watchedValues.longitude && (
                    <Box sx={{ height: '250px', width: '100%' }}>
                      <LocationDisplayMap
                        latitude={watchedValues.latitude}
                        longitude={watchedValues.longitude}
                        address={[watchedValues.streetAddress, watchedValues.city, watchedValues.postalCode].filter(Boolean).join(', ')}
                        title={t('requests:review.serviceRequestLocation', 'Service Request Location')}
                        description={watchedValues.locationText}
                        height="250px"
                        width="100%"
                        zoom={16}
                        showPopup={true}
                      />
                    </Box>
                  )}
                  {(!watchedValues.latitude || !watchedValues.longitude) && (
                    <Box sx={{ 
                      height: '250px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      border: '1px dashed',
                      borderColor: 'grey.300'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        📍 {t('requests:review.noMapCoordinates', 'No map coordinates provided')}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.descriptionLabel', 'Description')}</Typography>
              <Typography variant="body1">{watchedValues.description}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.step3', 'Contact Information')}</Typography>
              <Typography variant="body2"><strong>{t('requests:form.contactMethodLabel', 'Preferred Contact Method')}:</strong> {watchedValues.contactMethod || 'EMAIL'}</Typography>
              {watchedValues.email && <Typography variant="body2"><strong>{t('common:email', 'Email')}:</strong> {watchedValues.email}</Typography>}
              {watchedValues.phone && <Typography variant="body2"><strong>{t('common:phone', 'Phone')}:</strong> {watchedValues.phone}</Typography>}
              {watchedValues.alternatePhone && <Typography variant="body2"><strong>{t('requests:form.alternatePhoneLabel', 'Alternate Phone')}:</strong> {watchedValues.alternatePhone}</Typography>}
              {watchedValues.bestTimeToContact && <Typography variant="body2"><strong>{t('requests:form.bestTimeLabel', 'Best Time to Contact')}:</strong> {watchedValues.bestTimeToContact}</Typography>}
              {/* Mailing Address (when MAIL is selected) */}
              {watchedValues.contactMethod === 'MAIL' && (
                <>
                  {watchedValues.mailingStreetAddress && <Typography variant="body2"><strong>{t('requests:form.mailingAddressLabel', 'Mailing Address')}:</strong> {watchedValues.mailingStreetAddress}</Typography>}
                  {watchedValues.mailingCity && <Typography variant="body2"><strong>{t('requests:form.mailingCityLabel', 'Mailing City')}:</strong> {watchedValues.mailingCity}</Typography>}
                  {watchedValues.mailingPostalCode && <Typography variant="body2"><strong>{t('requests:form.mailingPostalCodeLabel', 'Mailing Postal Code')}:</strong> {watchedValues.mailingPostalCode}</Typography>}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:review.issueDetails', 'Issue Details')}</Typography>
              {watchedValues.issueType && <Typography variant="body2"><strong>{t('requests:form.issueTypeLabel', 'Issue Type')}:</strong> {watchedValues.issueType}</Typography>}
              {watchedValues.severity && <Typography variant="body2"><strong>{t('requests:form.severityLabel', 'Severity')}:</strong> {watchedValues.severity}/10</Typography>}
              <Typography variant="body2"><strong>{t('requests:form.isRecurring', 'Recurring Issue')}:</strong> {watchedValues.isRecurring ? t('common:yes', 'Yes') : t('common:no', 'No')}</Typography>
              <Typography variant="body2"><strong>{t('requests:form.hasPermits', 'Has Permits')}:</strong> {watchedValues.hasPermits ? t('common:yes', 'Yes') : t('common:no', 'No')}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {watchedValues.affectedServices && watchedValues.affectedServices.length > 0 ? (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.affectedServicesLabel', 'Affected Services')}</Typography>
                {watchedValues.affectedServices.map((service, index) => (
                  <Typography key={index} variant="body2">� {service}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ) : null}

        {watchedValues.estimatedValue && watchedValues.estimatedValue > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.estimatedValueLabel', 'Estimated Value')}</Typography>
                <Typography variant="body2"><strong>{t('requests:review.estimatedImpactValue', 'Estimated Impact Value')}:</strong> ${watchedValues.estimatedValue}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {watchedValues.preferredDate && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:review.schedulingPreferences', 'Scheduling Preferences')}</Typography>
                <Typography variant="body2"><strong>{t('requests:form.preferredDate', 'Preferred Date')}:</strong> {new Date(watchedValues.preferredDate).toLocaleDateString()}</Typography>
                {watchedValues.preferredTime && <Typography variant="body2"><strong>{t('requests:form.preferredTime', 'Preferred Time')}:</strong> {watchedValues.preferredTime}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        )}

        {uploadedFile && imagePreview && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:form.attachmentsLabel', 'Attachments')}</Typography>
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
                    <Typography variant="body2">✓ {uploadedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
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
                <Typography variant="subtitle1" color="primary" gutterBottom>{t('requests:review.additionalComments', 'Additional Comments')}</Typography>
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
          {t('requests:review.tooManyAttempts', 'Too many submission attempts. Please wait before trying again.')}
        </Alert>
      )}
    </Box>
  );
};

export default ReviewStep;