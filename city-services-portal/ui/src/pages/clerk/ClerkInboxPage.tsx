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
import { Refresh as RefreshIcon, FilterAlt as FilterIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import api from '../../lib/api';

const ClerkInboxPage: React.FC = () => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Use debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchText);
    }, 300); // Reduced from 500ms to 300ms for faster response
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const { data: requests, loading, error, refetch } = useServiceRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    text: searchQuery || undefined,
    pageSize: 50, // Load more items for inbox view
  });

  const selectedRequest = requests.find(req => req.id === selectedRequestId);

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

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
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
      <Box data-testid="cs-clerk-inbox-page" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              <Typography variant="h6" gutterBottom>
                Service Requests ({requests.length})
              </Typography>
              
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
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              minHeight: 0, // Important for flex child to shrink
              '&::-webkit-scrollbar': {
                width: '12px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(0,0,0,0.5)',
              },
              // For Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)',
            }}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}
              
              <List data-testid="cs-inbox-request-list">
                {requests.map((request) => (
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
                {requests.length === 0 && !loading && (
                  <ListItem>
                    <ListItemText 
                      primary="No requests found" 
                      secondary={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
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
              minHeight: 0, // Important for flex child to shrink
              '&::-webkit-scrollbar': {
                width: '12px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(0,0,0,0.5)',
              },
              // For Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)',
            }}>
              {selectedRequest ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {selectedRequest.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Request ID: {selectedRequest.code}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={selectedRequest.priority}
                          color={getPriorityColor(selectedRequest.priority) as any}
                          size="small"
                        />
                        <Chip
                          label={selectedRequest.status.replace(/_/g, ' ')}
                          color={getStatusColor(selectedRequest.status) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={selectedRequest.category}
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
                        {selectedRequest.description}
                      </Typography>

                      {/* Location Information */}
                      <Typography variant="h6" gutterBottom>
                        Location Information
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {selectedRequest.streetAddress && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Street Address</Typography>
                            <Typography variant="body1">{selectedRequest.streetAddress}</Typography>
                          </Grid>
                        )}
                        {selectedRequest.city && (
                          <Grid item xs={12} md={3}>
                            <Typography variant="body2" color="text.secondary">City</Typography>
                            <Typography variant="body1">{selectedRequest.city}</Typography>
                          </Grid>
                        )}
                        {selectedRequest.postalCode && (
                          <Grid item xs={12} md={3}>
                            <Typography variant="body2" color="text.secondary">Postal Code</Typography>
                            <Typography variant="body1">{selectedRequest.postalCode}</Typography>
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Location Details</Typography>
                          <Typography variant="body1">{selectedRequest.locationText}</Typography>
                        </Grid>
                        {selectedRequest.landmark && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Landmark</Typography>
                            <Typography variant="body1">{selectedRequest.landmark}</Typography>
                          </Grid>
                        )}
                        {selectedRequest.accessInstructions && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Access Instructions</Typography>
                            <Typography variant="body1">{selectedRequest.accessInstructions}</Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* Contact Information */}
                      {(selectedRequest.contactMethod || selectedRequest.alternatePhone || selectedRequest.bestTimeToContact) && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Contact Information
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            {selectedRequest.contactMethod && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Preferred Contact Method</Typography>
                                <Typography variant="body1">{selectedRequest.contactMethod}</Typography>
                              </Grid>
                            )}
                            {selectedRequest.alternatePhone && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Alternate Phone</Typography>
                                <Typography variant="body1">{selectedRequest.alternatePhone}</Typography>
                              </Grid>
                            )}
                            {selectedRequest.bestTimeToContact && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Best Time to Contact</Typography>
                                <Typography variant="body1">{selectedRequest.bestTimeToContact}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        </>
                      )}

                      {/* Issue Details */}
                      {(selectedRequest.issueType || selectedRequest.severity || selectedRequest.isRecurring || selectedRequest.isEmergency || selectedRequest.hasPermits) && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Issue Details
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            {selectedRequest.issueType && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Issue Type</Typography>
                                <Typography variant="body1">{selectedRequest.issueType}</Typography>
                              </Grid>
                            )}
                            {selectedRequest.severity && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Severity (1-10)</Typography>
                                <Typography variant="body1">{selectedRequest.severity}</Typography>
                              </Grid>
                            )}
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2" color="text.secondary">Issue Characteristics</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {selectedRequest.isRecurring && <Chip label="Recurring Issue" size="small" color="info" />}
                                {selectedRequest.isEmergency && <Chip label="Emergency" size="small" color="error" />}
                                {selectedRequest.hasPermits && <Chip label="Has Permits" size="small" color="success" />}
                              </Box>
                            </Grid>
                          </Grid>
                        </>
                      )}

                      {/* Service Impact */}
                      {(selectedRequest.affectedServices || selectedRequest.estimatedValue) && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Service Impact
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            {selectedRequest.affectedServices && selectedRequest.affectedServices.length > 0 && (
                              <Grid item xs={12} md={8}>
                                <Typography variant="body2" color="text.secondary">Affected Services</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                  {selectedRequest.affectedServices.map((service, index) => (
                                    <Chip key={index} label={service} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              </Grid>
                            )}
                            {selectedRequest.estimatedValue && (
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Estimated Value</Typography>
                                <Typography variant="body1">${selectedRequest.estimatedValue.toLocaleString()}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        </>
                      )}

                      {/* Default Image */}
                      <Typography variant="h6" gutterBottom>
                        Attachments
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <img 
                          src="/images/service-request-default-image.png" 
                          alt="Service Request" 
                          style={{ 
                            maxWidth: '100%', 
                            height: 'auto', 
                            maxHeight: '300px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" gutterBottom>
                        Request Details
                      </Typography>
                      <Box sx={{ '& > *': { mb: 1 } }}>
                        <Typography variant="body2">
                          <strong>Date of Request:</strong> {format(new Date(selectedRequest.dateOfRequest), 'PPP')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Created:</strong> {format(new Date(selectedRequest.createdAt), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Updated:</strong> {format(new Date(selectedRequest.updatedAt), 'PPpp')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Requested by:</strong> {selectedRequest.creator.name} ({selectedRequest.creator.email})
                        </Typography>
                        {selectedRequest.assignee && (
                          <Typography variant="body2">
                            <strong>Assigned to:</strong> {selectedRequest.assignee.name}
                          </Typography>
                        )}
                        {selectedRequest.department && (
                          <Typography variant="body2">
                            <strong>Department:</strong> {selectedRequest.department.name}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
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