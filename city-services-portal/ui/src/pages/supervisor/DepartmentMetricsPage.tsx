import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

interface DepartmentMetric {
  id: string;
  departmentId: string;
  metricType: string;
  value: number;
  period: string;
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
  createdAt: string;
  department: {
    id: string;
    name: string;
    slug: string;
  };
}

const metricConfig = {
  avgResolutionTime: {
    label: 'Avg Resolution Time',
    icon: <SpeedIcon />,
    unit: 'hours',
    color: 'primary',
    description: 'Average time to resolve requests',
    target: 48,
    isLowerBetter: true,
  },
  slaCompliance: {
    label: 'SLA Compliance',
    icon: <CheckCircleIcon />,
    unit: '%',
    color: 'success',
    description: 'Percentage of requests meeting SLA',
    target: 95,
    isLowerBetter: false,
  },
  citizenSatisfaction: {
    label: 'Citizen Satisfaction',
    icon: <StarIcon />,
    unit: '/5',
    color: 'warning',
    description: 'Average citizen satisfaction rating',
    target: 4.0,
    isLowerBetter: false,
  },
  firstCallResolution: {
    label: 'First Call Resolution',
    icon: <TrendingUpIcon />,
    unit: '%',
    color: 'info',
    description: 'Percentage resolved on first contact',
    target: 80,
    isLowerBetter: false,
  },
  staffUtilization: {
    label: 'Staff Utilization',
    icon: <PeopleIcon />,
    unit: '%',
    color: 'secondary',
    description: 'Staff workload utilization rate',
    target: 85,
    isLowerBetter: false,
  },
  requestVolume: {
    label: 'Request Volume',
    icon: <AnalyticsIcon />,
    unit: 'requests',
    color: 'primary',
    description: 'Total number of requests',
    target: 50,
    isLowerBetter: false,
  },
  escalationRate: {
    label: 'Escalation Rate',
    icon: <TrendingDownIcon />,
    unit: '%',
    color: 'error',
    description: 'Percentage of requests escalated',
    target: 10,
    isLowerBetter: true,
  },
};

const DepartmentMetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DepartmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('daily');
  const [metricTypeFilter, setMetricTypeFilter] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        size: rowsPerPage.toString(),
        period: periodFilter,
        ...(metricTypeFilter && { metricType: metricTypeFilter }),
      });

      const response = await fetch(`/api/v1/supervisor/department-metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data.data);
      setTotalCount(data.pagination?.totalCount || data.data.length);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load department metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [page, rowsPerPage, periodFilter, metricTypeFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatValue = (value: number, metricType: string) => {
    const config = metricConfig[metricType as keyof typeof metricConfig];
    if (!config) return value.toString();
    
    if (config.unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (config.unit === 'hours') {
      return `${value.toFixed(1)}h`;
    } else if (config.unit === '/5') {
      return `${value.toFixed(1)}/5`;
    } else {
      return Math.round(value).toString();
    }
  };

  const getPerformanceIndicator = (value: number, metricType: string) => {
    const config = metricConfig[metricType as keyof typeof metricConfig];
    if (!config) return 'default';
    
    const target = config.target;
    const isGood = config.isLowerBetter ? value <= target : value >= target;
    const isClose = config.isLowerBetter 
      ? value <= target * 1.2 
      : value >= target * 0.8;
    
    if (isGood) return 'success';
    if (isClose) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Group metrics by type for summary cards
  const metricSummary = metrics.reduce((acc, metric) => {
    if (!acc[metric.metricType]) {
      acc[metric.metricType] = {
        values: [],
        latestValue: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }
    acc[metric.metricType].values.push(metric.value);
    acc[metric.metricType].latestValue = metric.value;
    return acc;
  }, {} as Record<string, { values: number[]; latestValue: number; trend: 'up' | 'down' | 'stable' }>);

  // Calculate trends
  Object.keys(metricSummary).forEach(metricType => {
    const values = metricSummary[metricType].values;
    if (values.length >= 2) {
      const recent = values.slice(-2);
      const trend = recent[1] > recent[0] ? 'up' : recent[1] < recent[0] ? 'down' : 'stable';
      metricSummary[metricType].trend = trend;
    }
  });

  if (loading && metrics.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-department-metrics-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Department Metrics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        {Object.entries(metricSummary).slice(0, 4).map(([metricType, summary]) => {
          const config = metricConfig[metricType as keyof typeof metricConfig];
          if (!config) return null;
          
          return (
            <Grid item xs={12} sm={6} md={3} key={metricType}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box color={`${config.color}.main`}>
                      {config.icon}
                    </Box>
                    {summary.trend === 'up' && <TrendingUpIcon color="success" />}
                    {summary.trend === 'down' && <TrendingDownIcon color="error" />}
                  </Box>
                  
                  <Typography variant="h4" component="div" gutterBottom>
                    {formatValue(summary.latestValue, metricType)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {config.label}
                  </Typography>
                  
                  <Chip
                    size="small"
                    label={getPerformanceIndicator(summary.latestValue, metricType)}
                    color={getPerformanceIndicator(summary.latestValue, metricType) as any}
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Time Period"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Metric Type"
            value={metricTypeFilter}
            onChange={(e) => setMetricTypeFilter(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          >
            <MenuItem value="">All Metrics</MenuItem>
            {Object.entries(metricConfig).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            onClick={fetchMetrics}
            disabled={loading}
            fullWidth
            sx={{ height: '40px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Refresh'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={fetchMetrics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Metrics Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Metric Type</TableCell>
                <TableCell align="center">Value</TableCell>
                <TableCell align="center">Performance</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Period Start</TableCell>
                <TableCell>Period End</TableCell>
                <TableCell>Calculated At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((metric) => {
                const config = metricConfig[metric.metricType as keyof typeof metricConfig];
                const performance = getPerformanceIndicator(metric.value, metric.metricType);
                
                return (
                  <TableRow key={metric.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {metric.department.name}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {config && (
                          <Box color={`${config.color}.main`} mr={1}>
                            {config.icon}
                          </Box>
                        )}
                        <Box>
                          <Typography variant="body2">
                            {config?.label || metric.metricType}
                          </Typography>
                          {config && (
                            <Typography variant="caption" color="text.secondary">
                              {config.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="h6">
                        {formatValue(metric.value, metric.metricType)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={performance}
                        color={performance as any}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        size="small"
                        label={metric.period}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(metric.periodStart)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(metric.periodEnd)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(metric.calculatedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default DepartmentMetricsPage;