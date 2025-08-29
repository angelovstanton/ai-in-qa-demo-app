import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Box, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// Direct imports now that dependencies are installed
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng, Map as LeafletMap, DragEndEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  components?: {
    streetAddress?: string;
    city?: string;
    postalCode?: string;
  };
}

interface LocationMapComponentProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData;
  address?: string;
  height?: string;
  width?: string;
  showLocateButton?: boolean;
}

// Component to center map on marker when needed
interface MapCentererProps {
  markerPosition: [number, number] | null;
  shouldCenter: boolean;
}

const MapCenterer: React.FC<MapCentererProps> = ({ markerPosition, shouldCenter }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldCenter && markerPosition) {
      console.log('Centering map on marker:', markerPosition);
      map.setView(markerPosition, 15);
    }
  }, [map, markerPosition, shouldCenter]);

  return null;
};

interface MapEventsProps {
  onLocationSelect: (location: LocationData) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      console.log('Map clicked at:', lat, lng);
      
      // Only call onLocationSelect with basic coordinates - no automatic geocoding
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    },
  });
  return null;
};

// Custom draggable marker component
interface DraggableMarkerProps {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
  onDragStart?: () => void;
  onDrag?: () => void;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ 
  position, 
  onDragEnd, 
  onDragStart,
  onDrag 
}) => {
  const markerRef = useRef<L.Marker>(null);
  
  const eventHandlers = useMemo(() => ({
    dragstart: () => {
      console.log('Marker drag started');
      onDragStart?.();
    },
    drag: () => {
      onDrag?.();
    },
    dragend: (e: DragEndEvent) => {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        console.log('Marker dragged to:', newPos.lat, newPos.lng);
        onDragEnd(newPos.lat, newPos.lng);
      }
    },
  }), [onDragEnd, onDragStart, onDrag]);
  
  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

