import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormHelperText,
} from '@mui/material';
import { Controller, Control, FieldErrors, useWatch, UseFormTrigger } from 'react-hook-form';
import { ServiceRequestFormData, FormValidationTestIds } from '../../schemas/formSchemas';
import LocationMapComponent from '../LocationMapComponent';

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
  handleInputChange: (fieldName: string, value: string | number) => void;
  ValidationFeedback: React.FC<ValidationFeedbackProps>;
  trigger?: UseFormTrigger<ServiceRequestFormData>;
}

const LocationStep: React.FC<LocationStepProps> = ({
  control,
  errors,
  isAsyncValidating,
  handleInputChange,
  ValidationFeedback,
  trigger,
}) => {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  
  const buildAddressString = (streetAddress: string, city: string, postalCode: string): string => {
    return [streetAddress, city, postalCode].filter(Boolean).join(', ');
  };

  // Watch form values to update address string
  const watchStreetAddress = useWatch({ control, name: 'streetAddress' }) || '';
  const watchCity = useWatch({ control, name: 'city' }) || '';
  const watchPostalCode = useWatch({ control, name: 'postalCode' }) || '';
  const watchLatitude = useWatch({ control, name: 'latitude' });
  const watchLongitude = useWatch({ control, name: 'longitude' });

  useEffect(() => {
    const address = buildAddressString(watchStreetAddress, watchCity, watchPostalCode);
    if (address.trim()) {
      setCurrentAddress(address);
    }
  }, [watchStreetAddress, watchCity, watchPostalCode]);
  
  // Initialize location from stored coordinates when component mounts or values change
  useEffect(() => {
    if (watchLatitude && watchLongitude && !initialLocationSet && 
        watchLatitude !== 0 && watchLongitude !== 0) {
      console.log('Restoring location from stored coordinates:', watchLatitude, watchLongitude);
      const address = buildAddressString(watchStreetAddress, watchCity, watchPostalCode);
      setCurrentAddress(address || `Location: ${watchLatitude}, ${watchLongitude}`);
      setInitialLocationSet(true);
    }
  }, [watchLatitude, watchLongitude, watchStreetAddress, watchCity, watchPostalCode, initialLocationSet]);

  return (
    <Box data-testid="cs-new-request-step-2">
      <Typography variant="h6" gutterBottom>
        Location Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Controller
            name="streetAddress"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="Street Address"
                  margin="normal"
                  required
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
                      label="City"
                      margin="normal"
                      required
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
                      label="Postal Code"
                      margin="normal"
                      required
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

          {/* Latitude and Longitude Fields */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Controller
                name="latitude"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Latitude"
                      margin="normal"
                      type="number"
                      value={field.value || ''}
                      inputProps={{
                        step: 0.000001,
                        min: -90,
                        max: 90,
                        'aria-describedby': 'latitude-helper-text',
                      }}
                      data-testid="cs-new-request-latitude"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        handleInputChange('latitude', value);
                      }}
                      helperText="GPS latitude coordinate (updated from map)"
                      InputLabelProps={{
                        shrink: !!field.value || field.value === 0
                      }}
                    />
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="longitude"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Longitude"
                      margin="normal"
                      type="number"
                      value={field.value || ''}
                      inputProps={{
                        step: 0.000001,
                        min: -180,
                        max: 180,
                        'aria-describedby': 'longitude-helper-text',
                      }}
                      data-testid="cs-new-request-longitude"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        handleInputChange('longitude', value);
                      }}
                      helperText="GPS longitude coordinate (updated from map)"
                      InputLabelProps={{
                        shrink: !!field.value || field.value === 0
                      }}
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
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Box sx={{ mt: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <LocationMapComponent
              initialLocation={watchLatitude && watchLongitude && watchLatitude !== 0 && watchLongitude !== 0 ? {
                latitude: watchLatitude,
                longitude: watchLongitude,
                address: currentAddress
              } : undefined}
              onLocationChange={(location) => {
                console.log('Location changed in LocationStep:', location);
                console.log('Location components:', location.components);
                
                // Always update coordinates (pass as numbers)
                console.log('Updating coordinates:', location.latitude, location.longitude);
                handleInputChange('latitude', location.latitude);
                handleInputChange('longitude', location.longitude);
                
                // Update address display
                if (location.address) {
                  setCurrentAddress(location.address);
                }
                
                // Only prefill form fields if components are available (manual "Get Address from Map")
                if (location.components && Object.keys(location.components).length > 0) {
                  console.log('Processing components from manual address lookup:', location.components);
                  
                  // Street address prefilling
                  if (location.components.streetAddress && location.components.streetAddress.trim() !== '') {
                    console.log('Setting streetAddress:', location.components.streetAddress);
                    handleInputChange('streetAddress', location.components.streetAddress);
                  }
                  
                  // City prefilling - check multiple possible fields
                  const cityValue = location.components.city || 
                                  location.components.town || 
                                  location.components.village || 
                                  location.components.municipality;
                  
                  if (cityValue && cityValue.trim() !== '') {
                    console.log('Setting city:', cityValue);
                    handleInputChange('city', cityValue);
                  }
                  
                  // Postal code prefilling
                  if (location.components.postalCode && location.components.postalCode.trim() !== '') {
                    console.log('Setting postalCode:', location.components.postalCode);
                    handleInputChange('postalCode', location.components.postalCode);
                  }
                  
                  // Trigger validation to clear any errors
                  setTimeout(() => {
                    if (trigger) {
                      trigger(['streetAddress', 'city', 'postalCode', 'latitude', 'longitude']);
                    }
                  }, 100);
                } else {
                  console.log('No components provided - coordinates only update (manual mode)');
                  
                  // Still trigger validation for lat/lng fields
                  setTimeout(() => {
                    if (trigger) {
                      trigger(['latitude', 'longitude']);
                    }
                  }, 100);
                }
              }}
              address={currentAddress}
              height="400px"
              width="100%"
              showLocateButton={true}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LocationStep;