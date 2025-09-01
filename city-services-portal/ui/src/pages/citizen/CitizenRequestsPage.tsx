import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/DataTable';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { ServiceRequest } from '../../types';
import { createCitizenRequestColumns, categoryLabels } from '../../config/citizenRequestColumns';
import api from '../../lib/api';

const CitizenRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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


  // Convert sort model to API format
  const sortParam = sortModel.length > 0 
    ? `${sortModel[0].field}:${sortModel[0].sort}`
    : 'id:desc';

  const { data, loading, error, totalCount, refetch } = useServiceRequests({
    page: paginationModel.page + 1, // API is 1-based
    pageSize: paginationModel.pageSize,
    sort: sortParam,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    priority: priorityFilter || undefined,
    text: searchTerm || undefined,
  });

  const handleViewRequest = useCallback((requestId: string) => {
    navigate(`/request/${requestId}`);
  }, [navigate]);

  const handleUpvote = useCallback(async (requestId: string) => {
    try {
      await api.post(`/service-requests/${requestId}/upvote`);
      refetch();
    } catch (error) {
      console.error('Failed to upvote request:', error);
    }
  }, [refetch]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setDateFromFilter(null);
    setDateToFilter(null);
    setResolvedFilter('');
  };

  const handleRowClick = useCallback((params: any) => {
    navigate(`/request/${params.row.id}`);
  }, [navigate]);

  const hasActiveFilters = searchTerm || statusFilter || categoryFilter || 
    priorityFilter || dateFromFilter || dateToFilter || resolvedFilter;

  // Use unified column definitions
  const columns = useMemo(() => 
    createCitizenRequestColumns({
      isMyRequests: true,
      userId: user?.id,
      onViewRequest: handleViewRequest,
      onUpvote: handleUpvote
    }), [user?.id, handleViewRequest, handleUpvote]
  );

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