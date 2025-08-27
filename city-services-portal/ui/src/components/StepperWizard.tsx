import React, { useState, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  LinearProgress,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

export interface StepperStep {
  label: string;
  component: React.ReactNode;
  isValid?: boolean;
  validationErrors?: string[];
  optional?: boolean;
}

export interface StepperWizardProps {
  steps: StepperStep[];
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  testId?: string;
  onStepValidation?: (stepIndex: number) => Promise<{ isValid: boolean; errors: string[] }>;
  onStepChange?: (fromStep: number, toStep: number) => void;
  validationSummary?: string[];
}

const StepperWizard: React.FC<StepperWizardProps> = ({
  steps,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Submit',
  testId = 'stepper-wizard',
  onStepValidation,
  onStepChange,
  validationSummary = [],
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [stepValidation, setStepValidation] = useState<Record<number, { isValid: boolean; errors: string[] }>>({});
  const [validatingStep, setValidatingStep] = useState<number | null>(null);
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set([0])); // Track which steps have been attempted

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  // Get validation state for a step
  const getStepValidationState = useCallback((stepIndex: number) => {
    const validation = stepValidation[stepIndex];
    const attempted = attemptedSteps.has(stepIndex);
    
    if (!attempted) return 'pending';
    if (!validation) return 'pending';
    if (validation.isValid) return 'valid';
    return 'invalid';
  }, [stepValidation, attemptedSteps]);

  // Get step icon based on validation state
  const getStepIcon = useCallback((stepIndex: number) => {
    const state = getStepValidationState(stepIndex);
    
    switch (state) {
      case 'valid':
        return <CheckCircle color="success" />;
      case 'invalid':
        return <Error color="error" />;
      case 'pending':
      default:
        return stepIndex + 1;
    }
  }, [getStepValidationState]);

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    if (!onStepValidation) return { isValid: true, errors: [] };
    
    setValidatingStep(activeStep);
    try {
      const result = await onStepValidation(activeStep);
      setStepValidation(prev => ({
        ...prev,
        [activeStep]: result
      }));
      return result;
    } finally {
      setValidatingStep(null);
    }
  }, [activeStep, onStepValidation]);

  // Handle next step
  const handleNext = useCallback(async () => {
    // Mark current step as attempted
    setAttemptedSteps(prev => new Set([...prev, activeStep]));
    
    // Validate current step before proceeding
    const validation = await validateCurrentStep();
    
    if (!validation.isValid) {
      // Don't proceed if validation fails
      return;
    }

    const nextStep = activeStep + 1;
    if (nextStep < steps.length) {
      onStepChange?.(activeStep, nextStep);
      setActiveStep(nextStep);
      setAttemptedSteps(prev => new Set([...prev, nextStep]));
    }
  }, [activeStep, steps.length, validateCurrentStep, onStepChange]);

  // Handle previous step
  const handleBack = useCallback(() => {
    const prevStep = activeStep - 1;
    if (prevStep >= 0) {
      onStepChange?.(activeStep, prevStep);
      setActiveStep(prevStep);
    }
  }, [activeStep, onStepChange]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Mark current step as attempted
    setAttemptedSteps(prev => new Set([...prev, activeStep]));
    
    // Validate current step before submitting
    const validation = await validateCurrentStep();
    
    if (!validation.isValid) {
      return;
    }

    // Validate all steps before final submission
    let allValid = true;
    const allValidationErrors: string[] = [];

    for (let i = 0; i < steps.length; i++) {
      if (onStepValidation) {
        const stepValidation = await onStepValidation(i);
        setStepValidation(prev => ({
          ...prev,
          [i]: stepValidation
        }));
        
        if (!stepValidation.isValid) {
          allValid = false;
          allValidationErrors.push(`Step ${i + 1}: ${stepValidation.errors.join(', ')}`);
        }
      }
    }

    if (!allValid) {
      // Show validation summary and don't submit
      return;
    }

    await onSubmit();
  }, [activeStep, steps.length, validateCurrentStep, onStepValidation, onSubmit]);

  // Get current step validation errors
  const currentStepErrors = stepValidation[activeStep]?.errors || [];
  const hasCurrentStepErrors = currentStepErrors.length > 0;
  const isCurrentStepValid = stepValidation[activeStep]?.isValid ?? true;

  // Get all validation errors across steps
  const allValidationErrors = Object.entries(stepValidation).reduce((acc, [stepIndex, validation]) => {
    if (!validation.isValid && attemptedSteps.has(parseInt(stepIndex))) {
      acc.push(...validation.errors.map(error => `Step ${parseInt(stepIndex) + 1}: ${error}`));
    }
    return acc;
  }, [] as string[]);

  // Combine step errors with global validation summary
  const allErrors = [...allValidationErrors, ...validationSummary];

  return (
    <Box data-testid={testId}>
      {/* Validation Summary - only show if current step has errors and has been attempted */}
      {currentStepErrors.length > 0 && attemptedSteps.has(activeStep) && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid={`${testId}-step-validation-summary`}>
          <AlertTitle>Please fix the following errors in this step:</AlertTitle>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {currentStepErrors.map((error, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {error}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Progress Indicator */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Step {activeStep + 1} of {steps.length}: {currentStep.label}
          </Typography>
          <Chip
            label={`${Math.round(((activeStep + 1) / steps.length) * 100)}% Complete`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={((activeStep + 1) / steps.length) * 100}
          sx={{ height: 6, borderRadius: 3 }}
          data-testid={`${testId}-progress`}
        />
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }} data-testid={`${testId}-stepper`}>
        {steps.map((step, index) => {
          const validationState = getStepValidationState(index);
          const isError = validationState === 'invalid';
          const isCompleted = validationState === 'valid';

          return (
            <Step 
              key={step.label} 
              completed={isCompleted}
              data-testid={`${testId}-step-${index}`}
            >
              <StepLabel
                error={isError}
                StepIconComponent={() => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: isError
                        ? 'error.main'
                        : isCompleted
                        ? 'success.main'
                        : 'grey.300',
                      color: isError || isCompleted ? 'white' : 'text.primary',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                    data-testid={`${testId}-step-${index}-icon`}
                  >
                    {getStepIcon(index)}
                  </Box>
                )}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color={isError ? 'error' : 'inherit'}
                    fontWeight={index === activeStep ? 'bold' : 'normal'}
                  >
                    {step.label}
                  </Typography>
                  {isError && stepValidation[index]?.errors && (
                    <Typography variant="caption" color="error" display="block">
                      {stepValidation[index].errors.length} error(s)
                    </Typography>
                  )}
                  {step.optional && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Optional
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Current Step Validation Errors */}
      {hasCurrentStepErrors && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid={`${testId}-step-errors`} elevation={1}>
          <AlertTitle>Please fix the following errors in this step:</AlertTitle>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {currentStepErrors.map((error, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {error}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Validation Progress */}
      {validatingStep !== null && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Validating step {validatingStep + 1}...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Step Content */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent data-testid={`${testId}-content`}>
          {currentStep.component}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outlined"
              color="inherit"
              data-testid={`${testId}-cancel`}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleBack}
            disabled={isFirstStep || isSubmitting}
            variant="outlined"
            data-testid={`${testId}-back`}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting || (validatingStep === activeStep)}
              data-testid={`${testId}-submit`}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isSubmitting || (validatingStep === activeStep)}
              data-testid={`${testId}-next`}
              endIcon={validatingStep === activeStep ? <CircularProgress size={16} /> : undefined}
            >
              {validatingStep === activeStep ? 'Validating...' : 'Next'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Step Summary */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Progress: {Object.values(stepValidation).filter(v => v.isValid).length} of {steps.length} steps completed
          {allErrors.length > 0 && (
            <Typography component="span" color="error" sx={{ ml: 2 }}>
              � {allErrors.length} error(s) remaining
            </Typography>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default StepperWizard;