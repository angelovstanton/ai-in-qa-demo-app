import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Chip, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility as ViewIcon, ThumbUp as ThumbUpIcon } from '@mui/icons-material';
import { format } from 'date-fns';

// Helper functions for consistent styling
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'default';
    default: return 'default';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': 
    case 'CLOSED': return 'success';
    case 'IN_PROGRESS': return 'info';
    case 'APPROVED': return 'primary';
    case 'REJECTED': return 'error';
    case 'SUBMITTED': return 'default';
    case 'IN_REVIEW':
    case 'TRIAGED': return 'secondary';
    default: return 'default';
  }
};

export const categoryLabels: Record<string, string> = {
  'roads-and-infrastructure': 'Roads & Infrastructure',
  'water-and-utilities': 'Water & Utilities',
  'parks-and-recreation': 'Parks & Recreation',
  'public-safety': 'Public Safety',
  'waste-management': 'Waste Management',
};

interface CreateColumnsParams {
  isMyRequests?: boolean;
  userId?: string;
  onViewRequest: (requestId: string) => void;
  onUpvote?: (requestId: string) => void;
}

export const createCitizenRequestColumns = ({
  isMyRequests = false,
  userId,
  onViewRequest,
  onUpvote
}: CreateColumnsParams): GridColDef[] => {
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
      flex: 1,
      minWidth: 200,
      filterable: true,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 160,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => {
        const label = categoryLabels[params.value] || params.value?.replace(/-/g, ' ') || 'N/A';
        return (
          <Chip 
            label={label} 
            size="small" 
            variant="outlined"
            data-testid={`cs-requests-category-${params.row.id}`}
          />
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      filterable: true,
      renderCell: (params: GridRenderCellParams) => (
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
      renderCell: (params: GridRenderCellParams) => (
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
  ];

  // Add "Submitted By" column only for All Requests view
  if (!isMyRequests) {
    columns.push({
      field: 'creator',
      headerName: 'Submitted By',
      width: 150,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const creator = params.row.creator;
        return creator ? creator.name : 'Unknown';
      },
    });
  }

  // Add upvotes column
  columns.push({
    field: 'upvotes',
    headerName: 'Upvotes',
    width: 80,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption">{params.value || 0}</Typography>
      </Box>
    ),
  });

  // Add updatedAt column (hidden by default)
  columns.push({
    field: 'updatedAt',
    headerName: 'Last Updated',
    width: 120,
    filterable: true,
    hide: true,
    valueFormatter: (params) => {
      try {
        return params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'N/A';
      } catch {
        return 'Invalid Date';
      }
    },
  });

  // Add actions column
  columns.push({
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
              onViewRequest(params.row.id);
            }}
            data-testid={`cs-view-request-${params.row.id}`}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isMyRequests && onUpvote && params.row.creator?.id !== userId && (
          <Tooltip title="Upvote Request">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(params.row.id);
              }}
              data-testid={`cs-upvote-request-${params.row.id}`}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  });

  return columns;
};