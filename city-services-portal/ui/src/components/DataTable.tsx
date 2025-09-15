import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { Paper } from '@mui/material';

interface DataTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  rowCount?: number;
  page?: number;
  pageSize?: number;
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  onSortModelChange?: (model: GridSortModel) => void;
  onFilterModelChange?: (model: GridFilterModel) => void;
  onRowClick?: (params: any) => void;
  testId?: string;
  localeText?: any;
}

const DataTable: React.FC<DataTableProps> = ({
  rows,
  columns,
  loading = false,
  rowCount = 0,
  page = 0,
  pageSize = 10,
  sortModel = [],
  filterModel = { items: [] },
  onPaginationModelChange,
  onSortModelChange,
  onFilterModelChange,
  onRowClick,
  testId = 'cs-data-grid',
  localeText,
}) => {
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    onPaginationModelChange?.(model);
  };

  const handleSortModelChange = (model: GridSortModel) => {
    onSortModelChange?.(model);
  };

  const handleFilterModelChange = (model: GridFilterModel) => {
    onFilterModelChange?.(model);
  };

  return (
    <Paper sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows || []}
        columns={columns || []}
        loading={loading}
        rowCount={rowCount || 0}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        paginationModel={{ page: page || 0, pageSize: pageSize || 10 }}
        pageSizeOptions={[5, 10, 25, 50]}
        sortModel={sortModel || []}
        filterModel={filterModel || { items: [] }}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
        onFilterModelChange={handleFilterModelChange}
        onRowClick={onRowClick}
        localeText={localeText}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-toolbarContainer': {
            padding: 2,
          },
          ...(onRowClick && {
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
          }),
        }}
        data-testid={testId}
        // Add error handling for DataGrid
        onError={(error) => {
          console.error('DataGrid error:', error);
        }}
      />
    </Paper>
  );
};

export default DataTable;