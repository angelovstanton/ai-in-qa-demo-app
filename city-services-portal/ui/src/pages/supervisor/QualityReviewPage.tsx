import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Autocomplete, Slider } from '@mui/material';

interface QualityReview {
  id: string;
  requestId: string;
  reviewerId: string;
  qualityScore: number;
  communicationScore: number;
  technicalAccuracyScore: number;
  timelinessScore: number;
  citizenSatisfactionScore: number;
  improvementSuggestions?: string;
  followUpRequired: boolean;
  calibrationSession?: string;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    createdBy: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const QualityReviewPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<QualityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState<QualityReview | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newReviewDialogOpen, setNewReviewDialogOpen] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    requestId: '',
    qualityScore: 8,
    communicationScore: 8,
    technicalAccuracyScore: 8,
    timelinessScore: 8,
    citizenSatisfactionScore: 8,
    improvementSuggestions: '',
    followUpRequired: false,
    calibrationSession: '',
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [reviewedRequestIds, setReviewedRequestIds] = useState<Set<string>>(new Set());
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchQualityReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        size: rowsPerPage.toString(),
        ...(statusFilter && { reviewStatus: statusFilter }),
      });

      const response = await fetch(`/api/v1/supervisor/quality-reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReviews(data.data);
      setTotalCount(data.pagination?.totalCount || data.data.length);
    } catch (err) {
      console.error('Error fetching quality reviews:', err);
      setError('Failed to load quality reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Get current user info to determine department
      const meResponse = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      let userDepartment = null;
      let userRole = null;
      if (meResponse.ok) {
        const meData = await meResponse.json();
        userDepartment = meData.user?.department;
        userRole = meData.user?.role;
        console.log('User department:', userDepartment?.name, 'Slug:', userDepartment?.slug, 'Role:', userRole);
      }
      
      // Fetch resolved requests - for supervisors, filter by their department
      let requestUrl = '/api/v1/requests?status=RESOLVED&size=50';
      
      // Only filter by department for SUPERVISOR role (not ADMIN)
      if (userRole === 'SUPERVISOR' && userDepartment?.slug) {
        requestUrl += `&department=${userDepartment.slug}`;
        console.log('Filtering requests by department slug:', userDepartment.slug);
      }
      
      const requestsResponse = await fetch(requestUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (requestsResponse.ok) {
        const data = await requestsResponse.json();
        setRequests(data.data || []);
        console.log(`Fetched ${data.data?.length || 0} resolved requests`);
        
        // Log department info for debugging
        if (data.data?.length > 0) {
          console.log('First request department:', data.data[0].department);
        }
      }
      
      // Fetch existing reviews to mark already reviewed requests
      const reviewsResponse = await fetch('/api/v1/supervisor/quality-reviews?size=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const reviewedIds = new Set(reviewsData.data.map((review: any) => review.requestId));
        setReviewedRequestIds(reviewedIds);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const handleNewReview = () => {
    setNewReviewDialogOpen(true);
    fetchRequests();
  };

  const handleSubmitNewReview = async () => {
    if (!newReviewData.requestId) return;

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/supervisor/quality-reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReviewData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 409) {
          // Review already exists
          setError('You have already reviewed this request. Please select a different request.');
          // Don't close the dialog so user can select a different request
          setSubmitLoading(false);
          return;
        } else if (response.status === 403) {
          // Forbidden - likely department mismatch or role issue
          const errorMessage = errorData?.error?.message || 'Access denied. You may not have permission to review this request.';
          console.error('403 Error details:', errorData);
          setError(errorMessage);
          setSubmitLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the reviews list
      await fetchQualityReviews();
      setNewReviewDialogOpen(false);
      
      // Reset form
      setNewReviewData({
        requestId: '',
        qualityScore: 8,
        communicationScore: 8,
        technicalAccuracyScore: 8,
        timelinessScore: 8,
        citizenSatisfactionScore: 8,
        improvementSuggestions: '',
        followUpRequired: false,
        calibrationSession: '',
      });
      
      setError(null); // Clear any previous errors
      
    } catch (err) {
      console.error('Error creating review:', err);
      setError('Failed to create review. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityReviews();
  }, [page, rowsPerPage, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (review: QualityReview) => {
    setSelectedReview(review);
    setDetailDialogOpen(true);
  };

  const handleEditReview = (review: QualityReview) => {
    setSelectedReview(review);
    setEditDialogOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getOverallScore = (review: QualityReview) => {
    return (
      review.qualityScore + 
      review.communicationScore + 
      review.technicalAccuracyScore + 
      review.timelinessScore + 
      review.citizenSatisfactionScore
    ) / 5;
  };

  if (loading && reviews.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-quality-review-page">
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Quality Reviews
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={handleNewReview}
        >
          New Review
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Reviews
              </Typography>
              <Typography variant="h4">
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Average Quality
              </Typography>
              <Typography variant="h4">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + getOverallScore(r), 0) / reviews.length).toFixed(1)
                  : '0.0'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Follow-ups Required
              </Typography>
              <Typography variant="h4" color="warning.main">
                {reviews.filter(r => r.followUpRequired).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending Reviews
              </Typography>
              <Typography variant="h4" color="error.main">
                {reviews.filter(r => r.reviewStatus === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Review Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            onClick={fetchQualityReviews}
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
          <Button color="inherit" size="small" onClick={fetchQualityReviews}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Reviews Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell align="center">Overall Score</TableCell>
                <TableCell align="center">Quality</TableCell>
                <TableCell align="center">Communication</TableCell>
                <TableCell align="center">Technical</TableCell>
                <TableCell align="center">Timeliness</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Follow-up</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {review.request?.code || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {review.request?.title || 'No title'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {review.reviewer?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Rating
                        value={getOverallScore(review) / 2}
                        readOnly
                        size="small"
                        precision={0.1}
                      />
                      <Typography variant="caption">
                        {getOverallScore(review).toFixed(1)}/10
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={review.qualityScore.toFixed(1)}
                      color={getScoreColor(review.qualityScore) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={review.communicationScore.toFixed(1)}
                      color={getScoreColor(review.communicationScore) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={review.technicalAccuracyScore.toFixed(1)}
                      color={getScoreColor(review.technicalAccuracyScore) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={review.timelinessScore.toFixed(1)}
                      color={getScoreColor(review.timelinessScore) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={review.reviewStatus}
                      color={review.reviewStatus === 'COMPLETED' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    {review.followUpRequired ? (
                      <Chip size="small" label="Required" color="warning" />
                    ) : (
                      <Chip size="small" label="None" color="success" variant="outlined" />
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(review)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Review">
                        <IconButton
                          size="small"
                          onClick={() => handleEditReview(review)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
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

      {/* Review Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Quality Review Details
            </Typography>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedReview && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Request Information
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Request Code:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedReview.request?.code || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Title:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedReview.request?.title || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip
                        size="small"
                        label={selectedReview.request?.status || 'Unknown'}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quality Scores
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Score
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Rating
                          value={getOverallScore(selectedReview) / 2}
                          readOnly
                          size="small"
                          precision={0.1}
                        />
                        <Typography variant="h6" ml={1}>
                          {getOverallScore(selectedReview).toFixed(1)}/10
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Quality:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedReview.qualityScore}/10
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Communication:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedReview.communicationScore}/10
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Technical Accuracy:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedReview.technicalAccuracyScore}/10
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Timeliness:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedReview.timelinessScore}/10
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Citizen Satisfaction:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedReview.citizenSatisfactionScore}/10
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
                      Review Details
                    </Typography>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Reviewer
                      </Typography>
                      <Typography variant="body2">
                        {selectedReview.reviewer?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Review Status
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedReview.reviewStatus}
                        color={selectedReview.reviewStatus === 'COMPLETED' ? 'success' : 'warning'}
                      />
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Follow-up Required
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedReview.followUpRequired ? 'Yes' : 'No'}
                        color={selectedReview.followUpRequired ? 'warning' : 'success'}
                      />
                    </Box>
                    
                    {selectedReview.calibrationSession && (
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Calibration Session
                        </Typography>
                        <Typography variant="body2">
                          {selectedReview.calibrationSession}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {selectedReview.improvementSuggestions && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Improvement Suggestions
                      </Typography>
                      <Typography variant="body2">
                        {selectedReview.improvementSuggestions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
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
              selectedReview && handleEditReview(selectedReview);
            }}
          >
            Edit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog Placeholder */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Quality Review</DialogTitle>
        <DialogContent>
          <Typography>
            Edit functionality will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Review Dialog */}
      <Dialog
        open={newReviewDialogOpen}
        onClose={() => setNewReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Create New Quality Review
            </Typography>
            <Button onClick={() => setNewReviewDialogOpen(false)}>
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Request Selection */}
            <Box mb={3}>
              <Autocomplete
                options={requests}
                getOptionLabel={(option) => {
                  const isReviewed = reviewedRequestIds.has(option.id);
                  return `${option.code} - ${option.title}${isReviewed ? ' (Already Reviewed)' : ''}`;
                }}
                value={requests.find(r => r.id === newReviewData.requestId) || null}
                onChange={(event, newValue) => {
                  // Show warning if selecting already reviewed request
                  if (newValue && reviewedRequestIds.has(newValue.id)) {
                    setError('Warning: You have already reviewed this request. Submitting will fail.');
                  } else {
                    setError(null);
                  }
                  setNewReviewData(prev => ({ ...prev, requestId: newValue?.id || '' }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Request for Review" required />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  const isReviewed = reviewedRequestIds.has(option.id);
                  return (
                    <li key={key} {...otherProps} style={{ opacity: isReviewed ? 0.5 : 1 }}>
                      <Box>
                        <Typography variant="body2" component="div">
                          {option.code} {isReviewed && <Chip label="Already Reviewed" size="small" color="warning" sx={{ ml: 1 }} />}
                        </Typography>
                        <Typography variant="caption" component="div" color="text.secondary">
                          {option.title} - Status: {option.status}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* Error Message */}
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Scores Section */}
            <Typography variant="h6" gutterBottom>
              Quality Scores (1-10)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Quality Score: {newReviewData.qualityScore}</Typography>
                <Slider
                  value={newReviewData.qualityScore}
                  onChange={(e, value) => setNewReviewData(prev => ({ ...prev, qualityScore: value as number }))}
                  min={1}
                  max={10}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Communication Score: {newReviewData.communicationScore}</Typography>
                <Slider
                  value={newReviewData.communicationScore}
                  onChange={(e, value) => setNewReviewData(prev => ({ ...prev, communicationScore: value as number }))}
                  min={1}
                  max={10}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Technical Accuracy: {newReviewData.technicalAccuracyScore}</Typography>
                <Slider
                  value={newReviewData.technicalAccuracyScore}
                  onChange={(e, value) => setNewReviewData(prev => ({ ...prev, technicalAccuracyScore: value as number }))}
                  min={1}
                  max={10}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Timeliness Score: {newReviewData.timelinessScore}</Typography>
                <Slider
                  value={newReviewData.timelinessScore}
                  onChange={(e, value) => setNewReviewData(prev => ({ ...prev, timelinessScore: value as number }))}
                  min={1}
                  max={10}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Citizen Satisfaction: {newReviewData.citizenSatisfactionScore}</Typography>
                <Slider
                  value={newReviewData.citizenSatisfactionScore}
                  onChange={(e, value) => setNewReviewData(prev => ({ ...prev, citizenSatisfactionScore: value as number }))}
                  min={1}
                  max={10}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Additional Fields */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Improvement Suggestions"
                  multiline
                  rows={4}
                  fullWidth
                  value={newReviewData.improvementSuggestions}
                  onChange={(e) => setNewReviewData(prev => ({ ...prev, improvementSuggestions: e.target.value }))}
                  placeholder="Provide specific feedback and suggestions for improvement..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Calibration Session"
                  fullWidth
                  value={newReviewData.calibrationSession}
                  onChange={(e) => setNewReviewData(prev => ({ ...prev, calibrationSession: e.target.value }))}
                  placeholder="Optional calibration session reference"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" height="100%">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newReviewData.followUpRequired}
                        onChange={(e) => setNewReviewData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                      />
                    }
                    label="Follow-up Required"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setNewReviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitNewReview}
            disabled={!newReviewData.requestId || submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Create Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityReviewPage;