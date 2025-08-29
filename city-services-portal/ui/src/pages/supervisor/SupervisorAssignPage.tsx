import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  TablePagination,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  PriorityHigh as PriorityIcon,
  WorkOutline as WorkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
}

const SupervisorAssignPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('TRIAGED');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<User | null>(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        size: rowsPerPage.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });

      const response = await fetch(`/api/v1/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data.data);
      setTotalCount(data.pagination?.totalCount || data.data.length);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      // Get unique users from staff performance data
      const response = await fetch('/api/v1/supervisor/staff-performance?size=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract unique users from staff performance data
        const uniqueUsersMap = new Map();
        data.data.forEach((performance: any) => {
          if (performance.user && !uniqueUsersMap.has(performance.user.id)) {
            uniqueUsersMap.set(performance.user.id, {
              id: performance.user.id,
              name: performance.user.name,
              email: performance.user.email,
              role: performance.user.role,
              departmentId: performance.departmentId,
            });
          }
        });
        
        const staffMembers = Array.from(uniqueUsersMap.values()).filter((user: User) => 
          ['CLERK', 'FIELD_AGENT', 'SUPERVISOR'].includes(user.role)
        );
        setUsers(staffMembers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, [page, rowsPerPage, statusFilter, priorityFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAssignClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setSelectedAssignee(null);
    setAssignmentReason('');
    setEstimatedEffort('');
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedRequest || !selectedAssignee) return;

    setAssignLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Create workload assignment
      const assignmentData = {
        requestId: selectedRequest.id,
        assignedTo: selectedAssignee.id,
        assignmentReason,
        estimatedEffort: estimatedEffort ? parseInt(estimatedEffort) : undefined,
      };

      const response = await fetch('/api/v1/supervisor/workload-assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the requests list
      await fetchRequests();
      setAssignDialogOpen(false);
      
    } catch (err) {
      console.error('Error assigning request:', err);
      setError('Failed to assign request. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'TRIAGED': return 'warning';
      case 'IN_PROGRESS': return 'primary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-supervisor-assign-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Task Assignment Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Unassigned Requests
                  </Typography>
                  <Typography variant="h4">
                    {requests.filter(r => !r.assignedTo).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    High Priority
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {requests.filter(r => r.priority === 'HIGH' || r.priority === 'URGENT').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <PriorityIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {requests.filter(r => r.status === 'IN_PROGRESS').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <WorkIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Available Staff
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {users.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="SUBMITTED">Submitted</MenuItem>
            <MenuItem value="TRIAGED">Triaged</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Priority Filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="URGENT">Urgent</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            onClick={fetchRequests}
            disabled={loading}
            fullWidth
            sx={{ height: '40px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Refresh'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={fetchRequests}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Requests Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Current Assignee</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {request.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      size="small"
                      label={request.priority}
                      color={getPriorityColor(request.priority) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      size="small"
                      label={request.status}
                      color={getStatusColor(request.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    {request.assignee ? (
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {request.assignee.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.assignee.role}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Chip size="small" label="Unassigned" color="warning" variant="outlined" />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {request.creator.name}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleAssignClick(request)}
                      disabled={request.status === 'RESOLVED' || request.status === 'CLOSED'}
                    >
                      {request.assignee ? 'Reassign' : 'Assign'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Assign Request: {selectedRequest?.code}
            </Typography>
            <Button onClick={() => setAssignDialogOpen(false)}>
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Request Details
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedRequest.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category: {selectedRequest.category} | Priority: {selectedRequest.priority}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Autocomplete
                  value={selectedAssignee}
                  onChange={(event, newValue) => setSelectedAssignee(newValue)}
                  options={users}
                  getOptionLabel={(option) => `${option.name} (${option.role})`}
                  renderInput={(params) => (
                    <TextField {...params} label="Assign to" required />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Avatar sx={{ width: 24, height: 24, mr: 2, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.role} - {option.email}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  label="Assignment Reason"
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  placeholder="Why is this person being assigned this request?"
                />
              </Box>

              <Box mb={2}>
                <TextField
                  label="Estimated Effort (hours)"
                  value={estimatedEffort}
                  onChange={(e) => setEstimatedEffort(e.target.value)}
                  type="number"
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssignSubmit}
            disabled={!selectedAssignee || assignLoading}
          >
            {assignLoading ? <CircularProgress size={24} /> : 'Assign Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupervisorAssignPage;