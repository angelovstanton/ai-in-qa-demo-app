import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormHelperText,
} from '@mui/material';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { ServiceRequestFormData, FormValidationTestIds } from '../../schemas/formSchemas';

interface ValidationFeedbackProps {
  field: any;
  error?: any;
  fieldName: string;
  formName: string;
  isValidating?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  securityCheck?: boolean;
}

interface LocationStepProps {
  control: Control<ServiceRequestFormData>;
  errors: FieldErrors<ServiceRequestFormData>;
  isAsyncValidating: Record<string, boolean>;
  handleInputChange: (fieldName: string, value: string) => void;
  ValidationFeedback: React.FC<ValidationFeedbackProps>;
}

const LocationStep: React.FC<LocationStepProps> = ({
  control,
  errors,
  isAsyncValidating,
  handleInputChange,
  ValidationFeedback,
}) => {
  return (
    <Box data-testid="cs-new-request-step-2">
      <Typography variant="h6" gutterBottom>
        Location Information
      </Typography>
      
      <Controller
        name="streetAddress"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Street Address (Optional)"
              margin="normal"
              error={!!errors.streetAddress}
              inputProps={{
                maxLength: 100,
                'aria-describedby': errors.streetAddress ? FormValidationTestIds.FIELD_ERROR('new-request', 'streetAddress') : undefined,
              }}
              data-testid="cs-new-request-street-address"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('streetAddress', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.streetAddress}
              fieldName="streetAddress"
              formName="new-request"
              isValidating={isAsyncValidating.streetAddress}
              maxLength={100}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="City (Optional)"
                  margin="normal"
                  error={!!errors.city}
                  inputProps={{
                    maxLength: 50,
                    'aria-describedby': errors.city ? FormValidationTestIds.FIELD_ERROR('new-request', 'city') : undefined,
                  }}
                  data-testid="cs-new-request-city"
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange('city', e.target.value);
                  }}
                />
                <ValidationFeedback
                  field={field}
                  error={errors.city}
                  fieldName="city"
                  formName="new-request"
                  isValidating={isAsyncValidating.city}
                  maxLength={50}
                  showCharCount
                  securityCheck
                />
              </Box>
            )}
          />
        </Grid>
        <Grid item xs={4}>
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Postal Code (Optional)"
                  margin="normal"
                  error={!!errors.postalCode}
                  inputProps={{
                    maxLength: 10,
                    'aria-describedby': errors.postalCode ? FormValidationTestIds.FIELD_ERROR('new-request', 'postalCode') : undefined,
                  }}
                  data-testid="cs-new-request-postal-code"
                  onChange={(e) => {
                    field.onChange(e);
                    handleInputChange('postalCode', e.target.value);
                  }}
                />
                <ValidationFeedback
                  field={field}
                  error={errors.postalCode}
                  fieldName="postalCode"
                  formName="new-request"
                  isValidating={isAsyncValidating.postalCode}
                  maxLength={10}
                  showCharCount
                  securityCheck
                />
              </Box>
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="locationText"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Additional Location Details"
              margin="normal"
              error={!!errors.locationText}
              required
              inputProps={{
                maxLength: 500,
                'aria-describedby': errors.locationText ? FormValidationTestIds.FIELD_ERROR('new-request', 'locationText') : 'location-helper-text',
              }}
              data-testid="cs-new-request-location-text"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('locationText', e.target.value);
              }}
            />
            <FormHelperText id="location-helper-text">
              Describe the exact location of the issue (minimum 10 characters)
            </FormHelperText>
            <ValidationFeedback
              field={field}
              error={errors.locationText}
              fieldName="locationText"
              formName="new-request"
              isValidating={isAsyncValidating.locationText}
              maxLength={500}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />
    </Box>
  );
};

export default LocationStep;