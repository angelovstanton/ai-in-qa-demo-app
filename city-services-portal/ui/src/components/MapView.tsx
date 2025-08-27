import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  Map as MapIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface MapIssue {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  upvotes: number;
  commentsCount: number;
}

interface MapViewProps {
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  showFilters?: boolean;
  height?: number;
  onIssueClick?: (issue: MapIssue) => void;
}

const MapView: React.FC<MapViewProps> = ({
  initialCenter = { latitude: 42.6977, longitude: 23.3219 }, // Sofia, Bulgaria
  initialZoom = 12,
  showFilters = true,
  height = 500,
  onIssueClick,
}) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Map state
  const [center] = useState(initialCenter);
  const [zoom] = useState(initialZoom);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    fetchIssues();
  }, [categoryFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    renderMap();
  }, [issues, center, zoom]);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        includeLocation: 'true',
      });

      const response = await api.get(`/requests/map?${params}`);
      setIssues(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch map data');
      
      // Fallback to mock data
      const mockIssues: MapIssue[] = [
        {
          id: '1',
          code: 'REQ-2024-001',
          title: 'Pothole on Main Street',
          category: 'roads-transportation',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          latitude: 42.6977 + (Math.random() - 0.5) * 0.02,
          longitude: 23.3219 + (Math.random() - 0.5) * 0.02,
          createdAt: '2024-01-15T10:00:00Z',
          creator: { id: '1', name: 'John Smith' },
          upvotes: 12,
          commentsCount: 5,
        },
        {
          id: '2',
          code: 'REQ-2024-002',
          title: 'Broken streetlight on Oak Avenue',
          category: 'street-lighting',
          priority: 'MEDIUM',
          status: 'TRIAGED',
          latitude: 42.6977 + (Math.random() - 0.5) * 0.02,
          longitude: 23.3219 + (Math.random() - 0.5) * 0.02,
          createdAt: '2024-01-14T15:30:00Z',
          creator: { id: '2', name: 'Sarah Johnson' },
          upvotes: 8,
          commentsCount: 3,
        },
        {
          id: '3',
          code: 'REQ-2024-003',
          title: 'Overflowing trash bin in Central Park',
          category: 'waste-management',
          priority: 'LOW',
          status: 'RESOLVED',
          latitude: 42.6977 + (Math.random() - 0.5) * 0.02,
          longitude: 23.3219 + (Math.random() - 0.5) * 0.02,
          createdAt: '2024-01-13T09:15:00Z',
          creator: { id: '3', name: 'Mike Wilson' },
          upvotes: 6,
          commentsCount: 2,
        },
        {
          id: '4',
          code: 'REQ-2024-004',
          title: 'Damaged playground equipment',
          category: 'parks-recreation',
          priority: 'HIGH',
          status: 'SUBMITTED',
          latitude: 42.6977 + (Math.random() - 0.5) * 0.02,
          longitude: 23.3219 + (Math.random() - 0.5) * 0.02,
          createdAt: '2024-01-12T14:45:00Z',
          creator: { id: '4', name: 'Emily Davis' },
          upvotes: 15,
          commentsCount: 8,
        },
        {
          id: '5',
          code: 'REQ-2024-005',
          title: 'Water leak on Bridge Street',
          category: 'water-sewer',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          latitude: 42.6977 + (Math.random() - 0.5) * 0.02,
          longitude: 23.3219 + (Math.random() - 0.5) * 0.02,
          createdAt: '2024-01-11T08:30:00Z',
          creator: { id: '5', name: 'David Brown' },
          upvotes: 20,
          commentsCount: 12,
        },
      ].filter(issue => {
        if (categoryFilter && issue.category !== categoryFilter) return false;
        if (statusFilter && issue.status !== statusFilter) return false;
        if (priorityFilter && issue.priority !== priorityFilter) return false;
        return true;
      });

      setIssues(mockIssues);
    } finally {
      setLoading(false);
    }
  };

  const renderMap = () => {
    if (!mapContainerRef.current) return;

    const mapContainer = mapContainerRef.current;
    
    // Calculate bounds based on issues
    let bounds = {
      minLat: center.latitude - 0.01,
      maxLat: center.latitude + 0.01,
      minLng: center.longitude - 0.01,
      maxLng: center.longitude + 0.01,
    };

    if (issues.length > 0) {
      bounds = issues.reduce((acc, issue) => ({
        minLat: Math.min(acc.minLat, issue.latitude),
        maxLat: Math.max(acc.maxLat, issue.latitude),
        minLng: Math.min(acc.minLng, issue.longitude),
        maxLng: Math.max(acc.maxLng, issue.longitude),
      }), {
        minLat: issues[0].latitude,
        maxLat: issues[0].latitude,
        minLng: issues[0].longitude,
        maxLng: issues[0].longitude,
      });
    }

    // Create markers HTML
    const markersHtml = issues.map(issue => {
      const x = ((issue.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
      const y = ((bounds.maxLat - issue.latitude) / (bounds.maxLat - bounds.minLat)) * 100;
      
      const markerColor = getMarkerColor(issue.priority, issue.status);
      
      return `
        <div
          class="map-marker"
          data-issue-id="${issue.id}"
          style="
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            transform: translate(-50%, -100%);
            cursor: pointer;
            z-index: 10;
          "
          title="${issue.title}"
        >
          <div style="
            width: 24px;
            height: 24px;
            background: ${markerColor};
            border: 2px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">
            <div style="transform: rotate(45deg);">
              ${getMarkerIcon(issue.category)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    mapContainer.innerHTML = `
      <div style="
        width: 100%;
        height: ${height}px;
        background: linear-gradient(45deg, #e8f5e8 25%, transparent 25%), 
                    linear-gradient(-45deg, #e8f5e8 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #e8f5e8 75%), 
                    linear-gradient(-45deg, transparent 75%, #e8f5e8 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        border: 2px solid #ccc;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
      ">
        <!-- Map background -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 50%, #7fcdcd 100%);
          opacity: 0.6;
        "></div>
        
        <!-- Grid lines -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        "></div>
        
        <!-- Markers -->
        ${markersHtml}
        
        <!-- Loading overlay -->
        ${loading ? `
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            color: #666;
          ">
            <div style="text-align: center;">
              <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #1976d2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
              "></div>
              <div>Loading issues...</div>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
        ` : ''}
        
        <!-- No issues message -->
        ${!loading && issues.length === 0 ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-family: Arial, sans-serif;
            color: #666;
          ">
            <div style="font-size: 48px; margin-bottom: 10px;">??</div>
            <div style="font-weight: bold; margin-bottom: 8px;">No Issues Found</div>
            <div style="font-size: 14px;">
              No issues match the current filters in this area
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Add click event listeners to markers
    const markers = mapContainer.querySelectorAll('.map-marker');
    markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        const issueId = (marker as HTMLElement).dataset.issueId;
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
          handleIssueClick(issue);
        }
      });
    });
  };

  const getMarkerColor = (priority: string, status: string): string => {
    if (status === 'RESOLVED' || status === 'CLOSED') return '#4caf50';
    if (status === 'REJECTED') return '#757575';
    
    switch (priority) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getMarkerIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'roads-transportation': '???',
      'street-lighting': '??',
      'waste-management': '???',
      'water-sewer': '??',
      'parks-recreation': '??',
      'public-safety': '??',
      'building-permits': '???',
      'snow-removal': '??',
      'traffic-signals': '??',
      'sidewalk-maintenance': '??',
      'tree-services': '??',
      'noise-complaints': '??',
      'animal-control': '??',
      'other': '?',
    };
    return icons[category] || '??';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'primary';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'TRIAGED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'WAITING_ON_CITIZEN': return 'secondary';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const handleIssueClick = (issue: MapIssue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
    onIssueClick?.(issue);
  };

  const handleViewIssue = (issueId: string) => {
    setDialogOpen(false);
    navigate(`/request/${issueId}`);
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  return (
    <Card data-testid="cs-map-view">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MapIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Issues Map ({issues.length} issues)
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchIssues}
            disabled={loading}
            data-testid="cs-map-refresh"
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} data-testid="cs-map-error">
            {error}
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }} data-testid="cs-map-filters">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                data-testid="cs-map-category-filter"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {categoryLabels[category]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="cs-map-status-filter"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="TRIAGED">Triaged</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                data-testid="cs-map-priority-filter"
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={clearFilters}
              disabled={!categoryFilter && !statusFilter && !priorityFilter}
              data-testid="cs-map-clear-filters"
            >
              Clear Filters
            </Button>
          </Box>
        )}

        {/* Map Container */}
        <Box
          ref={mapContainerRef}
          data-testid="cs-map-container"
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2,
          }}
        />

        {/* Legend */}
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }} data-testid="cs-map-legend">
          <Typography variant="subtitle2" gutterBottom>
            Map Legend
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
              <Typography variant="caption">Urgent</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
              <Typography variant="caption">High</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#2196f3', borderRadius: '50%' }} />
              <Typography variant="caption">Medium</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#9c27b0', borderRadius: '50%' }} />
              <Typography variant="caption">Low</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
              <Typography variant="caption">Resolved</Typography>
            </Box>
          </Box>
        </Paper>
      </CardContent>

      {/* Issue Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="cs-map-issue-dialog"
      >
        {selectedIssue && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedIssue.title}</Typography>
              <IconButton
                onClick={() => setDialogOpen(false)}
                data-testid="cs-map-dialog-close"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {selectedIssue.code}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={categoryLabels[selectedIssue.category] || selectedIssue.category}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={selectedIssue.priority}
                  color={getPriorityColor(selectedIssue.priority) as any}
                  size="small"
                />
                <Chip
                  label={selectedIssue.status.replace(/_/g, ' ')}
                  color={getStatusColor(selectedIssue.status) as any}
                  size="small"
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Reported by:</strong> {selectedIssue.creator.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date:</strong> {format(new Date(selectedIssue.createdAt), 'PPpp')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Location:</strong> {selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2">
                  ?? {selectedIssue.upvotes} upvotes
                </Typography>
                <Typography variant="body2">
                  ?? {selectedIssue.commentsCount} comments
                </Typography>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button
                variant="contained"
                startIcon={<ViewIcon />}
                onClick={() => handleViewIssue(selectedIssue.id)}
                data-testid="cs-map-view-issue"
              >
                View Details
              </Button>
              
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  );
};

export default MapView;