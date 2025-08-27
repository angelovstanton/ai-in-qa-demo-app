import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Switch,
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

interface BasicInfoStepProps {
  control: Control<ServiceRequestFormData>;
  errors: FieldErrors<ServiceRequestFormData>;
  watchedValues: ServiceRequestFormData;
  isAsyncValidating: Record<string, boolean>;
  handleInputChange: (fieldName: string, value: string) => void;
  handleEmergencyChange: (checked: boolean) => void;
  ValidationFeedback: React.FC<ValidationFeedbackProps>;
  categories: string[];
  categoryLabels: Record<string, string>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  control,
  errors,
  watchedValues,
  isAsyncValidating,
  handleInputChange,
  handleEmergencyChange,
  ValidationFeedback,
  categories,
  categoryLabels,
}) => {
  return (
    <Box data-testid="cs-new-request-step-1">
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Request Title"
              margin="normal"
              error={!!errors.title}
              required
              inputProps={{
                maxLength: 120,
                'aria-describedby': errors.title ? FormValidationTestIds.FIELD_ERROR('new-request', 'title') : undefined,
              }}
              data-testid="cs-new-request-title"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('title', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.title}
              fieldName="title"
              formName="new-request"
              isValidating={isAsyncValidating.title}
              maxLength={120}
              showCharCount
              securityCheck
            />
          </Box>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              label="Detailed Description"
              multiline
              rows={4}
              margin="normal"
              error={!!errors.description}
              required
              inputProps={{
                maxLength: 2000,
                'aria-describedby': errors.description ? FormValidationTestIds.FIELD_ERROR('new-request', 'description') : undefined,
              }}
              data-testid="cs-new-request-description"
              onChange={(e) => {
                field.onChange(e);
                handleInputChange('description', e.target.value);
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.description}
              fieldName="description"
              formName="new-request"
              isValidating={isAsyncValidating.description}
              maxLength={2000}
              showCharCount
              securityCheck
            />
            <FormHelperText>
              Please provide at least 10 words describing the issue in detail
            </FormHelperText>
          </Box>
        )}
      />

      <Controller
        name="dateOfRequest"
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              fullWidth
              type="date"
              label="Date of Request"
              margin="normal"
              error={!!errors.dateOfRequest}
              required
              value={(() => {
                if (!field.value) return '';
                try {
                  const date = new Date(field.value);
                  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                } catch {
                  return '';
                }
              })()}
              onChange={(e) => {
                try {
                  const dateValue = e.target.value ? new Date(e.target.value) : null;
                  // Validate the date before setting it
                  if (dateValue && !isNaN(dateValue.getTime())) {
                    field.onChange(dateValue);
                  } else if (!e.target.value) {
                    field.onChange(null);
                  }
                } catch {
                  // If date parsing fails, set to null
                  field.onChange(null);
                }
              }}
              inputProps={{
                max: new Date().toISOString().split('T')[0],
                min: (() => {
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return oneMonthAgo.toISOString().split('T')[0];
                })(),
                'aria-describedby': errors.dateOfRequest ? FormValidationTestIds.FIELD_ERROR('new-request', 'dateOfRequest') : undefined,
              }}
              data-testid="cs-new-request-date"
              helperText={errors.dateOfRequest?.message || "Select the date when the issue occurred (cannot be more than 1 month ago)"}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <ValidationFeedback
              field={field}
              error={errors.dateOfRequest}
              fieldName="dateOfRequest"
              formName="new-request"
            />
          </Box>
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.category} required>
                <InputLabel>Category</InputLabel>
                <Select
                  {...field}
                  label="Category"
                  data-testid="cs-new-request-category"
                  aria-describedby={errors.category ? FormValidationTestIds.FIELD_ERROR('new-request', 'category') : undefined}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {categoryLabels[category]}
                    </MenuItem>
                  ))}
                </Select>
                <ValidationFeedback
                  field={field}
                  error={errors.category}
                  fieldName="category"
                  formName="new-request"
                />
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl margin="normal" error={!!errors.priority} required>
                <FormLabel component="legend">Priority</FormLabel>
                <RadioGroup
                  {...field}
                  row
                  data-testid="cs-new-request-priority"
                  aria-describedby={errors.priority ? FormValidationTestIds.FIELD_ERROR('new-request', 'priority') : undefined}
                >
                  <FormControlLabel value="LOW" control={<Radio />} label="Low" />
                  <FormControlLabel value="MEDIUM" control={<Radio />} label="Medium" />
                  <FormControlLabel value="HIGH" control={<Radio />} label="High" />
                  <FormControlLabel value="URGENT" control={<Radio />} label="Urgent" />
                </RadioGroup>
                <ValidationFeedback
                  field={field}
                  error={errors.priority}
                  fieldName="priority"
                  formName="new-request"
                />
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="isEmergency"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(e) => handleEmergencyChange(e.target.checked)}
                color="error"
                data-testid="cs-new-request-emergency"
                aria-label="Is this an emergency"
              />
            }
            label="Is this an emergency?"
          />
        )}
      />

      {watchedValues.isEmergency && (
        <Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Emergency requests require alternate contact information and will be prioritized accordingly.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default BasicInfoStep;