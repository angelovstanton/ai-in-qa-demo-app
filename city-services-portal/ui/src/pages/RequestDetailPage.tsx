import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Paper,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Send as SendIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { ServiceRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LocationDisplayMap from '../components/LocationDisplayMap';
import AuthenticatedImage from '../components/request-detail/AuthenticatedImage';

// Comment validation schema
const commentSchema = z.object({
  content: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must be less than 1000 characters')
    .refine(
      (content) => content.trim().split(/\s+/).length >= 3,
      'Comment must contain at least 3 words'
    ),
  isPrivate: z.boolean().default(false),
});

type CommentFormData = z.infer<typeof commentSchema>;

const RequestDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Initialize edit data when entering edit mode
  const initializeEditData = () => {
    if (request) {
      setEditData({
        title: request.title || '',
        description: request.description || '',
        locationText: request.locationText || '',
        streetAddress: request.streetAddress || '',
        city: request.city || '',
        postalCode: request.postalCode || '',
        landmark: request.landmark || '',
        accessInstructions: request.accessInstructions || '',
        contactMethod: request.contactMethod || 'EMAIL',
        email: request.email || '',
        phone: request.phone || '',
        alternatePhone: request.alternatePhone || '',
        bestTimeToContact: request.bestTimeToContact || '',
        mailingStreetAddress: request.mailingStreetAddress || '',
        mailingCity: request.mailingCity || '',
        mailingPostalCode: request.mailingPostalCode || '',
        priority: request.priority || 'MEDIUM',
        category: request.category || '',
        issueType: request.issueType || '',
        severity: request.severity || 5,
        isRecurring: request.isRecurring || false,
        isEmergency: request.isEmergency || false,
        hasPermits: request.hasPermits || false,
      });
    }
  };
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Comment form
  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    mode: 'onChange',
    defaultValues: {
      content: '',
      isPrivate: false,
    }
  });

  // Check if request can be edited (within 10 minutes of creation)
  const canEditRequest = (): boolean => {
    if (!request) return false;
    
    // Only the creator can edit their own request
    if (request.creator.id !== user?.id) return false;
    
    const createdAt = new Date(request.createdAt);
    const now = new Date();
    const minutesSinceCreation = differenceInMinutes(now, createdAt);
    
    return minutesSinceCreation <= 10;
  };

  // Get tooltip message for edit button
  const getEditTooltipMessage = (): string => {
    if (!request) return '';
    
    if (request.creator.id !== user?.id) {
      return 'You can only edit your own requests';
    }
    
    const createdAt = new Date(request.createdAt);
    const now = new Date();
    const minutesSinceCreation = differenceInMinutes(now, createdAt);
    
    if (minutesSinceCreation > 10) {
      return `Editing is only allowed within 10 minutes of submission. This request was created ${minutesSinceCreation} minutes ago.`;
    }
    
    const remainingMinutes = 10 - minutesSinceCreation;
    return `You can edit this request for ${remainingMinutes} more minute(s).`;
  };

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/requests/${id}`);
      setRequest(response.data.data);
      setEditData({
        title: response.data.data.title,
        description: response.data.data.description,
        priority: response.data.data.priority,
        locationText: response.data.data.locationText,
      });
      
      // Set upvote data
      setUpvoteCount(response.data.data.upvotes || 0);
      setHasUpvoted(response.data.data.hasUserUpvoted || false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!request || !newStatus) return;
    
    try {
      await api.post(`/requests/${request.id}/status`, {
        action: newStatus,
        reason: statusReason || undefined,
      });
      
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusReason('');
      fetchRequest(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleSaveEdit = async () => {
    if (!request) return;
    
    try {
      await api.patch(`/requests/${request.id}`, editData, {
        headers: {
          'If-Match': request.version?.toString() || '1',
        },
      });
      
      setIsEditing(false);
      fetchRequest(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update request');
    }
  };

  const handleUpvote = async () => {
    if (!request || !user) return;
    
    // Prevent users from upvoting their own requests
    if (request.creator.id === user.id) {
      setError('You cannot upvote your own request');
      return;
    }

    setIsUpvoting(true);
    setError(null);

    try {
      const response = await api.post(`/requests/${request.id}/upvote`);
      
      // Update local state based on response
      setHasUpvoted(response.data.data.hasUpvoted);
      setUpvoteCount(response.data.data.upvoteCount);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update upvote');
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleCommentSubmit = async (data: CommentFormData) => {
    if (!request || !user) return;

    setIsSubmittingComment(true);
    setError(null);

    try {
      await api.post(`/requests/${request.id}/comments`, {
        content: data.content.trim(),
        isPrivate: data.isPrivate,
      });

      // Reset form and hide comment form
      commentForm.reset();
      setShowCommentForm(false);
      
      // Refresh request data to show new comment
      fetchRequest();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'primary';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'TRIAGED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'WAITING_ON_CITIZEN': return 'secondary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'secondary';
      case 'REJECTED': return 'error';
      default: return 'secondary';
    }
  };

  const getAvailableActions = () => {
    if (!request) return [];
    
    const actions = [];
    const currentStatus = request.status;
    
    if (currentStatus === 'SUBMITTED' && ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'triage', label: 'Triage' });
      actions.push({ action: 'request_more_info', label: 'Request More Information' });
    }
    
    if (currentStatus === 'TRIAGED' && ['CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'start', label: 'Start Work' });
      actions.push({ action: 'request_more_info', label: 'Request More Information' });
    }
    
    if (currentStatus === 'IN_PROGRESS' && ['FIELD_AGENT', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'resolve', label: 'Resolve' });
      actions.push({ action: 'wait_for_citizen', label: 'Wait for Citizen' });
      actions.push({ action: 'request_more_info', label: 'Request More Information' });
    }
    
    if (currentStatus === 'WAITING_ON_CITIZEN' && ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'resume_progress', label: 'Resume Progress' });
      actions.push({ action: 'close_no_response', label: 'Close (No Response)' });
    }
    
    if (currentStatus === 'RESOLVED' && ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'close', label: 'Close' });
      actions.push({ action: 'reopen', label: 'Reopen' });
    }
    
    return actions;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>{t('requests:messages.loadingRequests', 'Loading request details...')}</Typography>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box data-testid="cs-request-detail-error">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || t('requests:messages.errorLoading', 'Request not found')}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          data-testid="cs-request-detail-back"
        >
          {t('common:back', 'Go Back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box data-testid="cs-request-detail-page" sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ mr: 1 }}
          data-testid="cs-request-detail-back"
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {t('requests:requestDetails', 'Request Details')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Error display for edit actions */}
          {error && request && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Card data-testid="cs-request-detail-main" sx={{ height: 'fit-content' }}>
            <CardContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {isEditing ? (
                      <TextField
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      request.title
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('requests:requestId', 'Request ID')}: {request.code}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={request.priority}
                      color={getPriorityColor(request.priority) as any}
                      size="small"
                    />
                    <Chip
                      label={request.status.replace(/_/g, ' ')}
                      color={getStatusColor(request.status) as any}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={request.category}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Edit/Save/Cancel buttons */}
                  {user?.role === 'CITIZEN' && request.creator.id === user.id && (
                    <>
                      {isEditing ? (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveEdit}
                            data-testid="cs-request-detail-save"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => setIsEditing(false)}
                            data-testid="cs-request-detail-cancel"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Tooltip title={getEditTooltipMessage()} arrow>
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={canEditRequest() ? <EditIcon /> : <LockIcon />}
                              onClick={() => {
                                if (canEditRequest()) {
                                  initializeEditData();
                                  setIsEditing(true);
                                }
                              }}
                              disabled={!canEditRequest()}
                              data-testid="cs-request-detail-edit"
                            >
                              {canEditRequest() ? 'Edit' : 'Edit Locked'}
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </>
                  )}
                  
                  {/* Status action buttons */}
                  {['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '') && getAvailableActions().map((actionItem) => (
                    <Button
                      key={actionItem.action}
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setNewStatus(actionItem.action);
                        setStatusDialogOpen(true);
                      }}
                      data-testid={`cs-request-detail-${actionItem.action}`}
                    >
                      {actionItem.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              {isEditing ? (
                <TextField
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
              ) : (
                <Typography variant="body1" paragraph>
                  {request.description}
                </Typography>
              )}

              {/* Location Information */}
              <Typography variant="h6" gutterBottom>
                Location Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Street Address</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.streetAddress || ''}
                      onChange={(e) => setEditData({ ...editData, streetAddress: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">{request.streetAddress || 'Not specified'}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">City</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.city || ''}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">{request.city || 'Not specified'}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Postal Code</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.postalCode || ''}
                      onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">{request.postalCode || 'Not specified'}</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Location Details</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.locationText}
                      onChange={(e) => setEditData({ ...editData, locationText: e.target.value })}
                      fullWidth
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body1">{request.locationText}</Typography>
                  )}
                </Grid>
                {(request.landmark || isEditing) && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Landmark</Typography>
                    {isEditing ? (
                      <TextField
                        value={editData.landmark || ''}
                        onChange={(e) => setEditData({ ...editData, landmark: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{request.landmark || 'Not specified'}</Typography>
                    )}
                  </Grid>
                )}
                {(request.accessInstructions || isEditing) && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Access Instructions</Typography>
                    {isEditing ? (
                      <TextField
                        value={editData.accessInstructions || ''}
                        onChange={(e) => setEditData({ ...editData, accessInstructions: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{request.accessInstructions || 'Not specified'}</Typography>
                    )}
                  </Grid>
                )}
              </Grid>

              {/* Map Display for Location */}
              {((request.latitude && request.longitude) || (request.streetAddress || request.city)) && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Location Map
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {request.latitude && request.longitude && 
                     !isNaN(request.latitude) && !isNaN(request.longitude) &&
                     request.latitude !== 0 && request.longitude !== 0 ? (
                      <LocationDisplayMap
                        latitude={request.latitude}
                        longitude={request.longitude}
                        address={[request.streetAddress, request.city, request.postalCode].filter(Boolean).join(', ')}
                        title={`Service Request: ${request.title}`}
                        description={request.locationText}
                        height="300px"
                        width="100%"
                        zoom={15}
                        showPopup={true}
                      />
                    ) : (
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <LocationOnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Interactive map not available for this location
                        </Typography>
                        {(request.streetAddress || request.city) && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Address: {[request.streetAddress, request.city, request.postalCode].filter(Boolean).join(', ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Location coordinates were not captured during request creation
                            </Typography>
                          </>
                        )}
                      </Paper>
                    )}
                  </Box>
                </>
              )}

              {/* Contact Information */}
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Preferred Contact Method</Typography>
                  {isEditing ? (
                    <TextField
                      select
                      value={editData.contactMethod || 'EMAIL'}
                      onChange={(e) => setEditData({ ...editData, contactMethod: e.target.value })}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="EMAIL">Email</MenuItem>
                      <MenuItem value="PHONE">Phone</MenuItem>
                      <MenuItem value="SMS">SMS</MenuItem>
                      <MenuItem value="MAIL">Mail</MenuItem>
                    </TextField>
                  ) : (
                    <Typography variant="body1">{request.contactMethod || 'Not specified'}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      fullWidth
                      size="small"
                      type="email"
                    />
                  ) : (
                    <Typography variant="body1">{request.email || 'Not specified'}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  {isEditing ? (
                    <TextField
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      fullWidth
                      size="small"
                      type="tel"
                    />
                  ) : (
                    <Typography variant="body1">{request.phone || 'Not specified'}</Typography>
                  )}
                </Grid>
                {(request.alternatePhone || isEditing) && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Alternate Phone</Typography>
                    {isEditing ? (
                      <TextField
                        value={editData.alternatePhone || ''}
                        onChange={(e) => setEditData({ ...editData, alternatePhone: e.target.value })}
                        fullWidth
                        size="small"
                        type="tel"
                      />
                    ) : (
                      <Typography variant="body1">{request.alternatePhone || 'Not specified'}</Typography>
                    )}
                  </Grid>
                )}
                {(request.bestTimeToContact || isEditing) && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Best Time to Contact</Typography>
                    {isEditing ? (
                      <TextField
                        value={editData.bestTimeToContact || ''}
                        onChange={(e) => setEditData({ ...editData, bestTimeToContact: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{request.bestTimeToContact || 'Not specified'}</Typography>
                    )}
                  </Grid>
                )}
                {/* Mailing Address Fields (when contact method is MAIL) */}
                {((request.contactMethod === 'MAIL' && (request.mailingStreetAddress || request.mailingCity || request.mailingPostalCode)) || 
                  (isEditing && editData.contactMethod === 'MAIL')) && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Mailing Address</Typography>
                      {isEditing ? (
                        <TextField
                          value={editData.mailingStreetAddress || ''}
                          onChange={(e) => setEditData({ ...editData, mailingStreetAddress: e.target.value })}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{request.mailingStreetAddress || 'Not specified'}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Mailing City</Typography>
                      {isEditing ? (
                        <TextField
                          value={editData.mailingCity || ''}
                          onChange={(e) => setEditData({ ...editData, mailingCity: e.target.value })}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{request.mailingCity || 'Not specified'}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Mailing Postal Code</Typography>
                      {isEditing ? (
                        <TextField
                          value={editData.mailingPostalCode || ''}
                          onChange={(e) => setEditData({ ...editData, mailingPostalCode: e.target.value })}
                          fullWidth
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{request.mailingPostalCode || 'Not specified'}</Typography>
                      )}
                    </Grid>
                  </>
                )}
              </Grid>

              {/* Issue Details */}
              {(request.issueType || request.severity || request.isRecurring || request.isEmergency || request.hasPermits) && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Issue Details
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.issueType && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Issue Type</Typography>
                        <Typography variant="body1">{request.issueType}</Typography>
                      </Grid>
                    )}
                    {request.severity && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Severity (1-10)</Typography>
                        <Typography variant="body1">{request.severity}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Issue Characteristics</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {request.isRecurring && <Chip label="Recurring Issue" size="small" color="info" />}
                        {request.isEmergency && <Chip label="Emergency" size="small" color="error" />}
                        {request.hasPermits && <Chip label="Has Permits" size="small" color="success" />}
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Service Impact */}
              {(request.affectedServices || request.estimatedValue) && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Service Impact
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.affectedServices && request.affectedServices.length > 0 && (
                      <Grid item xs={12} md={8}>
                        <Typography variant="body2" color="text.secondary">Affected Services</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {request.affectedServices.map((service, index) => (
                            <Chip key={index} label={service} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    {request.estimatedValue && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Estimated Value</Typography>
                        <Typography variant="body1">${request.estimatedValue.toLocaleString()}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* Additional Contacts */}
              {request.additionalContacts && request.additionalContacts.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Additional Contacts
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.additionalContacts.map((contact, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="body2" color="text.secondary">Contact {index + 1}</Typography>
                          <Typography variant="body1" fontWeight="bold">{contact.name}</Typography>
                          <Typography variant="body2">{contact.phone}</Typography>
                          <Typography variant="body2" color="text.secondary">{contact.relationship}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {/* Scheduled Service */}
              {(request.preferredDate || request.preferredTime) && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Preferred Schedule
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.preferredDate && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Preferred Date</Typography>
                        <Typography variant="body1">{format(new Date(request.preferredDate), 'PPP')}</Typography>
                      </Grid>
                    )}
                    {request.preferredTime && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Preferred Time</Typography>
                        <Typography variant="body1">{request.preferredTime}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* User Experience */}
              {(request.satisfactionRating || request.formComments) && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {request.satisfactionRating && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Satisfaction Rating (1-5)</Typography>
                        <Typography variant="body1">{request.satisfactionRating}/5</Typography>
                      </Grid>
                    )}
                    {request.formComments && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Additional Comments</Typography>
                        <Typography variant="body1">{request.formComments}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* Attachments */}
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              <Box sx={{ mb: 3 }}>
                {request.attachments && request.attachments.length > 0 ? (
                  <Grid container spacing={2}>
                    {request.attachments.map((attachment, index) => (
                      <Grid item xs={12} sm={6} md={4} key={attachment.id || index}>
                        <Card>
                          <CardContent sx={{ p: 2 }}>
                            {attachment.mime?.startsWith('image/') ? (
                              <AuthenticatedImage
                                src={`http://localhost:3001/api/v1/attachments/${attachment.id}/image`}
                                alt={attachment.filename || `Attachment ${index + 1}`}
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                                testId={`cs-attachment-image-${attachment.id}`}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'grey.100',
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                                data-testid={`cs-attachment-file-${attachment.id}`}
                              >
                                <Typography variant="h4" color="text.secondary">
                                  📄
                                </Typography>
                              </Box>
                            )}
                            <Typography variant="body2" noWrap title={attachment.filename}>
                              {attachment.filename || 'Attachment'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Card sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Box
                        component="img"
                        src="/images/service-request-default-image.png"
                        alt="No attachments placeholder"
                        sx={{
                          width: '100%',
                          maxWidth: 300,
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 2,
                          opacity: 0.7,
                        }}
                        onError={(e) => {
                          // Hide image if default image is also not available
                          e.currentTarget.style.display = 'none';
                        }}
                        data-testid="cs-default-attachment-image"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        No attachments uploaded for this request
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Upvotes Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h6">
                  Community Feedback
                </Typography>
                <Tooltip title={
                  request.creator.id === user?.id 
                    ? "You cannot upvote your own request" 
                    : hasUpvoted 
                      ? "Remove upvote" 
                      : "Upvote this request"
                }>
                  <span>
                    <Button
                      variant={hasUpvoted ? "contained" : "outlined"}
                      color="primary"
                      startIcon={hasUpvoted ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                      onClick={handleUpvote}
                      disabled={isUpvoting || request.creator.id === user?.id}
                      data-testid="cs-request-upvote-button"
                      sx={{ minWidth: 120 }}
                    >
                      {upvoteCount} {upvoteCount === 1 ? 'Upvote' : 'Upvotes'}
                    </Button>
                  </span>
                </Tooltip>
                
                <Button
                  variant="outlined"
                  startIcon={<CommentIcon />}
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  data-testid="cs-request-comment-button"
                >
                  Add Comment
                </Button>
              </Box>

              {/* Comment Form */}
              {showCommentForm && (
                <Paper sx={{ p: 2, mb: 3 }} data-testid="cs-comment-form">
                  <Typography variant="subtitle1" gutterBottom>
                    Add a Comment
                  </Typography>
                  
                  <Box component="form" onSubmit={commentForm.handleSubmit(handleCommentSubmit)}>
                    <Controller
                      name="content"
                      control={commentForm.control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Share your thoughts about this request... (minimum 10 characters)"
                          error={!!commentForm.formState.errors.content}
                          helperText={
                            commentForm.formState.errors.content?.message ||
                            `${field.value?.length || 0}/1000 characters`
                          }
                          data-testid="cs-comment-content"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Submit comment">
                                  <IconButton
                                    type="submit"
                                    disabled={isSubmittingComment || !commentForm.formState.isValid}
                                    data-testid="cs-comment-submit"
                                  >
                                    <SendIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Controller
                        name="isPrivate"
                        control={commentForm.control}
                        render={({ field }) => (
                          <Box>
                            <Chip
                              label={field.value ? "Private Comment" : "Public Comment"}
                              onClick={() => field.onChange(!field.value)}
                              color={field.value ? "secondary" : "primary"}
                              variant={field.value ? "filled" : "outlined"}
                              size="small"
                              data-testid="cs-comment-privacy"
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              {field.value ? "Only staff can see this comment" : "Everyone can see this comment"}
                            </Typography>
                          </Box>
                        )}
                      />
                      
                      <Button
                        variant="text"
                        onClick={() => {
                          setShowCommentForm(false);
                          commentForm.reset();
                        }}
                        data-testid="cs-comment-cancel"
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Comments Section */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Comments ({typeof request.comments === 'number' ? request.comments : request.comments?.length || 0})
              </Typography>
              
              {typeof request.comments === 'number' ? (
                <Typography variant="body2" color="text.secondary">
                  {request.comments === 0 ? 'No comments yet' : `${request.comments} comments available`}
                </Typography>
              ) : (
                request.comments && request.comments.length > 0 ? (
                  <List data-testid="cs-comments-list">
                    {request.comments.map((comment, index) => (
                      <ListItem key={comment.id || index} divider sx={{ alignItems: 'flex-start', py: 2 }}>
                        <ListItemIcon sx={{ mt: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {comment.author?.name || 'Anonymous'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(comment.createdAt), 'PPpp')}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                              data-testid={`cs-comment-content-${comment.id || index}`}
                            >
                              {comment.body}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <CommentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No comments yet. Be the first to share your thoughts!
                    </Typography>
                  </Paper>
                )
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Request Info */}
          <Card sx={{ mb: 2, height: 'fit-content' }} data-testid="cs-request-detail-info">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>
              <Box sx={{ '& > *': { mb: 1 } }}>
                <Typography variant="body2">
                  <strong>Date of Request:</strong> {format(new Date(request.dateOfRequest), 'PPP')}
                </Typography>
                <Typography variant="body2">
                  <strong>Created:</strong> {format(new Date(request.createdAt), 'PPpp')}
                </Typography>
                <Typography variant="body2">
                  <strong>Updated:</strong> {format(new Date(request.updatedAt), 'PPpp')}
                </Typography>
                <Typography variant="body2" data-testid="cs-request-detail-edit-status">
                  <strong>Edit Status:</strong> {canEditRequest() ? (
                    <Chip 
                      label={`Editable (${10 - differenceInMinutes(new Date(), new Date(request.createdAt))} min left)`} 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      label="Edit Time Expired" 
                      color="default" 
                      size="small" 
                    />
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Requested by:</strong> {request.creator.name} ({request.creator.email})
                </Typography>
                {request.assignee && (
                  <Typography variant="body2">
                    <strong>Assigned to:</strong> {request.assignee.name}
                  </Typography>
                )}
                {request.department && (
                  <Typography variant="body2">
                    <strong>Department:</strong> {request.department.name}
                  </Typography>
                )}
                {request.closedAt && (
                  <Typography variant="body2">
                    <strong>Closed:</strong> {format(new Date(request.closedAt), 'PPpp')}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Event History */}
          {request.eventLogs && request.eventLogs.length > 0 && (
            <Card sx={{ height: 'fit-content' }} data-testid="cs-request-detail-history">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  History
                </Typography>
                <List dense>
                  {request.eventLogs.slice(0, 5).map((event: any) => {
                    const payload = JSON.parse(event.payload);
                    return (
                      <ListItem key={event.id}>
                        <ListItemText
                          primary={`${payload.action || event.type}`}
                          secondary={format(new Date(event.createdAt), 'PPp')}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
        </Grid>
      </Box>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        data-testid="cs-request-status-dialog"
      >
        <DialogTitle>Change Request Status</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to {newStatus.replace('_', ' ')} this request?
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestDetailPage;