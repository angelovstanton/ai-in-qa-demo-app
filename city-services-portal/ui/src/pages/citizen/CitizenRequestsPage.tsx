import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from '@mui/x-data-grid';
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

  // Convert sort model to API format
  const sortParam = sortModel.length > 0 
    ? `${sortModel[0].field}:${sortModel[0].sort}`
    : 'createdAt:desc';

  const { data, loading, error, totalCount } = useServiceRequests({
    page: paginationModel.page + 1, // API uses 1-based indexing
    pageSize: paginationModel.pageSize,
    sort: sortParam,
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

  const rows = data.map((request: ServiceRequest) => ({
    id: request.id,
    code: request.code,
    title: request.title,
    category: request.category,
    priority: request.priority,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }));

  return (
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
  );
};

export default CitizenRequestsPage;