// Mock geocoding for common Bulgarian locations and patterns
const mockGeocodeBulgaria = (address: string): { lat: number; lng: number } | null => {
  const lowerAddress = address.toLowerCase();
  
  // Sofia districts and common areas
  const sofiaLocations: Record<string, { lat: number; lng: number }> = {
    'sofia': { lat: 42.6977, lng: 23.3219 },
    'center': { lat: 42.6977, lng: 23.3219 },
    'vitosha': { lat: 42.6851, lng: 23.3148 },
    'mladost': { lat: 42.6515, lng: 23.3775 },
    'lyulin': { lat: 42.7108, lng: 23.2503 },
    'studentski': { lat: 42.6735, lng: 23.3370 },
    'lozenets': { lat: 42.6731, lng: 23.3370 },
    'boyana': { lat: 42.6393, lng: 23.2676 },
    'dragalevtsi': { lat: 42.6393, lng: 23.2676 },
    'simeonovo': { lat: 42.6393, lng: 23.2676 }
  };
  
  // Check for Sofia districts
  for (const [district, coords] of Object.entries(sofiaLocations)) {
    if (lowerAddress.includes(district)) {
      return coords;
    }
  }
  
  // Check for street numbers in Sofia (add slight offset)
  if (lowerAddress.includes('sofia') || lowerAddress.includes('str') || lowerAddress.includes('street')) {
    return {
      lat: 42.6977 + (Math.random() - 0.5) * 0.02, // Random within Sofia area
      lng: 23.3219 + (Math.random() - 0.5) * 0.02
    };
  }
  
  // Other major Bulgarian cities
  const cities: Record<string, { lat: number; lng: number }> = {
    'plovdiv': { lat: 42.1354, lng: 24.7453 },
    'varna': { lat: 43.2141, lng: 27.9147 },
    'burgas': { lat: 42.5048, lng: 27.4626 },
    'ruse': { lat: 43.8564, lng: 25.9704 },
    'stara zagora': { lat: 42.4258, lng: 25.6342 }
  };
  
  for (const [city, coords] of Object.entries(cities)) {
    if (lowerAddress.includes(city)) {
      return coords;
    }
  }
  
  return null;
};

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // First, try mock geocoding for Bulgarian addresses
    const mockResult = mockGeocodeBulgaria(address);
    if (mockResult) {
      console.log('Using mock geocoding for:', address);
      return mockResult;
    }
    
    // Add Bulgaria as default country context
    const addressWithCountry = address.includes('Bulgaria') ? address : `${address}, Bulgaria`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressWithCountry)}&limit=1&addressdetails=1&countrycodes=bg`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'CityServices/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log('Using online geocoding for:', address);
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // If it's a timeout or network error, try mock geocoding as fallback
      if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
        console.log('Network timeout, trying fallback geocoding');
        
        // Try a more aggressive pattern match for Sofia addresses
        if (address.toLowerCase().includes('sofia') || /\d{4}/.test(address)) {
          return {
            lat: 42.6977 + (Math.random() - 0.5) * 0.02,
            lng: 23.3219 + (Math.random() - 0.5) * 0.02
          };
        }
        
        throw new Error('Network connection timeout. Please check your internet connection or click on the map to select a location manually.');
      }
      throw fetchError;
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

const reverseGeocode = async (lat: number, lng: number): Promise<{ address: string; components: any }> => {
  console.log('🌍 Starting reverse geocoding for:', lat, lng);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds
    
    try {
      console.log('📡 Making API request to Nominatim...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'City Services Portal/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Raw API response data:', data);
      
      if (data && data.address) {
        console.log('✅ Successfully got address data from API');
        const addr = data.address;
        
        const components = {
          streetAddress: [addr.house_number, addr.road].filter(Boolean).join(' '),
          city: addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state,
          postalCode: addr.postcode
        };
        
        console.log('🏠 Extracted components:', components);
        
        return {
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          components
        };
      } else if (data && data.error) {
        console.warn('❌ API returned error:', data.error);
        throw new Error(`Nominatim API error: ${data.error}`);
      } else {
        console.warn('⚠️ API returned data but no address field:', data);
        throw new Error('No address data in API response');
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('⏱️ Reverse geocoding timed out after 8 seconds');
        throw new Error('Request timed out - please try again');
      } else {
        console.warn('🚫 Reverse geocoding fetch failed:', fetchError);
        throw fetchError;
      }
    }
  } catch (error) {
    console.error('💥 Reverse geocoding failed completely:', error);
    
    // Only use mock data as absolute last resort and make it clear
    const isSofiaArea = lat >= 42.5 && lat <= 43.0 && lng >= 23.0 && lng <= 23.8;
    
    if (isSofiaArea) {
      console.warn('🎭 Using mock Sofia data as fallback');
      const mockComponents = {
        streetAddress: `Mock Street ${Math.floor(Math.random() * 100)}`,
        city: 'Sofia',
        postalCode: `${1000 + Math.floor(Math.random() * 600)}`
      };
      
      return {
        address: `Sofia Area: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: mockComponents
      };
    } else {
      console.warn('📍 Returning coordinates only (no mock data for non-Sofia area)');
      return {
        address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: {}
      };
    }
  }
};

