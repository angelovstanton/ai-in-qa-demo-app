import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  Divider,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge
} from '@mui/material';
import {
  BugReport as BugIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Category as CategoryIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import api from '../../lib/api';

interface TestingFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isEnabled: boolean;
  isMasterControlled: boolean;
}

interface FlagStatistics {
  total: number;
  enabled: number;
  byCategory: Record<string, { total: number; enabled: number }>;
  byImpact: Record<string, { total: number; enabled: number }>;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  category?: string;
  impact?: string;
}

const TestingFlags: React.FC = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const showSuccess = (message: string) => showSnackbar(message, 'success');
  const showError = (message: string) => showSnackbar(message, 'error');
  const [flags, setFlags] = useState<TestingFlag[]>([]);
  const [masterControl, setMasterControl] = useState<TestingFlag | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<FlagStatistics | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    onConfirm: () => void;
  }>({ open: false, action: '', onConfirm: () => {} });

  useEffect(() => {
    loadFlags();
    loadStatistics();
    loadPresets();
  }, []);

  const loadFlags = async () => {
    try {
      const response = await api.get('/testing-flags');
      setMasterControl(response.data.data.masterControl);
      setFlags(response.data.data.flags);
      setCategories(['All', ...response.data.data.categories]);
    } catch (error) {
      showError('Failed to load testing flags');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/testing-flags/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await api.get('/testing-flags/presets');
      setPresets(response.data.data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleToggleFlag = async (flag: TestingFlag) => {
    try {
      await api.patch(`/testing-flags/${flag.key}`, {
        isEnabled: !flag.isEnabled
      });
      
      setFlags(prev => prev.map(f => 
        f.key === flag.key ? { ...f, isEnabled: !f.isEnabled } : f
      ));
      
      showSuccess(`Flag "${flag.name}" ${!flag.isEnabled ? 'enabled' : 'disabled'}`);
      loadStatistics();
    } catch (error) {
      showError(`Failed to update flag "${flag.name}"`);
    }
  };

  const handleToggleMaster = async () => {
    if (!masterControl) return;
    
    try {
      await api.patch(`/testing-flags/${masterControl.key}`, {
        isEnabled: !masterControl.isEnabled
      });
      
      setMasterControl(prev => prev ? { ...prev, isEnabled: !prev.isEnabled } : null);
      
      showSuccess(`Master control ${!masterControl.isEnabled ? 'enabled' : 'disabled'}`);
      loadStatistics();
    } catch (error) {
      showError('Failed to update master control');
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    setConfirmDialog({
      open: true,
      action: `Apply preset "${presets.find(p => p.id === presetId)?.name}"`,
      onConfirm: async () => {
        try {
          await api.post(`/testing-flags/presets/${presetId}`);
          showSuccess('Preset applied successfully');
          await loadFlags();
          await loadStatistics();
        } catch (error) {
          showError('Failed to apply preset');
        }
        setConfirmDialog({ open: false, action: '', onConfirm: () => {} });
      }
    });
  };

  const handleEnableCategory = async (category: string) => {
    try {
      await api.post(`/testing-flags/category/${category}/enable`);
      showSuccess(`All ${category} flags enabled`);
      await loadFlags();
      await loadStatistics();
    } catch (error) {
      showError(`Failed to enable ${category} flags`);
    }
  };

  const handleDisableCategory = async (category: string) => {
    try {
      await api.post(`/testing-flags/category/${category}/disable`);
      showSuccess(`All ${category} flags disabled`);
      await loadFlags();
      await loadStatistics();
    } catch (error) {
      showError(`Failed to disable ${category} flags`);
    }
  };

  const handleResetAll = () => {
    setConfirmDialog({
      open: true,
      action: 'Reset all flags to default values',
      onConfirm: async () => {
        try {
          await api.post('/testing-flags/reset');
          showSuccess('All flags reset to defaults');
          await loadFlags();
          await loadStatistics();
        } catch (error) {
          showError('Failed to reset flags');
        }
        setConfirmDialog({ open: false, action: '', onConfirm: () => {} });
      }
    });
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <ErrorIcon color="error" />;
      case 'MEDIUM':
        return <WarningIcon color="warning" />;
      case 'LOW':
        return <InfoIcon color="info" />;
      default:
        return null;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default' as const;
    }
  };

  const filteredFlags = flags.filter(flag => {
    const matchesCategory = selectedCategory === 'All' || flag.category === selectedCategory;
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          flag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          flag.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, TestingFlag[]>);

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You must be an administrator to access testing flags.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugIcon />
        Testing Feature Flags
      </Typography>

      {/* Master Control */}
      {masterControl && (
        <Alert 
          severity={masterControl.isEnabled ? 'warning' : 'info'} 
          sx={{ mb: 3 }}
          icon={<SettingsIcon />}
        >
          <AlertTitle>Master Control</AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>
              {masterControl.description}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={masterControl.isEnabled}
                  onChange={handleToggleMaster}
                  color="warning"
                />
              }
              label={masterControl.isEnabled ? 'Enabled' : 'Disabled'}
            />
          </Box>
        </Alert>
      )}

      {/* Statistics */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Flags
                </Typography>
                <Typography variant="h4">
                  {statistics.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Enabled
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistics.enabled}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  High Impact
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistics.byImpact.HIGH?.enabled || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Percentage Active
                </Typography>
                <Typography variant="h4">
                  {Math.round((statistics.enabled / statistics.total) * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {presets.map(preset => (
            <Button
              key={preset.id}
              variant="outlined"
              size="small"
              startIcon={<PlayIcon />}
              onClick={() => handleApplyPreset(preset.id)}
            >
              {preset.name}
            </Button>
          ))}
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ResetIcon />}
            onClick={handleResetAll}
          >
            Reset All
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tabs
              value={selectedCategory}
              onChange={(_, value) => setSelectedCategory(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {categories.map(cat => (
                <Tab
                  key={cat}
                  label={cat}
                  value={cat}
                  icon={statistics && cat !== 'All' ? (
                    <Badge 
                      badgeContent={statistics.byCategory[cat]?.enabled || 0} 
                      color="warning"
                    >
                      <CategoryIcon />
                    </Badge>
                  ) : undefined}
                />
              ))}
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* Flags List */}
      {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
        <Paper key={category} sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'grey.100',
              cursor: 'pointer'
            }}
            onClick={() => setExpandedCategories(prev => ({
              ...prev,
              [category]: !prev[category]
            }))}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small">
                {expandedCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography variant="h6">
                {category}
              </Typography>
              <Chip 
                label={`${categoryFlags.filter(f => f.isEnabled).length}/${categoryFlags.length}`}
                size="small"
                color={categoryFlags.some(f => f.isEnabled) ? 'warning' : 'default'}
              />
            </Box>
            <ButtonGroup size="small">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnableCategory(category);
                }}
              >
                Enable All
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisableCategory(category);
                }}
              >
                Disable All
              </Button>
            </ButtonGroup>
          </Box>
          
          <Collapse in={expandedCategories[category] !== false}>
            <List>
              {categoryFlags.map((flag, index) => (
                <React.Fragment key={flag.key}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getImpactIcon(flag.impactLevel)}
                          <Typography variant="subtitle1">
                            {flag.name}
                          </Typography>
                          <Chip 
                            label={flag.impactLevel} 
                            size="small" 
                            color={getImpactColor(flag.impactLevel)}
                          />
                          <Typography variant="caption" color="textSecondary">
                            ({flag.key})
                          </Typography>
                        </Box>
                      }
                      secondary={flag.description}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        checked={flag.isEnabled}
                        onChange={() => handleToggleFlag(flag)}
                        disabled={flag.isMasterControlled && !masterControl?.isEnabled}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Collapse>
        </Paper>
      ))}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: '', onConfirm: () => {} })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.action}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, action: '', onConfirm: () => {} })}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            color="primary" 
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestingFlags;