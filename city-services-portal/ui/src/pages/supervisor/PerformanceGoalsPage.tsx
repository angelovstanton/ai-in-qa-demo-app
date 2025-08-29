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
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  TablePagination,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Fab,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface PerformanceGoal {
  id: string;
  userId: string;
  supervisorId: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'PAUSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
}

const PerformanceGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<PerformanceGoal | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [newGoalDialogOpen, setNewGoalDialogOpen] = useState(false);
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [editGoalData, setEditGoalData] = useState<Partial<PerformanceGoal>>({});
  const [newGoalData, setNewGoalData] = useState({
    userId: '',
    title: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    unit: 'count',
    dueDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'PAUSED',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
  });
  const [users, setUsers] = useState<any[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPerformanceGoals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });

      const response = await fetch(`/api/v1/supervisor/performance-goals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGoals(data.data);
      setTotalCount(data.pagination?.totalCount || data.data.length);
    } catch (err) {
      console.error('Error fetching performance goals:', err);
      setError('Failed to load performance goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceGoals();
  }, [page, rowsPerPage, statusFilter, priorityFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (goal: PerformanceGoal) => {
    setSelectedGoal(goal);
    setDetailDialogOpen(true);
  };

  const handleEditGoal = (goal: PerformanceGoal) => {
    setSelectedGoal(goal);
    setEditGoalData({
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      dueDate: goal.dueDate.split('T')[0], // Format for date input
      status: goal.status,
      priority: goal.priority
    });
    setEditGoalDialogOpen(true);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      // Use staff performance endpoint to get users
      const response = await fetch('/api/v1/supervisor/staff-performance?size=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const uniqueUsers = data.data.map((staff: any) => staff.user).filter((user: any, index: number, self: any[]) => 
          self.findIndex(u => u.id === user.id) === index
        );
        setUsers(uniqueUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateGoal = async () => {
    // Validate required fields
    if (!newGoalData.userId || !newGoalData.title || !newGoalData.dueDate) {
      setError('Please fill all required fields');
      return;
    }
    
    // Validate description length (API requires minimum 10 characters)
    if (newGoalData.description && newGoalData.description.length > 0 && newGoalData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Convert date to ISO datetime string and ensure description meets requirements
      const goalDataToSend = {
        ...newGoalData,
        dueDate: newGoalData.dueDate ? new Date(newGoalData.dueDate).toISOString() : '',
        // Ensure description is either empty (will be removed) or meets minimum length
        description: newGoalData.description && newGoalData.description.length >= 10 ? newGoalData.description : '',
      };
      
      // Remove empty description if not provided
      if (!goalDataToSend.description) {
        delete goalDataToSend.description;
      }
      
      const response = await fetch('/api/v1/supervisor/performance-goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalDataToSend),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPerformanceGoals();
      setNewGoalDialogOpen(false);
      setNewGoalData({
        userId: '',
        title: '',
        description: '',
        targetValue: 0,
        currentValue: 0,
        unit: 'count',
        dueDate: '',
        status: 'ACTIVE',
        priority: 'MEDIUM'
      });
    } catch (err) {
      console.error('Error creating goal:', err);
      setError('Failed to create goal. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !editGoalData.title) return;
    
    // Validate description length if provided
    if (editGoalData.description && editGoalData.description.length > 0 && editGoalData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Convert date to ISO datetime string if present and ensure description meets requirements
      const goalDataToSend = {
        ...editGoalData,
        dueDate: editGoalData.dueDate ? new Date(editGoalData.dueDate).toISOString() : undefined,
        // Ensure description is either undefined (won't be updated) or meets minimum length
        description: editGoalData.description && editGoalData.description.length >= 10 ? editGoalData.description : undefined,
      };
      
      // Remove undefined fields
      Object.keys(goalDataToSend).forEach(key => {
        if (goalDataToSend[key] === undefined) {
          delete goalDataToSend[key];
        }
      });
      
      const response = await fetch(`/api/v1/supervisor/performance-goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalDataToSend),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPerformanceGoals();
      setEditGoalDialogOpen(false);
      setEditGoalData({});
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update goal. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNewGoalOpen = () => {
    setNewGoalDialogOpen(true);
    fetchUsers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACHIEVED': return 'success';
      case 'ACTIVE': return 'primary';
      case 'MISSED': return 'error';
      case 'PAUSED': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'hours') {
      return `${value.toFixed(1)}h`;
    } else if (unit === 'rating') {
      return `${value.toFixed(1)}/5`;
    } else {
      return Math.round(value).toString();
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACHIEVED': return <CheckCircleIcon color="success" />;
      case 'MISSED': return <WarningIcon color="error" />;
      case 'ACTIVE': return <TrendingUpIcon color="primary" />;
      default: return <ScheduleIcon color="warning" />;
    }
  };

  // Summary calculations
  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
  const achievedGoals = goals.filter(g => g.status === 'ACHIEVED').length;
  const missedGoals = goals.filter(g => g.status === 'MISSED').length;
  const overdueGoals = goals.filter(g => 
    g.status === 'ACTIVE' && getDaysUntilDue(g.dueDate) < 0
  ).length;

  if (loading && goals.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-performance-goals-page">
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Performance Goals Management
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Goals
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {activeGoals}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TrendingUpIcon />
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
                    Achieved Goals
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {achievedGoals}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
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
                    Missed Goals
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {missedGoals}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningIcon />
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
                    Overdue Goals
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {overdueGoals}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ScheduleIcon />
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
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="ACHIEVED">Achieved</MenuItem>
            <MenuItem value="MISSED">Missed</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            onClick={fetchPerformanceGoals}
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
          <Button color="inherit" size="small" onClick={fetchPerformanceGoals}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Goals Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Goal</TableCell>
                <TableCell align="center">Progress</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goals.map((goal) => {
                const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
                const daysUntilDue = getDaysUntilDue(goal.dueDate);
                
                return (
                  <TableRow key={goal.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {goal.user?.name || goal.user?.email || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {goal.user?.role || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {goal.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Target: {formatValue(goal.targetValue, goal.unit)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box width="100%" minWidth={120}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">
                            {formatValue(goal.currentValue, goal.unit)}
                          </Typography>
                          <Typography variant="body2">
                            {progress.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={goal.status === 'ACHIEVED' ? 'success' : 'primary'}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        {getStatusIcon(goal.status)}
                        <Chip
                          size="small"
                          label={goal.status}
                          color={getStatusColor(goal.status) as any}
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={goal.priority}
                        color={getPriorityColor(goal.priority) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </Typography>
                        {daysUntilDue < 0 ? (
                          <Typography variant="caption" color="error.main">
                            {Math.abs(daysUntilDue)} days overdue
                          </Typography>
                        ) : daysUntilDue <= 7 ? (
                          <Typography variant="caption" color="warning.main">
                            {daysUntilDue} days left
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {daysUntilDue} days left
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(goal)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Goal">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add goal"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleNewGoalOpen}
      >
        <AddIcon />
      </Fab>

      {/* Goal Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Performance Goal Details
            </Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedGoal && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedGoal.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {selectedGoal.description}
                    </Typography>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressPercentage(selectedGoal.currentValue, selectedGoal.targetValue)}
                        sx={{ height: 12, borderRadius: 1, mb: 1 }}
                      />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          Current: {formatValue(selectedGoal.currentValue, selectedGoal.unit)}
                        </Typography>
                        <Typography variant="body2">
                          Target: {formatValue(selectedGoal.targetValue, selectedGoal.unit)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Goal Information
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Employee:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedGoal.user?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip
                        size="small"
                        label={selectedGoal.status}
                        color={getStatusColor(selectedGoal.status) as any}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Priority:</Typography>
                      <Chip
                        size="small"
                        label={selectedGoal.priority}
                        color={getPriorityColor(selectedGoal.priority) as any}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Due Date:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Date(selectedGoal.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Created:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Date(selectedGoal.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistics
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Progress:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {getProgressPercentage(selectedGoal.currentValue, selectedGoal.targetValue).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Days Until Due:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getDaysUntilDue(selectedGoal.dueDate) < 0 ? 'error.main' : 'text.primary'}
                      >
                        {getDaysUntilDue(selectedGoal.dueDate)} days
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Supervisor:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedGoal.supervisor?.name || 'Unknown'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setDetailDialogOpen(false);
              selectedGoal && handleEditGoal(selectedGoal);
            }}
          >
            Edit Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog
        open={editGoalDialogOpen}
        onClose={() => setEditGoalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Edit Performance Goal
            </Typography>
            <IconButton onClick={() => setEditGoalDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Goal Title"
                  fullWidth
                  value={editGoalData.title || ''}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description (optional, min 10 characters)"
                  multiline
                  rows={3}
                  fullWidth
                  value={editGoalData.description || ''}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the performance goal (leave empty or enter at least 10 characters)..."
                  error={(editGoalData.description?.length || 0) > 0 && (editGoalData.description?.length || 0) < 10}
                  helperText={(editGoalData.description?.length || 0) > 0 && (editGoalData.description?.length || 0) < 10 ? 
                    `${10 - (editGoalData.description?.length || 0)} more characters needed` : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Value"
                  type="number"
                  fullWidth
                  value={editGoalData.targetValue || 0}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Value"
                  type="number"
                  fullWidth
                  value={editGoalData.currentValue || 0}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Unit"
                  fullWidth
                  value={editGoalData.unit || 'count'}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="hours">Hours</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={editGoalData.dueDate || ''}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, dueDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={editGoalData.status || 'ACTIVE'}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ACHIEVED">Achieved</MenuItem>
                  <MenuItem value="MISSED">Missed</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={editGoalData.priority || 'MEDIUM'}
                  onChange={(e) => setEditGoalData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditGoalDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateGoal}
            disabled={!editGoalData.title || submitLoading || 
              ((editGoalData.description?.length || 0) > 0 && (editGoalData.description?.length || 0) < 10)}
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Update Goal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Goal Dialog */}
      <Dialog
        open={newGoalDialogOpen}
        onClose={() => setNewGoalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Create New Performance Goal
            </Typography>
            <IconButton onClick={() => setNewGoalDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Select Employee"
                  fullWidth
                  value={newGoalData.userId}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, userId: e.target.value }))}
                  required
                >
                  <MenuItem value="">Select an employee...</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Goal Title"
                  fullWidth
                  value={newGoalData.title}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g., Improve customer satisfaction rating"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description (optional, min 10 characters)"
                  multiline
                  rows={3}
                  fullWidth
                  value={newGoalData.description}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the performance goal in detail (leave empty or enter at least 10 characters)..."
                  error={newGoalData.description.length > 0 && newGoalData.description.length < 10}
                  helperText={newGoalData.description.length > 0 && newGoalData.description.length < 10 ? 
                    `${10 - newGoalData.description.length} more characters needed` : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Value"
                  type="number"
                  fullWidth
                  value={newGoalData.targetValue}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                  required
                  placeholder="100"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Value"
                  type="number"
                  fullWidth
                  value={newGoalData.currentValue}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Unit"
                  fullWidth
                  value={newGoalData.unit}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="hours">Hours</MenuItem>
                  <MenuItem value="rating">Rating (1-5)</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={newGoalData.dueDate}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, dueDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={newGoalData.priority}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={newGoalData.status}
                  onChange={(e) => setNewGoalData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setNewGoalDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateGoal}
            disabled={!newGoalData.userId || !newGoalData.title || !newGoalData.dueDate || 
              (newGoalData.description.length > 0 && newGoalData.description.length < 10) || submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Create Goal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceGoalsPage;