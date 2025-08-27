import React, { useState, useCallback, useMemo } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
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

  // Fetch all requests (not filtered by user for citizens)
  const { data: requests, loading, error, refetch, totalCount } = useServiceRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    text: searchText || undefined,
    pageSize: 25,
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
    navigate(`/requests/${requestId}`);
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSearchText('');
  }, []);

  const hasActiveFilters = statusFilter || priorityFilter || categoryFilter || searchText;

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'code',
      headerName: 'Request ID',
      width: 130,
      filterable: true,
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      filterable: true,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value?.replace('-', ' ') || 'N/A'} 
          size="small" 
          variant="outlined" 
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => {
        const priority = params.value;
        const color = priority === 'URGENT' ? 'error' : 
                     priority === 'HIGH' ? 'warning' : 
                     priority === 'MEDIUM' ? 'info' : 'default';
        return (
          <Chip 
            label={priority || 'N/A'} 
            size="small" 
            color={color as any}
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value;
        const color = status === 'RESOLVED' ? 'success' : 
                     status === 'IN_PROGRESS' ? 'info' : 
                     status === 'SUBMITTED' ? 'default' : 'secondary';
        return (
          <Chip 
            label={status?.replace('_', ' ') || 'N/A'} 
            size="small" 
            color={color as any}
          />
        );
      },
    },
    {
      field: 'creator',
      headerName: 'Submitted By',
      width: 150,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const creator = params.row.creator;
        return creator ? creator.name : 'Unknown';
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      filterable: true,
      valueFormatter: (params) => {
        try {
          return params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'N/A';
        } catch {
          return 'Invalid Date';
        }
      },
    },
    {
      field: 'upvotes',
      headerName: 'Upvotes',
      width: 80,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption">{params.value || 0}</Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      filterable: false,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewRequest(params.row.id);
              }}
              data-testid={`cs-view-request-${params.row.id}`}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {user?.role === 'CITIZEN' && params.row.creator?.id !== user.id && (
            <Tooltip title="Upvote Request">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpvote(params.row.id);
                }}
                data-testid={`cs-upvote-request-${params.row.id}`}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ], [user, handleViewRequest, handleUpvote]);

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
                  <MenuItem value="roads-transportation">Roads & Transportation</MenuItem>
                  <MenuItem value="street-lighting">Street Lighting</MenuItem>
                  <MenuItem value="waste-management">Waste Management</MenuItem>
                  <MenuItem value="water-sewer">Water & Sewer</MenuItem>
                  <MenuItem value="parks-recreation">Parks & Recreation</MenuItem>
                  <MenuItem value="public-safety">Public Safety</MenuItem>
                  <MenuItem value="building-permits">Building Permits</MenuItem>
                  <MenuItem value="snow-removal">Snow Removal</MenuItem>
                  <MenuItem value="traffic-signals">Traffic Signals</MenuItem>
                  <MenuItem value="tree-services">Tree Services</MenuItem>
                  <MenuItem value="noise-complaints">Noise Complaints</MenuItem>
                  <MenuItem value="animal-control">Animal Control</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
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
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
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
