import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Direct imports now that dependencies are installed
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


interface LocationDisplayMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  description?: string;
  height?: string;
  width?: string;
  zoom?: number;
  showPopup?: boolean;
}

const LocationDisplayMap: React.FC<LocationDisplayMapProps> = React.memo(({
  latitude,
  longitude,
  address,
  title = 'Service Request Location',
  description,
  height = '300px',
  width = '100%',
  zoom = 15,
  showPopup = true
}) => {
  const position: [number, number] = [latitude, longitude];


  return (
    <Box sx={{ width, height }}>
      <Paper elevation={2} sx={{ height: '100%', overflow: 'hidden' }}>
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={position}>
            {showPopup && (
              <Popup>
                <Box sx={{ minWidth: 200, p: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {title}
                  </Typography>
                  
                  {address && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {address}
                    </Typography>
                  )}
                  
                  {description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {description}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                  </Typography>
                </Box>
              </Popup>
            )}
          </Marker>
        </MapContainer>
      </Paper>
    </Box>
  );
});

export default LocationDisplayMap;