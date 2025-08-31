import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip } from '@mui/material';
import type { WorkOrder } from '../services/fieldAgentService';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  workOrders: WorkOrder[];
  currentLocation?: { lat: number; lng: number };
  mapView: 'satellite' | 'roadmap' | 'hybrid';
  onMarkerClick?: (workOrder: WorkOrder) => void;
}

// Custom icons for different priority levels
const createCustomIcon = (color: string, label: string) => {
  const svgIcon = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="10" fill="white"/>
      <text x="15" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${label}</text>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'EMERGENCY':
      return createCustomIcon('#f44336', 'E');
    case 'HIGH':
      return createCustomIcon('#ff9800', 'H');
    case 'NORMAL':
      return createCustomIcon('#2196f3', 'N');
    case 'LOW':
      return createCustomIcon('#4caf50', 'L');
    default:
      return createCustomIcon('#757575', '?');
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

// Component to handle map centering and bounds
function MapController({ center, bounds }: { center: [number, number], bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  
  return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  workOrders,
  currentLocation,
  mapView,
  onMarkerClick
}) => {
  // Calculate bounds for all work orders
  const calculateBounds = useMemo(() => {
    const validOrders = workOrders.filter(o => o.gpsLat && o.gpsLng);
    
    if (validOrders.length === 0) return null;
    
    let minLat = validOrders[0].gpsLat!;
    let maxLat = validOrders[0].gpsLat!;
    let minLng = validOrders[0].gpsLng!;
    let maxLng = validOrders[0].gpsLng!;
    
    validOrders.forEach(order => {
      if (order.gpsLat! < minLat) minLat = order.gpsLat!;
      if (order.gpsLat! > maxLat) maxLat = order.gpsLat!;
      if (order.gpsLng! < minLng) minLng = order.gpsLng!;
      if (order.gpsLng! > maxLng) maxLng = order.gpsLng!;
    });
    
    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1 || 0.01;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.01;
    
    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    ] as L.LatLngBoundsExpression;
  }, [workOrders]);
  
  // Calculate center based on work orders or default to Sofia, Bulgaria
  const calculateCenter = (): [number, number] => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lng];
    }
    
    // If we have work orders, center on them
    if (workOrders.length > 0) {
      const validOrders = workOrders.filter(o => o.gpsLat && o.gpsLng);
      if (validOrders.length > 0) {
        const avgLat = validOrders.reduce((sum, o) => sum + o.gpsLat!, 0) / validOrders.length;
        const avgLng = validOrders.reduce((sum, o) => sum + o.gpsLng!, 0) / validOrders.length;
        return [avgLat, avgLng];
      }
    }
    
    // Default to Sofia, Bulgaria
    return [42.6977, 23.3219];
  };
  
  const defaultCenter = calculateCenter();
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  // Determine tile layer based on mapView
  const getTileLayer = () => {
    switch (mapView) {
      case 'satellite':
        return (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'hybrid':
        return (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution=''
              url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
            />
          </>
        );
      default: // roadmap
        return (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        );
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={workOrders.length > 0 ? 12 : 11}
        style={{ height: '100%', width: '100%' }}
        bounds={calculateBounds || undefined}
      >
        {getTileLayer()}
        <MapController center={mapCenter} bounds={calculateBounds || undefined} />
        
        {/* Current location marker */}
        {currentLocation && (
          <>
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={L.divIcon({
                html: `
                  <div style="
                    width: 20px;
                    height: 20px;
                    background: #2196f3;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                `,
                className: 'current-location-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup>
                <Typography variant="body2" fontWeight="bold">
                  Your Current Location
                </Typography>
                <Typography variant="caption">
                  Lat: {currentLocation.lat.toFixed(6)}<br />
                  Lng: {currentLocation.lng.toFixed(6)}
                </Typography>
              </Popup>
            </Marker>
            
            {/* Accuracy circle around current location */}
            <Circle
              center={[currentLocation.lat, currentLocation.lng]}
              radius={50}
              pathOptions={{
                color: '#2196f3',
                fillColor: '#2196f3',
                fillOpacity: 0.1,
                weight: 2
              }}
            />
          </>
        )}
        
        {/* Work order markers */}
        {workOrders.map((order) => {
          if (!order.gpsLat || !order.gpsLng) return null;
          
          return (
            <Marker
              key={order.id}
              position={[order.gpsLat, order.gpsLng]}
              icon={getPriorityIcon(order.priority)}
              eventHandlers={{
                click: () => onMarkerClick?.(order)
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    {order.request.title}
                  </Typography>
                  
                  <Chip 
                    label={order.status} 
                    size="small"
                    sx={{ 
                      bgcolor: getStatusColor(order.status),
                      color: 'white',
                      mb: 1
                    }}
                  />
                  
                  <Typography variant="caption" display="block">
                    <strong>Order #:</strong> {order.orderNumber}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Priority:</strong> {order.priority}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Type:</strong> {order.taskType}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Address:</strong> {order.request.streetAddress}, {order.request.city}
                  </Typography>
                  
                  {order.estimatedDuration && (
                    <Typography variant="caption" display="block">
                      <strong>Est. Duration:</strong> {order.estimatedDuration} min
                    </Typography>
                  )}
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Add custom styles for markers */}
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .current-location-marker {
          background: transparent;
          border: none;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default InteractiveMap;