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
  Avatar,
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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface StaffPerformance {
  id: string;
  userId: string;
  departmentId: string;
  performancePeriod: string;
  averageHandlingTime: number;
  completedRequests: number;
  qualityScore: number;
  citizenSatisfactionRating: number;
  overtimeHours: number;
  productivityScore: number;
  goalsAchieved: number;
  goalsMissed: number;
  trainingHoursCompleted: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  department: {
    id: string;
    name: string;
    slug: string;
  };
}

const StaffPerformancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('qualityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'performance' | 'leaderboard'>('performance');

  const fetchStaffPerformance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        size: rowsPerPage.toString(),
        sort: `${sortBy}:${sortOrder}`,
        ...(periodFilter && { performancePeriod: periodFilter }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/v1/supervisor/staff-performance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPerformanceData(data.data);
      setTotalCount(data.pagination?.totalCount || data.data.length);
    } catch (err) {
      console.error('Error fetching staff performance:', err);
      setError('Failed to load staff performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    
    if (mode === 'leaderboard') {
      setViewMode('leaderboard');
      setSortBy('productivityScore');
      setSortOrder('desc');
      setRowsPerPage(20); // Show more for leaderboard
    } else if (mode === 'performance') {
      setViewMode('performance');
      setSortBy('qualityScore');
      setSortOrder('desc');
    }
    
    if (sort) setSortBy(sort);
    if (order === 'asc' || order === 'desc') setSortOrder(order);
  }, [location.search]);

  useEffect(() => {
    fetchStaffPerformance();
  }, [page, rowsPerPage, periodFilter, roleFilter, sortBy, sortOrder]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (staff: StaffPerformance) => {
    setSelectedStaff(staff);
    setDetailDialogOpen(true);
  };

  const getPerformanceColor = (score: number, type: 'quality' | 'satisfaction' | 'productivity') => {
    const thresholds = {
      quality: { good: 8, fair: 6 },
      satisfaction: { good: 4, fair: 3 },
      productivity: { good: 80, fair: 60 }
    };
    
    const threshold = thresholds[type];
    if (score >= threshold.good) return 'success';
    if (score >= threshold.fair) return 'warning';
    return 'error';
  };

  const formatPeriod = (period: string) => {
    // Format period strings like "2024-Q3" to "Q3 2024"
    if (period.includes('-Q')) {
      const [year, quarter] = period.split('-');
      return `${quarter} ${year}`;
    }
    // Format period strings like "2024-09" to "September 2024"
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return period;
  };

  if (loading && performanceData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-staff-performance-page">
      <Typography variant="h4" component="h1" gutterBottom>
        {viewMode === 'leaderboard' ? 'Team Performance Leaderboard' : 'Staff Performance Management'}
      </Typography>
      {viewMode === 'leaderboard' && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Top performers ranked by productivity score and overall performance metrics
        </Typography>
      )}

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Performance Period"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Periods</MenuItem>
            <MenuItem value="2024-Q4">Q4 2024</MenuItem>
            <MenuItem value="2024-Q3">Q3 2024</MenuItem>
            <MenuItem value="2024-Q2">Q2 2024</MenuItem>
            <MenuItem value="2024-Q1">Q1 2024</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="CLERK">Clerk</MenuItem>
            <MenuItem value="FIELD_AGENT">Field Agent</MenuItem>
            <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="qualityScore">Quality Score</MenuItem>
            <MenuItem value="productivityScore">Productivity Score</MenuItem>
            <MenuItem value="citizenSatisfactionRating">Citizen Satisfaction</MenuItem>
            <MenuItem value="completedRequests">Completed Requests</MenuItem>
            <MenuItem value="averageHandlingTime">Avg Handling Time</MenuItem>
            <MenuItem value="performancePeriod">Performance Period</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            select
            label="Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="desc">High to Low</MenuItem>
            <MenuItem value="asc">Low to High</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Button
            variant="outlined"
            onClick={fetchStaffPerformance}
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
          <Button color="inherit" size="small" onClick={fetchStaffPerformance}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Performance Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="center">Quality Score</TableCell>
                <TableCell align="center">Satisfaction</TableCell>
                <TableCell align="center">Productivity</TableCell>
                <TableCell align="center">Completed Requests</TableCell>
                <TableCell align="center">Goals</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {performanceData.map((performance) => (
                <TableRow 
                  key={performance.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewDetails(performance)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {performance.user.name || performance.user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {performance.user.role}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatPeriod(performance.performancePeriod)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Chip
                        size="small"
                        label={performance.qualityScore.toFixed(1)}
                        color={getPerformanceColor(performance.qualityScore, 'quality') as any}
                        variant="outlined"
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(performance.qualityScore * 10, 100)}
                        sx={{ mt: 1, height: 4 }}
                        color={getPerformanceColor(performance.qualityScore, 'quality') as any}
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Chip
                        size="small"
                        label={performance.citizenSatisfactionRating.toFixed(1)}
                        color={getPerformanceColor(performance.citizenSatisfactionRating, 'satisfaction') as any}
                        variant="outlined"
                      />
                      <LinearProgress
                        variant="determinate"
                        value={performance.citizenSatisfactionRating * 20}
                        sx={{ mt: 1, height: 4 }}
                        color={getPerformanceColor(performance.citizenSatisfactionRating, 'satisfaction') as any}
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2">
                        {performance.productivityScore.toFixed(0)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={performance.productivityScore}
                        sx={{ mt: 1, height: 4 }}
                        color={getPerformanceColor(performance.productivityScore, 'productivity') as any}
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="h6">
                      {performance.completedRequests}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" color="success.main">
                        ✓ {performance.goalsAchieved}
                      </Typography>
                      {performance.goalsMissed > 0 && (
                        <Typography variant="body2" color="error.main">
                          ✗ {performance.goalsMissed}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(performance)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* Staff Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Performance Details: {selectedStaff?.user.name}
            </Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedStaff && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Quality Score
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(selectedStaff.qualityScore * 10, 100)}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h4">
                        {selectedStaff.qualityScore.toFixed(1)}/10
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Citizen Satisfaction
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedStaff.citizenSatisfactionRating * 20}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h4">
                        {selectedStaff.citizenSatisfactionRating.toFixed(1)}/5
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Productivity Score
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedStaff.productivityScore}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h4">
                        {selectedStaff.productivityScore.toFixed(0)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Work Statistics
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Completed Requests:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedStaff.completedRequests}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Avg Handling Time:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedStaff.averageHandlingTime} min
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Overtime Hours:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedStaff.overtimeHours.toFixed(1)}h
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Goals Achieved:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {selectedStaff.goalsAchieved}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Goals Missed:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {selectedStaff.goalsMissed}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Training Hours:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedStaff.trainingHoursCompleted}h
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
              navigate(`/supervisor/staff-performance/report/${selectedStaff?.userId}`, { 
                state: { staffMember: selectedStaff } 
              });
            }}
          >
            View Full Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffPerformancePage;