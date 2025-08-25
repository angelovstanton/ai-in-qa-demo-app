import React, { useState } from 'react';
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
  Checkbox,
  Switch,
  Slider,
  Autocomplete,
  Chip,
  Rating,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StepperWizard, { StepperStep } from '../../components/StepperWizard';
import { useCreateServiceRequest } from '../../hooks/useServiceRequests';

// Enhanced validation schema with many field types
const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title must be less than 120 characters'),
  description: z.string().min(30, 'Description must be at least 30 characters').max(2000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  locationText: z.string().min(1, 'Location is required'),
  
  // Contact Information
  contactMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL']),
  alternatePhone: z.string().optional(),
  bestTimeToContact: z.string().optional(),
  
  // Issue Details
  issueType: z.string().min(1, 'Issue type is required'),
  severity: z.number().min(1).max(10),
  isRecurring: z.boolean(),
  
  // Location Details
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(5, 'Valid postal code required'),
  landmark: z.string().optional(),
  accessInstructions: z.string().optional(),
  
  // Service-specific fields
  affectedServices: z.array(z.string()).min(1, 'At least one service must be selected'),
  estimatedValue: z.number().optional(),
  isEmergency: z.boolean(),
  hasPermits: z.boolean(),
  
  // Additional Information
  additionalContacts: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    phone: z.string().min(10, 'Valid phone required'),
    relationship: z.string().min(1, 'Relationship required')
  })).optional(),
  
  // User Experience
  satisfactionRating: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  agreesToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
  wantsUpdates: z.boolean(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const categories = [
  'Roads and Transportation',
  'Street Lighting',
  'Waste Management',
  'Water and Sewer',
  'Parks and Recreation',
  'Public Safety',
  'Building and Permits',
  'Snow Removal',
  'Traffic Signals',
  'Sidewalk Maintenance',
  'Tree Services',
  'Noise Complaints',
  'Animal Control',
  'Other'
];

const issueTypes = [
  'Pothole',
  'Broken Street Light',
  'Garbage Collection Issue',
  'Water Leak',
  'Sewer Backup',
  'Damaged Playground',
  'Graffiti',
  'Broken Traffic Light',
  'Fallen Tree',
  'Illegal Dumping',
  'Noise Violation',
  'Stray Animal',
  'Building Code Violation',
  'Permit Issue',
  'Other'
];

const affectedServicesOptions = [
  'Water Supply',
  'Electrical',
  'Gas',
  'Internet/Cable',
  'Garbage Collection',
  'Recycling',
  'Public Transportation',
  'Emergency Services',
  'Postal Service'
];

const NewRequestPage: React.FC = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createRequest, loading: isSubmitting } = useCreateServiceRequest();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      locationText: '',
      contactMethod: 'EMAIL',
      alternatePhone: '',
      bestTimeToContact: '',
      issueType: '',
      severity: 5,
      isRecurring: false,
      streetAddress: '',
      city: '',
      postalCode: '',
      landmark: '',
      accessInstructions: '',
      affectedServices: [],
      estimatedValue: 0,
      isEmergency: false,
      hasPermits: false,
      additionalContacts: [],
      wantsUpdates: true,
      agreesToTerms: false,
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'additionalContacts',
  });

  const watchedValues = watch();

  const handleFormSubmit = async () => {
    setSubmitError(null);
    
    try {
      await handleSubmit(async (data) => {
        // Generate idempotency key
        const idempotencyKey = `new-request-${Date.now()}-${Math.random()}`;
        
        // Convert the enhanced data to the basic API format
        const apiData = {
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          locationText: `${data.streetAddress}, ${data.city}, ${data.postalCode}${data.landmark ? ` (Near: ${data.landmark})` : ''}`,
        };
        
        await createRequest(apiData, idempotencyKey);
        
        // Redirect to requests list on success
        window.location.href = '/citizen/requests';
      })();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit request');
      throw error;
    }
  };

  const handleCancel = () => {
    window.location.href = '/citizen/requests';
  };

  // Step 1: Basic Information
  const BasicInfoStep = (
    <Box data-testid="cs-new-request-step-basic">
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Request Title"
            margin="normal"
            error={!!errors.title}
            helperText={errors.title?.message}
            data-testid="cs-new-request-title"
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Detailed Description"
            multiline
            rows={4}
            margin="normal"
            error={!!errors.description}
            helperText={errors.description?.message || `${field.value?.length || 0}/2000 characters`}
            data-testid="cs-new-request-description"
          />
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  {...field}
                  label="Category"
                  data-testid="cs-new-request-category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error">
                    {errors.category.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="issueType"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={issueTypes}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Issue Type"
                    margin="normal"
                    error={!!errors.issueType}
                    helperText={errors.issueType?.message}
                    data-testid="cs-new-request-issue-type"
                  />
                )}
                onChange={(_, value) => field.onChange(value || '')}
              />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl margin="normal" error={!!errors.priority}>
                <FormLabel component="legend">Priority</FormLabel>
                <RadioGroup
                  {...field}
                  row
                  data-testid="cs-new-request-priority"
                >
                  <FormControlLabel value="LOW" control={<Radio />} label="Low" />
                  <FormControlLabel value="MEDIUM" control={<Radio />} label="Medium" />
                  <FormControlLabel value="HIGH" control={<Radio />} label="High" />
                  <FormControlLabel value="URGENT" control={<Radio />} label="Urgent" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl margin="normal" fullWidth>
            <FormLabel component="legend">Issue Severity (1-10)</FormLabel>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Box sx={{ px: 2, pt: 1 }}>
                  <Slider
                    {...field}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="on"
                    data-testid="cs-new-request-severity"
                  />
                </Box>
              )}
            />
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Controller
            name="isRecurring"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    data-testid="cs-new-request-recurring"
                  />
                }
                label="Is this a recurring issue?"
              />
            )}
          />
        </Grid>

        <Grid item xs={6}>
          <Controller
            name="isEmergency"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    color="error"
                    data-testid="cs-new-request-emergency"
                  />
                }
                label="Is this an emergency?"
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Step 2: Location Information
  const LocationStep = (
    <Box data-testid="cs-new-request-step-location">
      <Typography variant="h6" gutterBottom>
        Location Information
      </Typography>
      
      <Controller
        name="streetAddress"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Street Address"
            margin="normal"
            error={!!errors.streetAddress}
            helperText={errors.streetAddress?.message}
            data-testid="cs-new-request-street-address"
          />
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="City"
                margin="normal"
                error={!!errors.city}
                helperText={errors.city?.message}
                data-testid="cs-new-request-city"
              />
            )}
          />
        </Grid>
        <Grid item xs={4}>
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Postal Code"
                margin="normal"
                error={!!errors.postalCode}
                helperText={errors.postalCode?.message}
                data-testid="cs-new-request-postal-code"
              />
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="landmark"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Nearby Landmark (Optional)"
            margin="normal"
            helperText="e.g., Near City Hall, Opposite the park"
            data-testid="cs-new-request-landmark"
          />
        )}
      />

      <Controller
        name="accessInstructions"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Access Instructions (Optional)"
            multiline
            rows={2}
            margin="normal"
            helperText="Special instructions for accessing the location"
            data-testid="cs-new-request-access-instructions"
          />
        )}
      />

      <Controller
        name="locationText"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Additional Location Details"
            margin="normal"
            error={!!errors.locationText}
            helperText={errors.locationText?.message || 'Describe the exact location of the issue'}
            data-testid="cs-new-request-location-text"
          />
        )}
      />
    </Box>
  );

  // Step 3: Contact & Service Information
  const ContactServiceStep = (
    <Box data-testid="cs-new-request-step-contact">
      <Typography variant="h6" gutterBottom>
        Contact & Service Information
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Controller
            name="contactMethod"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel>Preferred Contact Method</InputLabel>
                <Select
                  {...field}
                  label="Preferred Contact Method"
                  data-testid="cs-new-request-contact-method"
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="PHONE">Phone</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="MAIL">Mail</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="alternatePhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Alternate Phone (Optional)"
                margin="normal"
                data-testid="cs-new-request-alternate-phone"
              />
            )}
          />
        </Grid>
      </Grid>

      <Controller
        name="bestTimeToContact"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Best Time to Contact (Optional)"
            margin="normal"
            helperText="e.g., Weekdays 9-5, Evenings, Weekends only"
            data-testid="cs-new-request-best-time"
          />
        )}
      />

      <FormControl fullWidth margin="normal">
        <FormLabel component="legend">Affected Services</FormLabel>
        <Controller
          name="affectedServices"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={affectedServicesOptions}
              value={field.value || []}
              onChange={(_, value) => field.onChange(value)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
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
                  helperText={errors.affectedServices?.message}
                  data-testid="cs-new-request-affected-services"
                />
              )}
            />
          )}
        />
      </FormControl>

      <Controller
        name="estimatedValue"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Estimated Cost/Value (Optional)"
            type="number"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Estimated cost of damage or repair value"
            data-testid="cs-new-request-estimated-value"
          />
        )}
      />

      {/* Additional Contacts */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Additional Contacts</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => appendContact({ name: '', phone: '', relationship: '' })}
            data-testid="cs-new-request-add-contact"
          >
            Add Contact
          </Button>
        </Box>
        
        {contactFields.map((field, index) => (
          <Card key={field.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Contact {index + 1}</Typography>
                <IconButton
                  onClick={() => removeContact(index)}
                  color="error"
                  data-testid={`cs-new-request-remove-contact-${index}`}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Controller
                    name={`additionalContacts.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Name"
                        error={!!errors.additionalContacts?.[index]?.name}
                        helperText={errors.additionalContacts?.[index]?.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name={`additionalContacts.${index}.phone`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone"
                        error={!!errors.additionalContacts?.[index]?.phone}
                        helperText={errors.additionalContacts?.[index]?.phone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name={`additionalContacts.${index}.relationship`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Relationship"
                        error={!!errors.additionalContacts?.[index]?.relationship}
                        helperText={errors.additionalContacts?.[index]?.relationship?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  // Step 4: Additional Info
  const AdditionalInfoStep = (
    <Box data-testid="cs-new-request-step-additional">
      <Typography variant="h6" gutterBottom>
        Additional Information
      </Typography>
      
      <Controller
        name="hasPermits"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={field.onChange}
                data-testid="cs-new-request-has-permits"
              />
            }
            label="Do you have relevant permits for this request?"
          />
        )}
      />

      <Controller
        name="comments"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Additional Comments (Optional)"
            multiline
            rows={3}
            margin="normal"
            helperText="Any additional information that might be helpful"
            data-testid="cs-new-request-comments"
          />
        )}
      />

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Service Experience
        </Typography>
        
        <FormControl margin="normal">
          <FormLabel component="legend">Rate your previous experience with city services (1-5 stars)</FormLabel>
          <Controller
            name="satisfactionRating"
            control={control}
            render={({ field }) => (
              <Rating
                {...field}
                size="large"
                data-testid="cs-new-request-rating"
              />
            )}
          />
        </FormControl>

        <Controller
          name="wantsUpdates"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  data-testid="cs-new-request-wants-updates"
                />
              }
              label="I want to receive updates about this request"
            />
          )}
        />

        <Controller
          name="agreesToTerms"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  color="primary"
                  required
                  data-testid="cs-new-request-agree-terms"
                />
              }
              label="I agree to the terms and conditions and confirm that the information provided is accurate"
            />
          )}
        />
        {errors.agreesToTerms && (
          <Typography variant="caption" color="error" display="block">
            {errors.agreesToTerms.message}
          </Typography>
        )}
      </Box>
    </Box>
  );

  // Step 5: Review
  const ReviewStep = (
    <Box data-testid="cs-new-request-step-review">
      <Typography variant="h6" gutterBottom>
        Review Your Request
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Basic Information</Typography>
              <Typography variant="body2"><strong>Title:</strong> {watchedValues.title}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {watchedValues.category}</Typography>
              <Typography variant="body2"><strong>Issue Type:</strong> {watchedValues.issueType}</Typography>
              <Typography variant="body2"><strong>Priority:</strong> {watchedValues.priority}</Typography>
              <Typography variant="body2"><strong>Severity:</strong> {watchedValues.severity}/10</Typography>
              <Typography variant="body2"><strong>Emergency:</strong> {watchedValues.isEmergency ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Recurring:</strong> {watchedValues.isRecurring ? 'Yes' : 'No'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Location</Typography>
              <Typography variant="body2"><strong>Address:</strong> {watchedValues.streetAddress}</Typography>
              <Typography variant="body2"><strong>City:</strong> {watchedValues.city}</Typography>
              <Typography variant="body2"><strong>Postal Code:</strong> {watchedValues.postalCode}</Typography>
              {watchedValues.landmark && (
                <Typography variant="body2"><strong>Landmark:</strong> {watchedValues.landmark}</Typography>
              )}
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
              <Typography variant="body2"><strong>Preferred Method:</strong> {watchedValues.contactMethod}</Typography>
              {watchedValues.alternatePhone && (
                <Typography variant="body2"><strong>Alternate Phone:</strong> {watchedValues.alternatePhone}</Typography>
              )}
              {watchedValues.bestTimeToContact && (
                <Typography variant="body2"><strong>Best Time:</strong> {watchedValues.bestTimeToContact}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="primary" gutterBottom>Service Information</Typography>
              <Typography variant="body2"><strong>Affected Services:</strong></Typography>
              <Box sx={{ mt: 1 }}>
                {watchedValues.affectedServices?.map((service) => (
                  <Chip key={service} label={service} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>
              {watchedValues.estimatedValue && (
                <Typography variant="body2"><strong>Estimated Value:</strong> ${watchedValues.estimatedValue}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {submitError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {submitError}
        </Alert>
      )}
    </Box>
  );

  const steps: StepperStep[] = [
    {
      label: 'Basic Information',
      component: BasicInfoStep,
    },
    {
      label: 'Location',
      component: LocationStep,
    },
    {
      label: 'Contact & Services',
      component: ContactServiceStep,
    },
    {
      label: 'Additional Details',
      component: AdditionalInfoStep,
    },
    {
      label: 'Review',
      component: ReviewStep,
    },
  ];

  return (
    <Box data-testid="cs-new-request-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Submit New Service Request
      </Typography>

      <StepperWizard
        steps={steps}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitLabel="Submit Request"
        testId="cs-new-request-wizard"
      />
    </Box>
  );
};

export default NewRequestPage;