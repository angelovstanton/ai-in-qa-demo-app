import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Map as MapIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  MyLocation as MyLocationIcon,
  Layers as LayersIcon,
  Assignment as AssignmentIcon,
  DirectionsCar as CarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import fieldAgentService from '../../services/fieldAgentService';
import type { WorkOrder, AgentStatus } from '../../services/fieldAgentService';

const MapViewPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [mapView, setMapView] = useState<'satellite' | 'roadmap' | 'hybrid'>('roadmap');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [workOrdersResponse, statusResponse] = await Promise.all([
        fieldAgentService.getWorkOrders({ limit: 50 }),
        fieldAgentService.getCurrentStatus().catch(() => ({ data: null }))
      ]);
      
      setWorkOrders(workOrdersResponse.data);
      setAgentStatus(statusResponse.data);
    } catch (err) {
      console.error('Failed to load map data:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'NORMAL': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#4caf50';
      case 'IN_PROGRESS': return '#2196f3';
      case 'ON_SITE': return '#00bcd4';
      case 'EN_ROUTE': return '#ff9800';
      case 'ASSIGNED': return '#757575';
      default: return '#757575';
    }
  };

  const handleNavigateToLocation = (workOrder: WorkOrder) => {
    if (workOrder.navigationLink) {
      window.open(workOrder.navigationLink, '_blank');
    } else if (workOrder.gpsLat && workOrder.gpsLng) {
      const googleMapsUrl = `https://maps.google.com/directions?q=${workOrder.gpsLat},${workOrder.gpsLng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="cs-map-view-page" sx={{ pb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Map View
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View work orders on map and navigate to locations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={loadMapData}>
              <RefreshIcon />
            </IconButton>
            <ToggleButtonGroup
              size="small"
              value={mapView}
              exclusive
              onChange={(e, newView) => newView && setMapView(newView)}
            >
              <ToggleButton value="roadmap">
                <MapIcon />
              </ToggleButton>
              <ToggleButton value="satellite">
                <LayersIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current Location Card */}
      {agentStatus && agentStatus.currentLocation && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MyLocationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Your Current Location</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Lat: {JSON.parse(agentStatus.currentLocation as string).lat.toFixed(6)}, 
              Lng: {JSON.parse(agentStatus.currentLocation as string).lng.toFixed(6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {agentStatus.status} | Vehicle: {agentStatus.vehicleStatus || 'Unknown'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Map Placeholder */}
      <Card sx={{ mb: 3, minHeight: 400 }}>
        <CardContent>
          <Box 
            sx={{ 
              height: 350,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 1
            }}
          >
            <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Interactive Map View
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              This would display an interactive map with work order markers,<br />
              your current location, and navigation routes.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Work Orders on Map ({workOrders.length})
          </Typography>
          
          {workOrders.length > 0 ? (
            <List>
              {workOrders.map((order) => (
                <ListItem 
                  key={order.id}
                  button
                  onClick={() => navigate(`/agent/work-orders/${order.id}`)}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: getPriorityColor(order.priority),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" color="white" sx={{ fontSize: 10 }}>
                        {order.priority.charAt(0)}
                      </Typography>
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {order.request.title}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          size="small"
                          sx={{ 
                            bgcolor: getStatusColor(order.status),
                            color: 'white'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <LocationIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          {order.request.streetAddress}, {order.request.city}
                        </Typography>
                        {order.gpsLat && order.gpsLng && (
                          <Typography variant="caption" color="text.secondary">
                            {order.gpsLat.toFixed(4)}, {order.gpsLng.toFixed(4)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToLocation(order);
                    }}
                    disabled={!order.gpsLat && !order.navigationLink}
                  >
                    <NavigationIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No work orders with location data
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Map Legend
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: '50%', mr: 1 }} />
              <Typography variant="caption">Emergency</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: '50%', mr: 1 }} />
              <Typography variant="caption">High Priority</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: '50%', mr: 1 }} />
              <Typography variant="caption">Normal</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: '50%', mr: 1 }} />
              <Typography variant="caption">Low Priority</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MapViewPage;