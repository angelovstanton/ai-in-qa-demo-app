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
  testId?: string;
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
  testId = 'cs-data-grid',
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
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        paginationModel={{ page, pageSize }}
        pageSizeOptions={[5, 10, 25, 50]}
        sortModel={sortModel}
        filterModel={filterModel}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
        onFilterModelChange={handleFilterModelChange}
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
        }}
        data-testid={testId}
      />
    </Paper>
  );
};

export default DataTable;