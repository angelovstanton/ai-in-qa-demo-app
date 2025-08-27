import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Chip,
  FormLabel,
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

interface ContactServicesStepProps {
  control: Control<ServiceRequestFormData>;
  errors: FieldErrors<ServiceRequestFormData>;
  watchedValues: ServiceRequestFormData;
  isAsyncValidating: Record<string, boolean>;
  handleInputChange: (fieldName: string, value: string) => void;
  ValidationFeedback: React.FC<ValidationFeedbackProps>;
}

const ContactServicesStep: React.FC<ContactServicesStepProps> = ({
  control,
  errors,
  watchedValues,
  isAsyncValidating,
  handleInputChange,
  ValidationFeedback,
}) => {
  return (
    <Box data-testid="cs-new-request-step-3">
      <Typography variant="h6" gutterBottom>
        Contact & Service Information
      </Typography>
      
      <Controller
        name="contactMethod"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Preferred Contact Method</InputLabel>
            <Select
              {...field}
              value={field.value || 'EMAIL'} // Ensure there's always a value
              label="Preferred Contact Method"
              data-testid="cs-new-request-contact-method"
              aria-describedby={errors.contactMethod ? FormValidationTestIds.FIELD_ERROR('new-request', 'contactMethod') : undefined}
              onChange={(e) => {
                console.log('Contact method changed to:', e.target.value);
                field.onChange(e.target.value);
              }}
            >
              <MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="PHONE">Phone</MenuItem>
              <MenuItem value="SMS">SMS</MenuItem>
              <MenuItem value="MAIL">Mail</MenuItem>
            </Select>
            <ValidationFeedback
              field={field}
              error={errors.contactMethod}
              fieldName="contactMethod"
              formName="new-request"
            />
          </FormControl>
        )}
      />

      {/* Email field - always visible but required when EMAIL is selected */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              error={!!errors.email}
              required={watchedValues.contactMethod === 'EMAIL'}
              inputProps={{
                maxLength: 254,
                'aria-describedby': errors.email ? FormValidationTestIds.FIELD_ERROR('new-request', 'email') : undefined,
              }}
              data-testid="cs-new-request-email"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('email', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.email}
              fieldName="email"
              formName="new-request"
              isValidating={isAsyncValidating.email}
            />
          </Box>
        )}
      />

      {/* Phone field - required */}
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Phone Number"
              type="tel"
              margin="normal"
              error={!!errors.phone}
              required
              inputProps={{
                maxLength: 15,
                pattern: "[0-9+\\-\\s\\(\\)]*",
                'aria-describedby': errors.phone ? FormValidationTestIds.FIELD_ERROR('new-request', 'phone') : undefined,
              }}
              data-testid="cs-new-request-phone"
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9+\-\s\(\)]/g, '');
                field.onChange(value);
                handleInputChange('phone', value);
              }}
              helperText="Enter your phone number (e.g., +1-234-567-8900 or 234-567-8900)"
            />
            <ValidationFeedback
              field={field}
              error={errors.phone}
              fieldName="phone"
              formName="new-request"
              isValidating={isAsyncValidating.phone}
            />
          </Box>
        )}
      />

      {/* Address fields - always visible */}
      <Box>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Mailing Address (Optional)
        </Typography>
        
        <Controller
          name="mailingStreetAddress"
          control={control}
          render={({ field }) => (
            <Box>
              <TextField
                {...field}
                fullWidth
                label="Street Address"
                margin="normal"
                error={!!errors.mailingStreetAddress}
                inputProps={{
                  maxLength: 100,
                  'aria-describedby': errors.mailingStreetAddress ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingStreetAddress') : undefined,
                }}
                data-testid="cs-new-request-mail-address"
                onChange={(e) => {
                  field.onChange(e);
                  handleInputChange('mailingStreetAddress', e.target.value);
                }}
              />
              <ValidationFeedback
                field={field}
                error={errors.mailingStreetAddress}
                fieldName="mailingStreetAddress"
                formName="new-request"
                isValidating={isAsyncValidating.mailingStreetAddress}
              />
            </Box>
          )}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="mailingCity"
              control={control}
              render={({ field }) => (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    margin="normal"
                    error={!!errors.mailingCity}
                    inputProps={{
                      maxLength: 50,
                      'aria-describedby': errors.mailingCity ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingCity') : undefined,
                    }}
                    data-testid="cs-new-request-mail-city"
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange('mailingCity', e.target.value);
                    }}
                  />
                  <ValidationFeedback
                    field={field}
                    error={errors.mailingCity}
                    fieldName="mailingCity"
                    formName="new-request"
                    isValidating={isAsyncValidating.mailingCity}
                    maxLength={50}
                    showCharCount
                    securityCheck
                  />
                </Box>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="mailingPostalCode"
              control={control}
              render={({ field }) => (
                <Box>
                  <TextField
                    {...field}
                    fullWidth
                    label="Postal Code"
                    margin="normal"
                    error={!!errors.mailingPostalCode}
                    inputProps={{
                      maxLength: 10,
                      'aria-describedby': errors.mailingPostalCode ? FormValidationTestIds.FIELD_ERROR('new-request', 'mailingPostalCode') : undefined,
                    }}
                    data-testid="cs-new-request-mail-postal"
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange('mailingPostalCode', e.target.value);
                    }}
                  />
                  <ValidationFeedback
                    field={field}
                    error={errors.mailingPostalCode}
                    fieldName="mailingPostalCode"
                    formName="new-request"
                    isValidating={isAsyncValidating.mailingPostalCode}
                    maxLength={10}
                    showCharCount
                    securityCheck
                  />
                </Box>
              )}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Emergency alternate phone field */}
      {watchedValues.isEmergency && (
        <Controller
          name="alternatePhone"
          control={control}
          render={({ field }) => (
            <Box>
              <TextField
                {...field}
                fullWidth
                label="Alternate Phone (Required for Emergency)"
                margin="normal"
                error={!!errors.alternatePhone}
                required
                inputProps={{
                  maxLength: 15,
                  'aria-describedby': errors.alternatePhone ? FormValidationTestIds.FIELD_ERROR('new-request', 'alternatePhone') : undefined,
                }}
                data-testid="cs-new-request-alternate-phone"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+\-\s\(\)]/g, '');
                  field.onChange(value);
                  handleInputChange('alternatePhone', value);
                }}
                helperText="Enter an alternate phone number for emergency contact"
              />
              <ValidationFeedback
                field={field}
                error={errors.alternatePhone}
                fieldName="alternatePhone"
                formName="new-request"
                isValidating={isAsyncValidating.alternatePhone}
              />
            </Box>
          )}
        />
      )}

      <Controller
        name="affectedServices"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.affectedServices}>
            <FormLabel component="legend">Affected Services (Optional)</FormLabel>
            <Box>
              <Autocomplete
                multiple
                options={['Water Supply', 'Electrical', 'Gas', 'Internet/Cable', 'Garbage Collection']}
                value={Array.isArray(field.value) ? field.value : []}
                onChange={(_, value) => field.onChange(Array.isArray(value) ? value : [])}
                renderTags={(value, getTagProps) =>
                  (Array.isArray(value) ? value : []).map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Select affected services"
                    error={!!errors.affectedServices}
                    inputProps={{
                      ...params.inputProps,
                      'aria-describedby': errors.affectedServices ? FormValidationTestIds.FIELD_ERROR('new-request', 'affectedServices') : undefined,
                    }}
                    data-testid="cs-new-request-affected-services"
                  />
                )}
              />
              <ValidationFeedback
                field={field}
                error={errors.affectedServices}
                fieldName="affectedServices"
                formName="new-request"
              />
            </Box>
          </FormControl>
        )}
      />
    </Box>
  );
};

export default ContactServicesStep;