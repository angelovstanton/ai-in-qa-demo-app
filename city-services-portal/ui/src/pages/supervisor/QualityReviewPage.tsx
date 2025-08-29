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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

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

  const fetchQualityReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(statusFilter && { status: statusFilter }),
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
    </Box>
  );
};

export default QualityReviewPage;