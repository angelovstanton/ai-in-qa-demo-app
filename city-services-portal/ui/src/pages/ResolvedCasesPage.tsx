import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Container,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as ResolvedIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServiceRequests } from '../hooks/useServiceRequests';
import { ServiceRequest } from '../types';
import DataTable from '../components/DataTable';
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from '@mui/x-data-grid';

// Stats interface for resolved cases
interface ResolvedCasesStats {
  totalCases: number;
  averageResolutionTime: number;
  satisfactionRate: number;
  topCategory: string;
  thisMonthCount: number;
  lastMonthCount: number;
  improvementRate: number;
}

const ResolvedCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ResolvedCasesStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [minSatisfactionRating, setMinSatisfactionRating] = useState('');

  // Pagination and sorting
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'updatedAt', sort: 'desc' },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

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

  // Use the hook to fetch resolved cases
  const { 
    data: cases, 
    loading, 
    error: requestsError, 
    totalCount,
    refetch: refetchCases 
  } = useServiceRequests({
    status: 'RESOLVED,CLOSED', // Filter for resolved and closed cases
    category: selectedCategory || undefined,
    priority: selectedPriority || undefined,
    department: selectedDepartment || undefined,
    text: searchTerm || undefined,
    page: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    sort: sortModel.length > 0 ? `${sortModel[0].field}:${sortModel[0].sort}` : 'updatedAt:desc',
    showAll: true, // Show all resolved cases, not just user's own
  });

  useEffect(() => {
    if (requestsError) {
      setError(requestsError);
    }
    fetchStats();
  }, [requestsError, dateFrom, dateTo]);



  const fetchStats = async () => {
    try {
      // Create params object first
      const paramsObj: Record<string, string> = {};
      
      // Add conditional parameters
      if (dateFrom) paramsObj.dateFrom = dateFrom.toISOString();
      if (dateTo) paramsObj.dateTo = dateTo.toISOString();

      // Convert to URLSearchParams
      const params = new URLSearchParams(paramsObj);

      // Use the main requests endpoint with status filter and aggregation
      const response = await api.get(`/requests?status=RESOLVED,CLOSED&aggregate=stats&${params}`);
      
      if (response.data && response.data.stats) {
        setStats({
          totalCases: response.data.stats.count || 0,
          averageResolutionTime: response.data.stats.avgResolutionTime || 0,
          satisfactionRate: response.data.stats.avgSatisfaction || 0,
          topCategory: response.data.stats.topCategory || 'N/A',
          thisMonthCount: response.data.stats.thisMonthCount || 0,
          lastMonthCount: response.data.stats.lastMonthCount || 0,
          improvementRate: response.data.stats.improvementRate || 0
        });
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      // Don't show stats if there's an error
      setStats(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedDepartment('');
    setDateFrom(null);
    setDateTo(null);
    setMinSatisfactionRating('');
  };
  


  const handleViewCase = (caseId: string) => {
    if (caseId) {
      navigate(`/request/${caseId}`);
    } else {
      console.error('Invalid case ID');
      setError('Cannot view case: Invalid case ID');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'primary';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getResolutionTimeColor = (hours: number) => {
    if (hours <= 24) return 'success';
    if (hours <= 72) return 'warning';
    return 'error';
  };

  const getSatisfactionColor = (rating?: number) => {
    if (!rating) return 'secondary';
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'error';
  };

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Case ID',
      width: 130,
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
      renderCell: (params) => (
        <Chip
          label={categoryLabels[params.value] || params.value}
          size="small"
          variant="outlined"
          data-testid={`cs-resolved-category-${params.row.id}`}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value) as any}
          size="small"
          data-testid={`cs-resolved-priority-${params.row.id}`}
        />
      ),
    },
    {
      field: 'resolutionTime',
      headerName: 'Resolution Time',
      width: 140,
      filterable: false,
      renderCell: (params) => (
        <Chip
          label={`${Math.round(params.value)}h`}
          color={getResolutionTimeColor(params.value) as any}
          size="small"
          variant="outlined"
          data-testid={`cs-resolved-time-${params.row.id}`}
        />
      ),
    },
    {
      field: 'satisfactionRating',
      headerName: 'Satisfaction',
      width: 120,
      filterable: false,
      renderCell: (params) => (
        params.value ? (
          <Chip
            label={`${params.value}/5`}
            color={getSatisfactionColor(params.value) as any}
            size="small"
            data-testid={`cs-resolved-satisfaction-${params.row.id}`}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Not rated
          </Typography>
        )
      ),
    },
    {
      field: 'updatedAt',
      headerName: 'Resolved Date',
      width: 130,
      filterable: true,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'upvotes',
      headerName: 'Upvotes',
      width: 100,
      filterable: false,
      renderCell: (params) => (
        <Typography data-testid={`cs-resolved-upvotes-${params.row.id}`}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="View case details">
          <IconButton
            size="small"
            onClick={() => handleViewCase(params.row.id)}
            data-testid={`cs-resolved-view-${params.row.id}`}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const rows = cases.map((case_) => ({
    id: case_.id,
    code: case_.code,
    title: case_.title,
    category: case_.category,
    priority: case_.priority,
    // Use closedAt and createdAt to calculate resolution time if not provided
    resolutionTime: case_.closedAt && case_.createdAt ? 
      Math.round((new Date(case_.closedAt).getTime() - new Date(case_.createdAt).getTime()) / (1000 * 60 * 60)) : 0,
    satisfactionRating: case_.satisfactionRating,
    updatedAt: case_.updatedAt,
    upvotes: case_.upvotes,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" data-testid="cs-resolved-cases-page">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom data-testid="cs-resolved-cases-title">
            Resolved Cases
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Track completed municipal service requests and their outcomes
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-resolved-cases-error">
              {error}
            </Alert>
          )}

          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card data-testid="cs-resolved-stat-total">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ResolvedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" color="success.main">
                      {stats.totalCases}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Resolved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card data-testid="cs-resolved-stat-time">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" color="primary.main">
                      {Math.round(stats.averageResolutionTime)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Resolution Time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card data-testid="cs-resolved-stat-satisfaction">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" color="warning.main">
                      {stats.satisfactionRate}/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Satisfaction Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card data-testid="cs-resolved-stat-improvement">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CategoryIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" color="info.main">
                      +{stats.improvementRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Improvement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Card sx={{ mb: 3 }} data-testid="cs-resolved-cases-filters">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
                <Button
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ ml: 'auto' }}
                  data-testid="cs-resolved-clear-filters"
                >
                  Clear All
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search cases"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    data-testid="cs-resolved-search"
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      data-testid="cs-resolved-category-filter"
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
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={selectedPriority}
                      label="Priority"
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      data-testid="cs-resolved-priority-filter"
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
                  <DatePicker
                    label="From Date"
                    value={dateFrom}
                    onChange={setDateFrom}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        inputProps: {
                          'data-testid': "cs-resolved-date-from"
                        }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="To Date"
                    value={dateTo}
                    onChange={setDateTo}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        inputProps: {
                          'data-testid': "cs-resolved-date-to"
                        }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Min Rating</InputLabel>
                    <Select
                      value={minSatisfactionRating}
                      label="Min Rating"
                      onChange={(e) => setMinSatisfactionRating(e.target.value)}
                      data-testid="cs-resolved-rating-filter"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="1">1+</MenuItem>
                      <MenuItem value="2">2+</MenuItem>
                      <MenuItem value="3">3+</MenuItem>
                      <MenuItem value="4">4+</MenuItem>
                      <MenuItem value="5">5</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card data-testid="cs-resolved-cases-table">
                      {loading && cases.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">Loading resolved cases...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button 
                variant="contained" 
                onClick={() => refetchCases()}
                data-testid="cs-retry-fetch"
              >
                Retry
              </Button>
            </Box>
          ) : cases.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">No resolved cases found matching your criteria.</Typography>
            </Box>
          ) : (
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
              onRowClick={(params) => handleViewCase(params.row.id)}
              testId="cs-resolved-cases-grid"
            />
          )}
          </Card>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default ResolvedCasesPage;