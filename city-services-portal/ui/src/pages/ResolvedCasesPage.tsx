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
  Visibility as ViewIcon,
  CheckCircle as ResolvedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useServiceRequests } from '../hooks/useServiceRequests';
import { ServiceRequest } from '../types';
// import { useAuth } from '../contexts/AuthContext'; // Not needed for resolved cases view
import { useNavigate } from 'react-router-dom';

const ResolvedCasesPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Fetch resolved requests (RESOLVED and CLOSED status)
  const { data: requests, loading, error, refetch, totalCount } = useServiceRequests({
    page: paginationModel.page + 1, // API is 1-based
    pageSize: paginationModel.pageSize,
    sort: sortParam,
    status: 'RESOLVED,CLOSED', // Filter for resolved and closed cases only
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    text: searchText || undefined,
    // Show all resolved requests - everyone can see resolved cases
    showAll: true,
  });

  const handleViewRequest = useCallback((requestId: string) => {
    navigate(`/request/${requestId}`);
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setPriorityFilter('');
    setCategoryFilter('');
    setSearchText('');
  }, []);

  const hasActiveFilters = priorityFilter || categoryFilter || searchText;

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
        return (
          <Chip 
            label={status?.replace('_', ' ') || 'N/A'} 
            size="small" 
            color="success"
            icon={<ResolvedIcon />}
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
      field: 'closedAt',
      headerName: 'Resolved Date',
      width: 130,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => {
        try {
          return params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 
                 params.row.updatedAt ? format(new Date(params.row.updatedAt), 'MMM dd, yyyy') : 'N/A';
        } catch {
          return 'Invalid Date';
        }
      },
    },
    {
      field: 'resolutionTime',
      headerName: 'Resolution Time',
      width: 130,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const createdAt = params.row.createdAt;
        const closedAt = params.row.closedAt || params.row.updatedAt;
        
        if (createdAt && closedAt) {
          const hours = Math.round((new Date(closedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
          const color = hours <= 24 ? 'success' : hours <= 72 ? 'warning' : 'error';
          return (
            <Chip 
              label={`${hours}h`} 
              size="small" 
              color={color as any}
              variant="outlined"
            />
          );
        }
        return 'N/A';
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
      width: 100,
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
              data-testid={`cs-view-resolved-${params.row.id}`}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [handleViewRequest]);

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
      closedAt: request.closedAt,
      updatedAt: request.updatedAt,
      upvotes: request.upvotes || 0,
    }));
  }, [requests]);

  return (
    <Box data-testid="cs-resolved-cases-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ResolvedIcon color="success" />
            Resolved Cases ({totalCount || 0})
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Track completed municipal service requests and their outcomes
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          data-testid="cs-refresh-resolved"
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search resolved cases..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by title, description, or ID"
                data-testid="cs-search-resolved"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  data-testid="cs-filter-resolved-priority"
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  data-testid="cs-filter-resolved-category"
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
                    data-testid="cs-clear-resolved-filters"
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
              data-testid="cs-resolved-cases-grid"
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
          <Typography color="error" data-testid="cs-resolved-error">
            Error loading resolved cases: {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ResolvedCasesPage;