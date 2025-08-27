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
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Container,
  Pagination,
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
  Speed as PriorityIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DataTable from '../components/DataTable';
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from '@mui/x-data-grid';

interface ResolvedCase {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  resolvedAt: string;
  resolutionTime: number; // in hours
  satisfactionRating?: number;
  resolutionSummary?: string;
  upvotes: number;
  commentsCount: number;
}

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
  const [cases, setCases] = useState<ResolvedCase[]>([]);
  const [stats, setStats] = useState<ResolvedCasesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(new Date('2024-01-01'));
  const [dateTo, setDateTo] = useState<Date | null>(new Date());
  const [minSatisfactionRating, setMinSatisfactionRating] = useState('');

  // Pagination and sorting
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'resolvedAt', sort: 'desc' },
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

  useEffect(() => {
    fetchResolvedCases();
    fetchStats();
  }, [paginationModel, sortModel, searchTerm, selectedCategory, selectedPriority, selectedDepartment, dateFrom, dateTo, minSatisfactionRating]);

  const fetchResolvedCases = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        pageSize: paginationModel.pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedPriority && { priority: selectedPriority }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
        ...(dateTo && { dateTo: dateTo.toISOString() }),
        ...(minSatisfactionRating && { minSatisfactionRating }),
        ...(sortModel.length > 0 && { 
          sort: `${sortModel[0].field}:${sortModel[0].sort}` 
        }),
      });

      const response = await api.get(`/requests/resolved?${params}`);
      setCases(response.data.data);
      setTotalCount(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch resolved cases');
      
      // Fallback to mock data
      const mockCases: ResolvedCase[] = [
        {
          id: '1',
          code: 'REQ-2024-001',
          title: 'Pothole on Main Street',
          category: 'roads-transportation',
          priority: 'HIGH',
          creator: { id: '1', name: 'John Smith', email: 'john@example.com' },
          assignee: { id: '2', name: 'Road Crew A' },
          department: { id: '1', name: 'Public Works' },
          createdAt: '2024-01-01T10:00:00Z',
          resolvedAt: '2024-01-05T15:30:00Z',
          resolutionTime: 101.5,
          satisfactionRating: 5,
          resolutionSummary: 'Pothole filled with asphalt. Road surface restored.',
          upvotes: 12,
          commentsCount: 5,
        },
        {
          id: '2',
          code: 'REQ-2024-002',
          title: 'Broken streetlight on Oak Avenue',
          category: 'street-lighting',
          priority: 'MEDIUM',
          creator: { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com' },
          assignee: { id: '3', name: 'Electrical Team' },
          department: { id: '2', name: 'Utilities' },
          createdAt: '2024-01-02T14:20:00Z',
          resolvedAt: '2024-01-06T09:45:00Z',
          resolutionTime: 91.4,
          satisfactionRating: 4,
          resolutionSummary: 'Replaced faulty LED bulb and checked electrical connections.',
          upvotes: 8,
          commentsCount: 3,
        },
        {
          id: '3',
          code: 'REQ-2024-003',
          title: 'Overflowing trash bin in Central Park',
          category: 'waste-management',
          priority: 'LOW',
          creator: { id: '3', name: 'Mike Wilson', email: 'mike@example.com' },
          assignee: { id: '4', name: 'Sanitation Crew' },
          department: { id: '3', name: 'Sanitation' },
          createdAt: '2024-01-03T08:15:00Z',
          resolvedAt: '2024-01-04T16:20:00Z',
          resolutionTime: 32.1,
          satisfactionRating: 3,
          resolutionSummary: 'Emptied bin and increased collection frequency for this location.',
          upvotes: 6,
          commentsCount: 2,
        },
      ];
      setCases(mockCases);
      setTotalCount(mockCases.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
        ...(dateTo && { dateTo: dateTo.toISOString() }),
      });

      const response = await api.get(`/requests/resolved/stats?${params}`);
      setStats(response.data.data);
    } catch (err: any) {
      // Fallback to mock stats
      const mockStats: ResolvedCasesStats = {
        totalCases: 156,
        averageResolutionTime: 72.3,
        satisfactionRate: 4.2,
        topCategory: 'roads-transportation',
        thisMonthCount: 23,
        lastMonthCount: 18,
        improvementRate: 27.8,
      };
      setStats(mockStats);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedDepartment('');
    setDateFrom(startOfMonth(new Date()));
    setDateTo(endOfMonth(new Date()));
    setMinSatisfactionRating('');
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/requests/${caseId}`);
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
      field: 'resolvedAt',
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
    resolutionTime: case_.resolutionTime,
    satisfactionRating: case_.satisfactionRating,
    resolvedAt: case_.resolvedAt,
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        data-testid="cs-resolved-date-from"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="To Date"
                    value={dateTo}
                    onChange={setDateTo}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        data-testid="cs-resolved-date-to"
                      />
                    )}
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
          </Card>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default ResolvedCasesPage;