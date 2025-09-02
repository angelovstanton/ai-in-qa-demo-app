import { TFunction } from 'i18next';

/**
 * Creates localized text configuration for MUI DataGrid
 * @param t - Translation function from react-i18next
 * @returns Locale text object for DataGrid
 */
export const getDataGridLocaleText = (t: TFunction) => ({
  // Root
  noRowsLabel: t('common:noData'),
  noResultsOverlayLabel: t('common:noResults'),
  errorOverlayDefaultLabel: t('common:errorMessage'),

  // Density selector toolbar button text
  toolbarDensity: t('common:density'),
  toolbarDensityLabel: t('common:densityLabel'),
  toolbarDensityCompact: t('common:compact'),
  toolbarDensityStandard: t('common:standard'),
  toolbarDensityComfortable: t('common:comfortable'),

  // Columns selector toolbar button text
  toolbarColumns: t('common:columns'),
  toolbarColumnsLabel: t('common:manageColumns'),

  // Filters toolbar button text
  toolbarFilters: t('common:filters'),
  toolbarFiltersLabel: t('common:showFilters'),
  toolbarFiltersTooltipHide: t('common:hideFilters'),
  toolbarFiltersTooltipShow: t('common:showFilters'),
  toolbarFiltersTooltipActive: (count: number) =>
    count !== 1 ? t('common:filtersActive', { count }) : t('common:filterActive'),

  // Quick filter toolbar field
  toolbarQuickFilterPlaceholder: t('common:search'),
  toolbarQuickFilterLabel: t('common:search'),
  toolbarQuickFilterDeleteIconLabel: t('common:clear'),

  // Export selector toolbar button text
  toolbarExport: t('common:export'),
  toolbarExportLabel: t('common:export'),
  toolbarExportCSV: t('common:downloadAsCSV'),
  toolbarExportPrint: t('common:print'),
  toolbarExportExcel: t('common:downloadAsExcel'),

  // Columns panel text
  columnsPanelTextFieldLabel: t('common:findColumn'),
  columnsPanelTextFieldPlaceholder: t('common:columnTitle'),
  columnsPanelDragIconLabel: t('common:reorderColumn'),
  columnsPanelShowAllButton: t('common:showAll'),
  columnsPanelHideAllButton: t('common:hideAll'),
  columnsPanelResetButton: t('common:reset'),

  // Filter panel text
  filterPanelAddFilter: t('common:addFilter'),
  filterPanelRemoveAll: t('common:removeAllFilters'),
  filterPanelDeleteIconLabel: t('common:delete'),
  filterPanelLogicOperator: t('common:logicOperator'),
  filterPanelOperator: t('common:operator'),
  filterPanelOperatorAnd: t('common:and'),
  filterPanelOperatorOr: t('common:or'),
  filterPanelColumns: t('common:columns'),
  filterPanelInputLabel: t('common:value'),
  filterPanelInputPlaceholder: t('common:filterValue'),

  // Filter operators text
  filterOperatorContains: t('common:contains'),
  filterOperatorEquals: t('common:equals'),
  filterOperatorStartsWith: t('common:startsWith'),
  filterOperatorEndsWith: t('common:endsWith'),
  filterOperatorIs: t('common:is'),
  filterOperatorNot: t('common:isNot'),
  filterOperatorAfter: t('common:isAfter'),
  filterOperatorOnOrAfter: t('common:isOnOrAfter'),
  filterOperatorBefore: t('common:isBefore'),
  filterOperatorOnOrBefore: t('common:isOnOrBefore'),
  filterOperatorIsEmpty: t('common:isEmpty'),
  filterOperatorIsNotEmpty: t('common:isNotEmpty'),
  filterOperatorIsAnyOf: t('common:isAnyOf'),

  // Filter values text
  filterValueAny: t('common:any'),
  filterValueTrue: t('common:true'),
  filterValueFalse: t('common:false'),

  // Column menu text
  columnMenuLabel: t('common:menu'),
  columnMenuShowColumns: t('common:showColumns'),
  columnMenuManageColumns: t('common:manageColumns'),
  columnMenuFilter: t('common:filter'),
  columnMenuHideColumn: t('common:hideColumn'),
  columnMenuUnsort: t('common:unsort'),
  columnMenuSortAsc: t('common:sortAscending'),
  columnMenuSortDesc: t('common:sortDescending'),

  // Column header text
  columnHeaderFiltersTooltipActive: (count: number) =>
    count !== 1 ? t('common:filtersActive', { count }) : t('common:filterActive'),
  columnHeaderFiltersLabel: t('common:showFilters'),
  columnHeaderSortIconLabel: t('common:sort'),

  // Rows selected footer text
  footerRowSelected: (count: number) =>
    count !== 1
      ? t('common:rowsSelected', { count })
      : t('common:rowSelected'),

  // Total row amount footer text
  footerTotalRows: t('common:totalRows'),

  // Total visible row amount footer text
  footerTotalVisibleRows: (visibleCount: number, totalCount: number) =>
    t('common:ofTotal', { visible: visibleCount, total: totalCount }),

  // Checkbox selection text
  checkboxSelectionHeaderName: t('common:checkboxSelection'),
  checkboxSelectionSelectAllRows: t('common:selectAllRows'),
  checkboxSelectionUnselectAllRows: t('common:unselectAllRows'),
  checkboxSelectionSelectRow: t('common:selectRow'),
  checkboxSelectionUnselectRow: t('common:unselectRow'),

  // Boolean cell text
  booleanCellTrueLabel: t('common:yes'),
  booleanCellFalseLabel: t('common:no'),

  // Actions cell more text
  actionsCellMore: t('common:more'),

  // Column pinning text
  pinToLeft: t('common:pinToLeft'),
  pinToRight: t('common:pinToRight'),
  unpin: t('common:unpin'),

  // Tree Data
  treeDataGroupingHeaderName: t('common:group'),
  treeDataExpand: t('common:expand'),
  treeDataCollapse: t('common:collapse'),

  // Grouping columns
  groupingColumnHeaderName: t('common:group'),
  groupColumn: (name: string) => t('common:groupByColumn', { column: name }),
  unGroupColumn: (name: string) => t('common:ungroupByColumn', { column: name }),

  // Master/detail
  detailPanelToggle: t('common:showDetail'),
  expandDetailPanel: t('common:expand'),
  collapseDetailPanel: t('common:collapse'),

  // Row reordering text
  rowReorderingHeaderName: t('common:dragHandle'),

  // Aggregation
  aggregationMenuItemHeader: t('common:aggregation'),
  aggregationFunctionLabelSum: t('common:sum'),
  aggregationFunctionLabelAvg: t('common:avg'),
  aggregationFunctionLabelMin: t('common:min'),
  aggregationFunctionLabelMax: t('common:max'),
  aggregationFunctionLabelSize: t('common:size'),

  // Pagination
  MuiTablePagination: {
    labelRowsPerPage: t('common:rowsPerPage'),
    labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
      `${from}–${to} ${t('common:of')} ${count !== -1 ? count : `${t('common:moreThan')} ${to}`}`,
    getItemAriaLabel: (type: 'first' | 'last' | 'next' | 'previous') => {
      if (type === 'first') {
        return t('common:firstPage');
      }
      if (type === 'last') {
        return t('common:lastPage');
      }
      if (type === 'next') {
        return t('common:nextPage');
      }
      // if (type === 'previous')
      return t('common:previousPage');
    },
  },
});