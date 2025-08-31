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
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
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
    { field: 'id', sort: 'desc' },
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
    : 'id:desc';

  const { data, loading, error, totalCount } = useServiceRequests({
    page: paginationModel.page + 1, // API is 1-based
    pageSize: paginationModel.pageSize,
    sort: sortParam,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    priority: priorityFilter || undefined,
    text: searchTerm || undefined,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'info';
      case 'TRIAGED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'primary';
      case 'WAITING_ON_CITIZEN':
        return 'warning';
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setDateFromFilter(null);
    setDateToFilter(null);
    setResolvedFilter('');
  };

  const handleRowClick = (params: any) => {
    navigate(`/request/${params.row.id}`);
  };

  const hasActiveFilters = searchTerm || statusFilter || categoryFilter || 
    priorityFilter || dateFromFilter || dateToFilter || resolvedFilter;

  // Column definitions with proper error handling
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Request ID',
      width: 130,
      filterable: true,
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 200,
      filterable: true,
      flex: 1, // Make title column flexible
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 160,
      filterable: true,
      valueGetter: (params) => categoryLabels[params.value] || params.value,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          color={getPriorityColor(params.value) as any}
          size="small"
          data-testid={`cs-requests-priority-${params.row.id}`}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value ? params.value.replace(/_/g, ' ') : 'N/A'}
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
      valueFormatter: (params) => {
        try {
          return params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'N/A';
        } catch {
          return 'Invalid Date';
        }
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 150,
      filterable: true,
      hide: true, // Hidden by default to reduce horizontal scroll
      valueFormatter: (params) => {
        try {
          return params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'N/A';
        } catch {
          return 'Invalid Date';
        }
      },
    },
    {
      field: 'dateOfRequest',
      headerName: 'Date of Request',
      width: 150,
      filterable: true,
      hide: true, // Hidden by default to reduce horizontal scroll
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
      width: 100,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ThumbUpIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value || 0}</Typography>
        </Box>
      ),
    },
    {
      field: 'comments',
      headerName: 'Comments',
      width: 100,
      filterable: false,
      valueGetter: (params) => params.row.comments?.length || 0,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CommentIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value || 0}</Typography>
        </Box>
      ),
    },
    {
      field: 'resolvedStatus',
      headerName: 'Resolved',
      width: 100,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/request/${params.row.id}`);
          }}
          data-testid={`cs-requests-view-${params.row.id}`}
          size="small"
        >
          <ViewIcon />
        </IconButton>
      ),
    },
  ];

  // Transform data for DataGrid with error handling
  const rows = (data || []).map((request: ServiceRequest) => ({
    id: request.id,
    code: request.code || 'N/A',
    title: request.title || 'Untitled',
    category: request.category || 'other',
    priority: request.priority || 'MEDIUM',
    status: request.status || 'DRAFT',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    dateOfRequest: request.dateOfRequest || request.createdAt,
    upvotes: request.upvotes || 0,
    comments: request.comments || [],
    resolvedStatus: request.resolvedStatus || false,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }} data-testid="cs-citizen-requests-page">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Service Requests
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/citizen/requests/new')}
            data-testid="cs-requests-new-button"
          >
            New Request
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-requests-error">
            {error}
          </Alert>
        )}

        {/* Enhanced Filter Panel */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Filters
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  data-testid="cs-requests-clear-filters"
                >
                  Clear All
                </Button>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    data-testid="cs-requests-status-filter"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="SUBMITTED">Submitted</MenuItem>
                    <MenuItem value="TRIAGED">Triaged</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="WAITING_ON_CITIZEN">Waiting on Citizen</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resolved Status</InputLabel>
                  <Select
                    value={resolvedFilter}
                    label="Resolved Status"
                    onChange={(e) => setResolvedFilter(e.target.value)}
                    data-testid="cs-requests-resolved-filter"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Resolved</MenuItem>
                    <MenuItem value="false">Not Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

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
          onRowClick={handleRowClick}
          testId="cs-citizen-requests-grid"
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CitizenRequestsPage;