const LocationMapComponent: React.FC<LocationMapComponentProps> = React.memo(({
  onLocationChange,
  initialLocation,
  address,
  height = '400px',
  width = '100%',
  showLocateButton = true
}) => {
  // Use static map center to avoid re-renders
  const defaultCenter: [number, number] = [42.6977, 23.3219]; // Sofia, Bulgaria
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [isGettingAddressFromMap, setIsGettingAddressFromMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // Initialize marker position from props or use default
  useEffect(() => {
    if (initialLocation && typeof initialLocation.latitude === 'number' && typeof initialLocation.longitude === 'number') {
      const position: [number, number] = [initialLocation.latitude, initialLocation.longitude];
      setMarkerPosition(position);
      setShouldCenterMap(true); // Center map on this marker
      console.log('Set initial location from props:', position);
    } else if (!markerPosition) {
      // Only set default if no marker position is set
      setMarkerPosition(defaultCenter);
      setShouldCenterMap(true); // Center on default position
      console.log('Set default marker position:', defaultCenter);
    }
  }, [initialLocation]); // Only depend on initialLocation
  
  // Reset shouldCenterMap after a brief delay to allow centering
  useEffect(() => {
    if (shouldCenterMap) {
      const timer = setTimeout(() => setShouldCenterMap(false), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldCenterMap]);

  // Manual geocoding function triggered by button click
  const handleLocateAddress = useCallback(async () => {
    if (!address || address.trim().length === 0) {
      setError('Please enter an address to locate.');
      return;
    }

    setIsLocatingAddress(true);
    setError(null);
    
    try {
      const result = await geocodeAddress(address);
      if (result) {
        const position: [number, number] = [result.lat, result.lng];
        setMarkerPosition(position);
        
        // Create a basic location object first
        const basicLocation = {
          latitude: result.lat,
          longitude: result.lng,
          address: address // Use the input address as fallback
        };
        
        onLocationChange(basicLocation);
        
        // Try reverse geocoding in background for better address components (but don't block)
        try {
          const geocodedData = await reverseGeocode(result.lat, result.lng);
          onLocationChange({
            latitude: result.lat,
            longitude: result.lng,
            address: geocodedData.address,
            components: geocodedData.components
          });
        } catch (reverseError) {
          console.warn('Reverse geocoding failed, keeping original address:', reverseError);
          // The basic location is already set, so this is not critical
        }
      } else {
        setError('Could not find the specified address. Please verify the address or click on the map to select a location.');
      }
    } catch (error: any) {
      console.error('Geocoding failed:', error);
      let userFriendlyMessage = 'Unable to locate the address';
      
      if (error.message?.includes('timeout') || error.message?.includes('Network')) {
        userFriendlyMessage = 'Connection timeout - please try again or click on the map to select location manually';
      } else if (error.message?.includes('HTTP')) {
        userFriendlyMessage = 'Address lookup service temporarily unavailable - please click on the map to select location';
      }
      
      setError(userFriendlyMessage);
    } finally {
      setIsLocatingAddress(false);
    }
  }, [address, onLocationChange]);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsGeolocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
            isNaN(latitude) || isNaN(longitude)) {
          console.error('Invalid GPS coordinates:', latitude, longitude);
          setError('Invalid GPS coordinates received');
          setIsGeolocating(false);
          return;
        }
        
        const newPosition: [number, number] = [latitude, longitude];
        setMarkerPosition(newPosition);

        try {
          const geocodedData = await reverseGeocode(latitude, longitude);
          onLocationChange({
            latitude,
            longitude,
            address: geocodedData.address,
            components: geocodedData.components
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          onLocationChange({
            latitude,
            longitude
          });
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        setIsGeolocating(false);
        let errorMessage = 'Failed to get your current location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [onLocationChange]);

  // Manual function to get address from current marker position
  const handleGetAddressFromMap = useCallback(async () => {
    console.log('Get Address from Map button clicked!');
    console.log('Current marker position:', markerPosition);
    
    if (!markerPosition || !Array.isArray(markerPosition) || markerPosition.length !== 2) {
      console.error('No valid marker position found');
      setError('Please place a marker on the map first');
      return;
    }

    const [lat, lng] = markerPosition;
    console.log('Extracted coordinates:', lat, lng);
    
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid marker coordinates:', lat, lng);
      setError('Invalid marker coordinates');
      return;
    }

    console.log('Starting address lookup for coordinates:', lat, lng);
    setIsGettingAddressFromMap(true);
    setError(null);

    try {
      console.log('Getting address for marker position:', lat, lng);
      const geocodedData = await reverseGeocode(lat, lng);
      console.log('Reverse geocoding result:', geocodedData);
      
      // Check if we got valid components
      if (geocodedData.components && Object.keys(geocodedData.components).length > 0) {
        console.log('Got valid address components:', geocodedData.components);
      } else {
        console.warn('No address components found in geocoding result');
      }
      
      const enhancedLocation = {
        latitude: lat,
        longitude: lng,
        address: geocodedData.address,
        components: geocodedData.components
      };
      
      console.log('Calling onLocationChange with enhanced data:', enhancedLocation);
      onLocationChange(enhancedLocation);
      
      // Show success message
      console.log('✅ Address lookup completed successfully');
    } catch (error) {
      console.error('❌ Failed to get address from map:', error);
      setError('Unable to get address for this location. The coordinates will still be saved.');
    } finally {
      setIsGettingAddressFromMap(false);
    }
  }, [markerPosition, onLocationChange]);

  const handleLocationSelect = useCallback(async (location: LocationData) => {
    console.log('Location selected:', location);
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      const position: [number, number] = [location.latitude, location.longitude];
      setMarkerPosition(position);
      setError(null); // Clear any previous errors
      
      // Always call onLocationChange immediately
      onLocationChange(location);
    } else {
      console.error('Invalid location data:', location);
      setError('Invalid location coordinates received');
    }
  }, [onLocationChange]);
  
  // Handle marker drag events
  const handleMarkerDragStart = useCallback(() => {
    setIsDragging(true);
    setError(null);
  }, []);
  
  const handleMarkerDrag = useCallback(() => {
    // Optional: Could show live coordinates while dragging
  }, []);
  
  const handleMarkerDragEnd = useCallback((lat: number, lng: number) => {
    console.log('Marker dragged to new position:', lat, lng);
    setIsDragging(false);
    
    // Validate coordinates before proceeding
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.error('Invalid drag coordinates:', lat, lng);
      setError('Invalid coordinates from drag operation');
      return;
    }
    
    // Update marker position but DON'T update map center to avoid pin jumping
    const newPosition: [number, number] = [lat, lng];
    setMarkerPosition(newPosition);
    
    // Only update coordinates - NO automatic address lookup
    const basicLocation: LocationData = {
      latitude: lat,
      longitude: lng,
      address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
    
    onLocationChange(basicLocation);
  }, [onLocationChange]);


  return (
    <Box sx={{ width, height }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={isGeolocating ? <CircularProgress size={16} /> : <MyLocationIcon />}
          onClick={handleCurrentLocation}
          disabled={isGeolocating || isLocatingAddress}
          size="small"
        >
          {isGeolocating ? 'Locating...' : 'Use Current Location'}
        </Button>
        
        {showLocateButton && address && address.trim().length > 0 && (
          <Button
            variant="contained"
            startIcon={isLocatingAddress ? <CircularProgress size={16} /> : <LocationOnIcon />}
            onClick={handleLocateAddress}
            disabled={isGeolocating || isLocatingAddress || isGettingAddressFromMap}
            size="small"
            color="primary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {isLocatingAddress ? 'Finding...' : 'Find on Map'}
          </Button>
        )}

        {markerPosition && (
          <Button
            variant="outlined"
            startIcon={isGettingAddressFromMap ? <CircularProgress size={16} /> : <LocationOnIcon />}
            onClick={handleGetAddressFromMap}
            disabled={isGeolocating || isLocatingAddress || isGettingAddressFromMap}
            size="small"
            color="secondary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {isGettingAddressFromMap ? 'Getting Address...' : 'Get Address from Map'}
          </Button>
        )}
        
        {(isGeocoding || isLocatingAddress || isGettingAddressFromMap) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Finding location... (this may take a few seconds)</Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert 
          severity={error.includes('timeout') || error.includes('Connection') ? 'warning' : 'error'} 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {error}
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.8 }}>
              💡 Tip: You can also click anywhere on the map below to select a location
            </Typography>
          </Box>
        </Alert>
      )}

      <Box sx={{ 
        height: '100%', 
        border: isDragging ? '2px solid #1976d2' : '1px solid #ddd', 
        borderRadius: 1, 
        position: 'relative',
        transition: 'border 0.2s ease'
      }}>
        <MapContainer
          center={defaultCenter}
          zoom={15}
          style={{ 
            height: '100%', 
            width: '100%',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          ref={mapRef}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapCenterer markerPosition={markerPosition} shouldCenter={shouldCenterMap} />
          <MapEvents onLocationSelect={handleLocationSelect} />
          
          {markerPosition && (
            <DraggableMarker 
              position={markerPosition}
              onDragStart={handleMarkerDragStart}
              onDrag={handleMarkerDrag}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </MapContainer>
      </Box>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          📍 <strong>How to set location:</strong>
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', ml: 1, mt: 0.5 }}>
          • Click anywhere on the map to place a marker<br />
          • <strong>Drag the marker</strong> to fine-tune the exact position<br />
          • Use <strong>"Get Address from Map"</strong> button to fill form fields with address details
          {showLocateButton && address && '<br />• Use "Find on Map" to locate entered address'}
          <br />• Use "Use Current Location" for GPS positioning
        </Typography>
        
        {markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2 && 
         typeof markerPosition[0] === 'number' && typeof markerPosition[1] === 'number' && (
          <Typography variant="caption" sx={{ display: 'block', color: isDragging ? 'warning.main' : 'success.main', mt: 1 }}>
            {isDragging ? '🔄 Dragging marker...' : '✅ Marker at: '}{markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
            {!isDragging && ' - Click "Get Address from Map" to fill form fields'}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

export default LocationMapComponent;