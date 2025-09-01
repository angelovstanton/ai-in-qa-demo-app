import React, { useState, useCallback, useMemo } from 'react';
import { createCitizenRequestColumns } from '../config/citizenRequestColumns';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { DataGrid, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useServiceRequests } from '../hooks/useServiceRequests';
import { ServiceRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const AllRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'id', sort: 'desc' },
  ]);

  // Convert sort model to API format
  const sortParam = sortModel.length > 0 
    ? `${sortModel[0].field}:${sortModel[0].sort}`
    : 'id:desc';

  // Fetch all requests (not filtered by user for citizens)
  const { data: requests, loading, error, refetch, totalCount } = useServiceRequests({
    page: paginationModel.page + 1, // API is 1-based
    pageSize: paginationModel.pageSize,
    sort: sortParam,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    text: searchText || undefined,
    // Don't filter by createdBy - show all requests
    showAll: true,
  });

  const handleUpvote = useCallback(async (requestId: string) => {
    try {
      await api.post(`/requests/${requestId}/upvote`);
      refetch(); // Refresh data after upvoting
    } catch (error) {
      console.error('Failed to upvote request:', error);
    }
  }, [refetch]);

  const handleViewRequest = useCallback((requestId: string) => {
    navigate(`/request/${requestId}`);
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSearchText('');
  }, []);

  const hasActiveFilters = statusFilter || priorityFilter || categoryFilter || searchText;

  // Use unified column definitions
  const columns = useMemo(() => 
    createCitizenRequestColumns({
      isMyRequests: false,
      userId: user?.id,
      onViewRequest: handleViewRequest,
      onUpvote: handleUpvote
    }), [user?.id, handleViewRequest, handleUpvote]
  );


  const rows = useMemo(() => {
    return (requests || []).map((request: ServiceRequest) => ({
      id: request.id,
      code: request.code,
      title: request.title,
      category: request.category,
      priority: request.priority,
      status: request.status,
      creator: request.creator,
      createdAt: request.createdAt,
      upvotes: request.upvotes || 0,
    }));
  }, [requests]);

  return (
    <Box data-testid="cs-all-requests-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          All Service Requests ({totalCount || 0})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          data-testid="cs-refresh-requests"
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search requests..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by title, description, or ID"
                data-testid="cs-search-requests"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  data-testid="cs-filter-status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="WAITING_ON_CITIZEN">Waiting on Citizen</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  data-testid="cs-filter-priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  data-testid="cs-filter-category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="roads-and-infrastructure">Roads & Infrastructure</MenuItem>
                  <MenuItem value="waste-management">Waste Management</MenuItem>
                  <MenuItem value="water-and-utilities">Water & Utilities</MenuItem>
                  <MenuItem value="parks-and-recreation">Parks & Recreation</MenuItem>
                  <MenuItem value="public-safety">Public Safety</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FilterIcon />}
                    onClick={clearFilters}
                    data-testid="cs-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              rowCount={totalCount}
              pageSizeOptions={[10, 25, 50]}
              paginationMode="server"
              sortingMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              disableRowSelectionOnClick
              onRowClick={(params) => handleViewRequest(params.row.id)}
              data-testid="cs-all-requests-grid"
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error" data-testid="cs-requests-error">
            Error loading requests: {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AllRequestsPage;
