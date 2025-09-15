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
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { ServiceRequest } from '../../types';
import { createCitizenRequestColumns, getCategoryLabel } from '../../config/citizenRequestColumns';
import { getDataGridLocaleText } from '../../config/dataGridLocale';
import api from '../../lib/api';

const CitizenRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
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
      onUpvote: handleUpvote,
      t
    }), [user?.id, handleViewRequest, handleUpvote, t]
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
            {t('requests:myRequests')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/citizen/requests/new')}
            data-testid="cs-requests-new-button"
          >
            {t('requests:createNew')}
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
                {t('requests:filters.title')}
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  data-testid="cs-requests-clear-filters"
                >
                  {t('requests:filters.clearFilters')}
                </Button>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('common:search')}
                  placeholder={t('requests:filters.searchPlaceholder', 'Search requests')}
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
                  <InputLabel>{t('requests:status')}</InputLabel>
                  <Select
                    value={statusFilter}
                    label={t('requests:status')}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    data-testid="cs-requests-status-filter"
                  >
                    <MenuItem value="">{t('requests:filters.allStatuses', 'All Statuses')}</MenuItem>
                    <MenuItem value="SUBMITTED">{t('requests:statuses.SUBMITTED')}</MenuItem>
                    <MenuItem value="TRIAGED">{t('requests:statuses.TRIAGED')}</MenuItem>
                    <MenuItem value="IN_PROGRESS">{t('requests:statuses.IN_PROGRESS')}</MenuItem>
                    <MenuItem value="WAITING_ON_CITIZEN">{t('requests:statuses.WAITING_ON_CITIZEN')}</MenuItem>
                    <MenuItem value="RESOLVED">{t('requests:statuses.RESOLVED')}</MenuItem>
                    <MenuItem value="CLOSED">{t('requests:statuses.CLOSED')}</MenuItem>
                    <MenuItem value="REJECTED">{t('requests:statuses.REJECTED')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('requests:category')}</InputLabel>
                  <Select
                    value={categoryFilter}
                    label={t('requests:category')}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    data-testid="cs-requests-category-filter"
                  >
                    <MenuItem value="">{t('requests:filters.allCategories', 'All Categories')}</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {getCategoryLabel(category, t)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('requests:priority')}</InputLabel>
                  <Select
                    value={priorityFilter}
                    label={t('requests:priority')}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    data-testid="cs-requests-priority-filter"
                  >
                    <MenuItem value="">{t('requests:filters.allPriorities', 'All Priorities')}</MenuItem>
                    <MenuItem value="LOW">{t('requests:priorities.LOW')}</MenuItem>
                    <MenuItem value="MEDIUM">{t('requests:priorities.MEDIUM')}</MenuItem>
                    <MenuItem value="HIGH">{t('requests:priorities.HIGH')}</MenuItem>
                    <MenuItem value="URGENT">{t('requests:priorities.URGENT')}</MenuItem>
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
          localeText={getDataGridLocaleText(t)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CitizenRequestsPage;