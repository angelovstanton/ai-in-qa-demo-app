import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon, FilterAlt as FilterIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import api from '../../lib/api';
import LocationDisplayMap from '../../components/LocationDisplayMap';
import AuthenticatedImage from '../../components/request-detail/AuthenticatedImage';

const ClerkInboxPage: React.FC = () => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data: requests, loading, error, totalCount, refetch } = useServiceRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    text: searchQuery || undefined,
    page: page,
    pageSize: 20,
  });

  // Use debounced search and reset data on filter change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchText);
      setPage(1);
      setAllRequests([]);
      setHasNextPage(true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  // Reset data when filters change
  useEffect(() => {
    setPage(1);
    setAllRequests([]);
    setHasNextPage(true);
    setSelectedRequestId(null);
    setSelectedRequestDetails(null);
  }, [statusFilter, priorityFilter]);

  // Handle new data from API
  useEffect(() => {
    if (requests && requests.length > 0) {
      if (page === 1) {
        // First page or filter change - replace all requests
        setAllRequests(requests);
      } else {
        // Subsequent pages - append new requests
        setAllRequests(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newRequests = requests.filter(r => !existingIds.has(r.id));
          return [...prev, ...newRequests];
        });
      }
      
      // Check if there are more pages
      setHasNextPage(requests.length === 20);
      setLoadingMore(false);
    } else if (page === 1) {
      // No results for first page
      setAllRequests([]);
      setHasNextPage(false);
      setLoadingMore(false);
    }
  }, [requests, page, totalCount]);

  const selectedRequest = allRequests.find(req => req.id === selectedRequestId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      case 'LOW':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'info';
      case 'TRIAGED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'warning';
      case 'WAITING_ON_CITIZEN':
        return 'secondary';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'secondary';
      case 'REJECTED':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const fetchRequestDetails = async (requestId: string) => {
    setLoadingRequestDetails(true);
    try {
      const response = await api.get(`/requests/${requestId}`);
      setSelectedRequestDetails(response.data.data);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
    } finally {
      setLoadingRequestDetails(false);
    }
  };

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
    if (requestId) {
      fetchRequestDetails(requestId);
    } else {
      setSelectedRequestDetails(null);
    }
  };

  const handleStatusChangeDialog = (action: string) => {
    setStatusAction(action);
    setStatusDialogOpen(true);
    setStatusError(null);
    setStatusReason('');
  };

  const handleStatusChange = async () => {
    if (!selectedRequest || !statusAction) return;
    
    setStatusLoading(true);
    setStatusError(null);

    try {
      await api.post(`/requests/${selectedRequest.id}/status`, {
        action: statusAction,
        reason: statusReason || undefined,
      });
      
      setStatusDialogOpen(false);
      setStatusAction('');
      setStatusReason('');
      refetch(); // Refresh the list
      
      // Clear selection to force refresh of details
      setSelectedRequestId(null);
      setTimeout(() => setSelectedRequestId(selectedRequest.id), 100);
      
    } catch (err: any) {
      setStatusError(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchText('');
    setSearchQuery('');
    setPage(1);
    setAllRequests([]);
    setHasNextPage(true);
  };

  const loadMoreRequests = () => {
    if (loadingMore || !hasNextPage || loading) return;
    
    const nextPage = Math.floor(allRequests.length / 20) + 1;
    setLoadingMore(true);
    setPage(nextPage);
  };

  const getAvailableActions = () => {
    if (!selectedRequest) return [];
    
    const actions = [];
    const currentStatus = selectedRequest.status;
    
    if (currentStatus === 'SUBMITTED') {
      actions.push({ action: 'triage', label: 'Triage', color: 'primary' });
    }
    
    if (currentStatus === 'TRIAGED') {
      actions.push({ action: 'start', label: 'Start Work', color: 'success' });
    }
    
    if (currentStatus === 'IN_PROGRESS') {
      actions.push({ action: 'resolve', label: 'Resolve', color: 'success' });
      actions.push({ action: 'wait_for_citizen', label: 'Wait for Citizen', color: 'warning' });
    }
    
    if (currentStatus === 'RESOLVED') {
      actions.push({ action: 'close', label: 'Close', color: 'secondary' });
    }
    
    // Always allow reject (with reason)
    if (['SUBMITTED', 'TRIAGED', 'IN_PROGRESS'].includes(currentStatus)) {
      actions.push({ action: 'reject', label: 'Reject', color: 'error' });
    }
    
    return actions;
  };

  return (
    <>
      <Box data-testid="cs-clerk-inbox-page" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Clerk Inbox
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={refetch} disabled={loading} data-testid="cs-inbox-refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-inbox-error">
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left Panel - Request List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Service Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {allRequests.length}{totalCount > 0 ? ` of ${totalCount}` : ''}
                </Typography>
              </Box>
              
              {/* Filters */}
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                        data-testid="cs-inbox-status-filter"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="SUBMITTED">Submitted</MenuItem>
                        <MenuItem value="TRIAGED">Triaged</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="WAITING_ON_CITIZEN">Waiting</MenuItem>
                        <MenuItem value="RESOLVED">Resolved</MenuItem>
                        <MenuItem value="CLOSED">Closed</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={priorityFilter}
                        label="Priority"
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        data-testid="cs-inbox-priority-filter"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="URGENT">Urgent</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="LOW">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search requests..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search by title, description, or request ID"
                      data-testid="cs-inbox-search"
                      InputProps={{
                        endAdornment: searchQuery && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
                            <Typography variant="caption" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                              {requests.length} result{requests.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )
                      }}
                      helperText={searchQuery ? `Searching for: "${searchQuery}"` : 'Search by title, description, request ID, location, category, etc.'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      size="small"
                      onClick={clearFilters}
                      startIcon={<FilterIcon />}
                      data-testid="cs-inbox-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>

            {/* Request List */}
            <Box 
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                minHeight: 0,
                maxHeight: 'calc(100vh - 280px)',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.4)',
                  },
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.2) rgba(0,0,0,0.05)',
              }}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                // Load more when scrolled to bottom
                if (scrollHeight - scrollTop === clientHeight && hasNextPage && !loadingMore) {
                  loadMoreRequests();
                }
              }}
            >
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}
              
              <List data-testid="cs-inbox-request-list">
                {allRequests.map((request) => (
                  <Box key={request.id}>
                    <ListItemButton
                      selected={selectedRequestId === request.id}
                      onClick={() => handleRequestSelect(request.id)}
                      data-testid={`cs-inbox-request-${request.id}`}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box component="span" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                              {request.code}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box component="span" sx={{ display: 'block', fontWeight: 'medium', fontSize: '0.875rem', color: 'text.primary' }}>
                              {request.title}
                            </Box>
                            <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                              {request.category} • {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </Box>
                ))}
                {allRequests.length === 0 && !loading && (
                  <ListItem>
                    <ListItemText 
                      primary="No requests found" 
                      secondary={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
                    />
                  </ListItem>
                )}
                
                {/* Loading more indicator */}
                {(loadingMore || (loading && page > 1)) && (
                  <ListItem>
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  </ListItem>
                )}
                
                {/* End of results indicator */}
                {!hasNextPage && allRequests.length > 0 && (
                  <ListItem>
                    <ListItemText 
                      primary={<Typography variant="body2" color="text.secondary" align="center">End of results</Typography>}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Card>
        </Grid>

        {/* Right Panel - Request Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} data-testid="cs-inbox-details-panel">
            <CardContent sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 3,
              minHeight: 0,
              maxHeight: 'calc(100vh - 120px)',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) rgba(0,0,0,0.05)',
            }}>
              {loadingRequestDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (selectedRequestDetails || selectedRequest) ? (
                <Box>
                  {(() => {
                    const displayRequest = selectedRequestDetails || selectedRequest;
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box>
                            <Typography variant="h5" gutterBottom>
                              {displayRequest.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Request ID: {displayRequest.code}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                label={displayRequest.priority}
                                color={getPriorityColor(displayRequest.priority) as any}
                                size="small"
                              />
                              <Chip
                                label={displayRequest.status.replace(/_/g, ' ')}
                                color={getStatusColor(displayRequest.status) as any}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={displayRequest.category}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {getAvailableActions().map((actionItem) => (
                            <Button
                              key={actionItem.action}
                              variant="contained"
                              size="small"
                              color={actionItem.color as any}
                              onClick={() => handleStatusChangeDialog(actionItem.action)}
                              data-testid={`cs-inbox-${actionItem.action}-button`}
                            >
                              {actionItem.label}
                            </Button>
                          ))}
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom>
                        Description
                      </Typography>
                          <Typography variant="body1" paragraph>
                            {displayRequest.description}
                          </Typography>

                          {/* Location Information */}
                          <Typography variant="h6" gutterBottom>
                            Location Information
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            {displayRequest.streetAddress && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Street Address</Typography>
                                <Typography variant="body1">{displayRequest.streetAddress}</Typography>
                              </Grid>
                            )}
                            {displayRequest.city && (
                              <Grid item xs={12} md={3}>
                                <Typography variant="body2" color="text.secondary">City</Typography>
                                <Typography variant="body1">{displayRequest.city}</Typography>
                              </Grid>
                            )}
                            {displayRequest.postalCode && (
                              <Grid item xs={12} md={3}>
                                <Typography variant="body2" color="text.secondary">Postal Code</Typography>
                                <Typography variant="body1">{displayRequest.postalCode}</Typography>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Location Details</Typography>
                              <Typography variant="body1">{displayRequest.locationText}</Typography>
                            </Grid>
                            {displayRequest.landmark && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Landmark</Typography>
                                <Typography variant="body1">{displayRequest.landmark}</Typography>
                              </Grid>
                            )}
                            {displayRequest.accessInstructions && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Access Instructions</Typography>
                                <Typography variant="body1">{displayRequest.accessInstructions}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* Map Display for Location */}
                          {((displayRequest.latitude && displayRequest.longitude) || (displayRequest.streetAddress || displayRequest.city)) && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="h6" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOnIcon sx={{ mr: 1 }} />
                                Location Map
                              </Typography>
                              {displayRequest.latitude && displayRequest.longitude && 
                               !isNaN(displayRequest.latitude) && !isNaN(displayRequest.longitude) &&
                               displayRequest.latitude !== 0 && displayRequest.longitude !== 0 ? (
                                <LocationDisplayMap
                                  latitude={displayRequest.latitude}
                                  longitude={displayRequest.longitude}
                                  address={[displayRequest.streetAddress, displayRequest.city, displayRequest.postalCode].filter(Boolean).join(', ')}
                                  title={`Service Request: ${displayRequest.title}`}
                                  description={displayRequest.locationText}
                                  height="250px"
                                  width="100%"
                                  zoom={15}
                                  showPopup={true}
                                />
                              ) : (
                                <Box sx={{ 
                                  height: '200px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  bgcolor: 'grey.50',
                                  border: '1px dashed',
                                  borderColor: 'grey.300',
                                  borderRadius: 1
                                }}>
                                  <Typography variant="body2" color="text.secondary">
                                    📍 No map coordinates available
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Contact Information */}
                          {(displayRequest.contactMethod || displayRequest.alternatePhone || displayRequest.bestTimeToContact) && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Contact Information
                              </Typography>
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                {displayRequest.contactMethod && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Preferred Contact Method</Typography>
                                    <Typography variant="body1">{displayRequest.contactMethod}</Typography>
                                  </Grid>
                                )}
                                {displayRequest.alternatePhone && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Alternate Phone</Typography>
                                    <Typography variant="body1">{displayRequest.alternatePhone}</Typography>
                                  </Grid>
                                )}
                                {displayRequest.bestTimeToContact && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Best Time to Contact</Typography>
                                    <Typography variant="body1">{displayRequest.bestTimeToContact}</Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </>
                          )}

                          {/* Issue Details */}
                          {(displayRequest.issueType || displayRequest.severity || displayRequest.isRecurring || displayRequest.isEmergency || displayRequest.hasPermits) && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Issue Details
                              </Typography>
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                {displayRequest.issueType && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Issue Type</Typography>
                                    <Typography variant="body1">{displayRequest.issueType}</Typography>
                                  </Grid>
                                )}
                                {displayRequest.severity && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Severity (1-10)</Typography>
                                    <Typography variant="body1">{displayRequest.severity}</Typography>
                                  </Grid>
                                )}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" color="text.secondary">Issue Characteristics</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {displayRequest.isRecurring && <Chip label="Recurring Issue" size="small" color="info" />}
                                    {displayRequest.isEmergency && <Chip label="Emergency" size="small" color="error" />}
                                    {displayRequest.hasPermits && <Chip label="Has Permits" size="small" color="success" />}
                                  </Box>
                                </Grid>
                              </Grid>
                            </>
                          )}

                          {/* Service Impact */}
                          {(displayRequest.affectedServices || displayRequest.estimatedValue) && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Service Impact
                              </Typography>
                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                {displayRequest.affectedServices && displayRequest.affectedServices.length > 0 && (
                                  <Grid item xs={12} md={8}>
                                    <Typography variant="body2" color="text.secondary">Affected Services</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                      {displayRequest.affectedServices.map((service, index) => (
                                        <Chip key={index} label={service} size="small" variant="outlined" />
                                      ))}
                                    </Box>
                                  </Grid>
                                )}
                                {displayRequest.estimatedValue && (
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="body2" color="text.secondary">Estimated Value</Typography>
                                    <Typography variant="body1">${displayRequest.estimatedValue.toLocaleString()}</Typography>
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
                            {displayRequest.attachments && displayRequest.attachments.length > 0 ? (
                              <Grid container spacing={2}>
                                {displayRequest.attachments.map((attachment, index) => (
                                  <Grid item xs={12} sm={6} key={attachment.id || index}>
                                    {attachment.mime?.startsWith('image/') ? (
                                      <AuthenticatedImage
                                        src={`http://localhost:3001/api/v1/attachments/${attachment.id}/image`}
                                        alt={attachment.filename || `Attachment ${index + 1}`}
                                        sx={{
                                          width: '100%',
                                          height: 200,
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                          border: '1px solid #ddd',
                                        }}
                                        testId={`cs-clerk-attachment-${attachment.id}`}
                                      />
                                    ) : (
                                      <Box sx={{ 
                                        width: '100%', 
                                        height: 200, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '1px dashed #ccc',
                                        borderRadius: 1
                                      }}>
                                        <Typography variant="body2" color="text.secondary">
                                          📎 {attachment.filename || 'Non-image attachment'}
                                        </Typography>
                                      </Box>
                                    )}
                                    {attachment.filename && (
                                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        {attachment.filename}
                                      </Typography>
                                    )}
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                py: 4,
                                border: '1px dashed #ccc',
                                borderRadius: 1,
                                bgcolor: 'grey.50'
                              }}>
                                <img 
                                  src="/images/service-request-default-image.png" 
                                  alt="No attachments placeholder" 
                                  style={{ 
                                    width: '100%',
                                    maxWidth: 300, 
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    opacity: 0.7
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                  No attachments uploaded for this request
                                </Typography>
                              </Box>
                            )}
                          </Box>
                    </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="h6" gutterBottom>
                            Request Details
                          </Typography>
                          <Box sx={{ '& > *': { mb: 1 } }}>
                            <Typography variant="body2">
                              <strong>Date of Request:</strong> {format(new Date(displayRequest.dateOfRequest), 'PPP')}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Created:</strong> {format(new Date(displayRequest.createdAt), 'PPpp')}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Updated:</strong> {format(new Date(displayRequest.updatedAt), 'PPpp')}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Requested by:</strong> {displayRequest.creator.name} ({displayRequest.creator.email})
                            </Typography>
                            {displayRequest.assignee && (
                              <Typography variant="body2">
                                <strong>Assigned to:</strong> {displayRequest.assignee.name}
                              </Typography>
                            )}
                            {displayRequest.department && (
                              <Typography variant="body2">
                                <strong>Department:</strong> {displayRequest.department.name}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  );})()}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6">
                    Select a request to view details
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>

    {/* Status Change Dialog */}
    <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="cs-inbox-status-dialog"
      >
        <DialogTitle>
          Change Request Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to <strong>{statusAction?.replace('_', ' ')}</strong> this request?
          </Typography>
          
          {statusAction === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              Rejecting a request requires a reason and will notify the citizen.
            </Alert>
          )}
          
          <TextField
            fullWidth
            label={statusAction === 'reject' ? 'Reason for rejection (required)' : 'Reason (optional)'}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
            required={statusAction === 'reject'}
            data-testid="cs-inbox-status-reason"
          />
          
          {statusError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {statusError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            disabled={statusLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange} 
            variant="contained"
            disabled={statusLoading || (statusAction === 'reject' && !statusReason.trim())}
            data-testid="cs-inbox-status-confirm"
          >
            {statusLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClerkInboxPage;