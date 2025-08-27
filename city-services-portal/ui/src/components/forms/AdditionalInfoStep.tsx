import React from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { ServiceRequestFormData } from '../../schemas/formSchemas';

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

interface AdditionalInfoStepProps {
  control: Control<ServiceRequestFormData>;
  errors: FieldErrors<ServiceRequestFormData>;
  uploadedFile: File | null;
  imagePreview: string | null;
  handleFileUpload: (file: File) => void;
  handleFileRemove: () => void;
  ValidationFeedback: React.FC<ValidationFeedbackProps>;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  control,
  errors,
  uploadedFile,
  imagePreview,
  handleFileUpload,
  handleFileRemove,
  ValidationFeedback,
}) => {
  return (
    <Box data-testid="cs-new-request-step-4">
      <Typography variant="h6" gutterBottom>
        Additional Information
      </Typography>

      {/* Image Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Attach Photo (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a photo to help illustrate the issue. Supported formats: JPG, PNG, GIF (max 1MB)
        </Typography>
        <Box
          sx={{
            border: '2px dashed #ddd',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: '#fafafa',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          {!uploadedFile ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="image-upload"
                data-testid="cs-new-request-image-upload"
              />
              <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" color="primary">
                    ??
                  </Typography>
                  <Typography variant="body1">
                    Click to upload an image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    or drag and drop here
                  </Typography>
                </Box>
              </label>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}
                />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="success.dark">
                  ? {uploadedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB ({uploadedFile.size.toLocaleString()} bytes)
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleFileRemove}
                data-testid="cs-remove-image"
              >
                Remove
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Controller
        name="agreesToTerms"
        control={control}
        render={({ field }) => (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  color="primary"
                  required
                  data-testid="cs-new-request-agree-terms"
                  aria-label="Agree to terms and conditions"
                />
              }
              label="I agree to the terms and conditions and confirm that the information provided is accurate"
            />
            <ValidationFeedback
              field={field}
              error={errors.agreesToTerms}
              fieldName="agreesToTerms"
              formName="new-request"
            />
          </Box>
        )}
      />
    </Box>
  );
};

export default AdditionalInfoStep;