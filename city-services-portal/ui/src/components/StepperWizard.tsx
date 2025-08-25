import React, { useState } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Paper,
  Typography,
  Alert,
} from '@mui/material';

export interface StepperStep {
  label: string;
  component: React.ReactNode;
  optional?: boolean;
}

interface StepperWizardProps {
  steps: StepperStep[];
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  testId?: string;
}

const StepperWizard: React.FC<StepperWizardProps> = ({
  steps,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Submit',
  testId = 'cs-stepper-wizard',
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleNext = () => {
    // Clear any existing errors for this step
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[activeStep];
      return newErrors;
    });

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await onSubmit();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [activeStep]: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box data-testid={testId}>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label} data-testid={`${testId}-step-${index}`}>
              <StepLabel optional={step.optional && <Typography variant="caption">Optional</Typography>}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors[activeStep] && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid={`${testId}-error`}>
            {errors[activeStep]}
          </Alert>
        )}

        <Box sx={{ mb: 4, minHeight: 300 }}>
          {steps[activeStep]?.component}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Box>
            {onCancel && (
              <Button
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid={`${testId}-cancel`}
              >
                Cancel
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || isSubmitting}
              onClick={handleBack}
              data-testid={`${testId}-back`}
            >
              Back
            </Button>

            {isLastStep ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-testid={`${testId}-submit`}
              >
                {isSubmitting ? 'Submitting...' : submitLabel}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isSubmitting}
                data-testid={`${testId}-next`}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StepperWizard;