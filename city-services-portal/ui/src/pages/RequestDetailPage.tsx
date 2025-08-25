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
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/api';
import { ServiceRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';

const RequestDetailPage: React.FC = () => {
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
          'If-Match': request.version.toString(),
        },
      });
      
      setIsEditing(false);
      fetchRequest(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'primary';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'TRIAGED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'WAITING_ON_CITIZEN': return 'secondary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getAvailableActions = () => {
    if (!request) return [];
    
    const actions = [];
    const currentStatus = request.status;
    
    if (currentStatus === 'SUBMITTED' && ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'triage', label: 'Triage' });
    }
    
    if (currentStatus === 'TRIAGED' && ['CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'start', label: 'Start Work' });
    }
    
    if (currentStatus === 'IN_PROGRESS' && ['FIELD_AGENT', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'resolve', label: 'Resolve' });
      actions.push({ action: 'wait_for_citizen', label: 'Wait for Citizen' });
    }
    
    if (currentStatus === 'RESOLVED' && ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '')) {
      actions.push({ action: 'close', label: 'Close' });
    }
    
    return actions;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading request details...</Typography>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box data-testid="cs-request-detail-error">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Request not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          data-testid="cs-request-detail-back"
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box data-testid="cs-request-detail-page">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ mr: 1 }}
          data-testid="cs-request-detail-back"
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Request Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card data-testid="cs-request-detail-main">
            <CardContent>
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
                    Request ID: {request.code}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={isEditing ? (
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={editData.priority}
                            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                            variant="standard"
                          >
                            <MenuItem value="LOW">Low</MenuItem>
                            <MenuItem value="MEDIUM">Medium</MenuItem>
                            <MenuItem value="HIGH">High</MenuItem>
                            <MenuItem value="URGENT">Urgent</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        request.priority
                      )}
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
                  {['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '') && (
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
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => setIsEditing(true)}
                          data-testid="cs-request-detail-edit"
                        >
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Status action buttons */}
                  {getAvailableActions().map((actionItem) => (
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

              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
              {isEditing ? (
                <TextField
                  value={editData.locationText}
                  onChange={(e) => setEditData({ ...editData, locationText: e.target.value })}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
              ) : (
                <Typography variant="body1" paragraph>
                  {request.locationText}
                </Typography>
              )}

              {/* Comments Section */}
              {request.comments && request.comments.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Comments ({request.comments.length})
                  </Typography>
                  <List>
                    {request.comments.map((comment: any) => (
                      <ListItem key={comment.id} divider>
                        <ListItemText
                          primary={comment.content}
                          secondary={`${comment.author.name} • ${format(new Date(comment.createdAt), 'PPpp')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Attachments Section */}
              {request.attachments && request.attachments.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    <AttachmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Attachments ({request.attachments.length})
                  </Typography>
                  <List>
                    {request.attachments.map((attachment: any) => (
                      <ListItem key={attachment.id}>
                        <ListItemIcon>
                          <AttachmentIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={attachment.filename}
                          secondary={`${attachment.fileSize} bytes • ${format(new Date(attachment.createdAt), 'PPp')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Request Info */}
          <Card sx={{ mb: 2 }} data-testid="cs-request-detail-info">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>
              <Box sx={{ '& > *': { mb: 1 } }}>
                <Typography variant="body2">
                  <strong>Created:</strong> {format(new Date(request.createdAt), 'PPpp')}
                </Typography>
                <Typography variant="body2">
                  <strong>Updated:</strong> {format(new Date(request.updatedAt), 'PPpp')}
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
            <Card data-testid="cs-request-detail-history">
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