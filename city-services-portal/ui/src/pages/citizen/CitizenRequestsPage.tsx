import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { ServiceRequest } from '../../types';

const CitizenRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  // Enhanced filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);
  const [resolvedFilter, setResolvedFilter] = useState('');

  const categories = [
    'roads-transportation',
    'street-lighting',
    'waste-management',
    'water-sewer',
    'parks-recreation',
    'public-safety',
    'building-permits',
    'snow-removal',
    'traffic-signals',
    'sidewalk-maintenance',
    'tree-services',
    'noise-complaints',
    'animal-control',
    'other'
  ];

  const categoryLabels: Record<string, string> = {
    'roads-transportation': 'Roads and Transportation',
    'street-lighting': 'Street Lighting',
    'waste-management': 'Waste Management',
    'water-sewer': 'Water and Sewer',
    'parks-recreation': 'Parks and Recreation',
    'public-safety': 'Public Safety',
    'building-permits': 'Building and Permits',
    'snow-removal': 'Snow Removal',
    'traffic-signals': 'Traffic Signals',
    'sidewalk-maintenance': 'Sidewalk Maintenance',
    'tree-services': 'Tree Services',
    'noise-complaints': 'Noise Complaints',
    'animal-control': 'Animal Control',
    'other': 'Other'
  };

  // Convert sort model to API format
  const sortParam = sortModel.length > 0 
    ? `${sortModel[0].field}:${sortModel[0].sort}`
    : 'createdAt:desc';

  const { data, loading, error, totalCount } = useServiceRequests({
    page: paginationModel.page + 1, // API uses 1-based indexing
    pageSize: paginationModel.pageSize,
    sort: sortParam,
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
  });

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
        return 'default';
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
        return 'default';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewRequest = (requestId: string) => {
    navigate(`/request/${requestId}`);
  };

  const handleCreateNew = () => {
    navigate('/citizen/requests/new');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setDateFromFilter(null);
    setDateToFilter(null);
    setResolvedFilter('');
  };

  const hasActiveFilters = () => {
    return searchTerm || statusFilter || categoryFilter || priorityFilter || 
           dateFromFilter || dateToFilter || resolvedFilter;
  };

  // Add new columns for the required fields: Date of Request, Upvotes, Comments, Resolved Status, and Correspondence History
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Request ID',
      width: 150,
      filterable: true,
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 250,
      filterable: true,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 180,
      filterable: true,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value) as any}
          size="small"
          data-testid={`cs-requests-priority-${params.row.id}`}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ')}
          color={getStatusColor(params.value) as any}
          size="small"
          variant="outlined"
          data-testid={`cs-requests-status-${params.row.id}`}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      filterable: true,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 150,
      filterable: true,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'dateOfRequest',
      headerName: 'Date of Request',
      width: 150,
      filterable: true,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
      renderCell: (params) => (
        <Typography data-testid={`cs-requests-date-${params.row.id}`}>
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'upvotes',
      headerName: 'Upvotes',
      width: 100,
      filterable: false,
      renderCell: (params) => (
        <Typography data-testid={`cs-requests-upvotes-${params.row.id}`}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'comments',
      headerName: 'Comments',
      width: 120,
      filterable: false,
      renderCell: (params) => (
        <Typography data-testid={`cs-requests-comments-${params.row.id}`}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'resolvedStatus',
      headerName: 'Resolved Status',
      width: 150,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Resolved' : 'Unresolved'}
          color={params.value ? 'success' : 'default'}
          size="small"
          data-testid={`cs-requests-resolved-${params.row.id}`}
        />
      ),
    },
    {
      field: 'correspondenceHistory',
      headerName: 'Correspondence History',
      width: 200,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleViewRequest(params.row.id)}
          data-testid={`cs-requests-history-${params.row.id}`}
        >
          View History
        </Button>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleViewRequest(params.row.id)}
          data-testid={`cs-requests-view-${params.row.id}`}
          title="View request details"
        >
          <ViewIcon />
        </IconButton>
      ),
    },
  ];

  // Update rows to include the new fields
  const rows = data.map((request: ServiceRequest) => ({
    id: request.id,
    code: request.code,
    title: request.title,
    category: request.category,
    priority: request.priority,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    dateOfRequest: request.dateOfRequest,
    upvotes: request.upvotes,
    comments: request.comments,
    resolvedStatus: request.resolvedStatus,
    correspondenceHistory: request.correspondenceHistory,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box data-testid="cs-citizen-requests-page">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Service Requests
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            data-testid="cs-requests-create-button"
          >
            Create New Request
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-requests-error">
            {error}
          </Alert>
        )}

        {/* Enhanced Filters */}
        <Card sx={{ mb: 3 }} data-testid="cs-requests-filters">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
              {hasActiveFilters() && (
                <Button
                  size="small"
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                  sx={{ ml: 'auto' }}
                  data-testid="cs-requests-clear-filters"
                >
                  Clear All Filters
                </Button>
              )}
            </Box>
            
            <Grid container spacing={2}>
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search requests"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  data-testid="cs-requests-search"
                />
              </Grid>
              
              {/* Status Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    data-testid="cs-requests-status-filter"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="SUBMITTED">Submitted</MenuItem>
                    <MenuItem value="TRIAGED">Triaged</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="WAITING_ON_CITIZEN">Waiting on Citizen</MenuItem>
                    <MenuItem value="PENDING_MORE_INFO">Pending More Info</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Category Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    data-testid="cs-requests-category-filter"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {categoryLabels[category]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Priority Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    data-testid="cs-requests-priority-filter"
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Resolved Status Filter */}
              <Grid item xs={12} md={1}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resolved</InputLabel>
                  <Select
                    value={resolvedFilter}
                    label="Resolved"
                    onChange={(e) => setResolvedFilter(e.target.value)}
                    data-testid="cs-requests-resolved-filter"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Resolved</MenuItem>
                    <MenuItem value="false">Unresolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Date Range Filters */}
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="From Date"
                  value={dateFromFilter}
                  onChange={setDateFromFilter}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="To Date"
                  value={dateToFilter}
                  onChange={setDateToFilter}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={totalCount}
          page={paginationModel.page}
          pageSize={paginationModel.pageSize}
          sortModel={sortModel}
          filterModel={filterModel}
          onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel}
          onFilterModelChange={setFilterModel}
          testId="cs-citizen-requests-grid"
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CitizenRequestsPage;