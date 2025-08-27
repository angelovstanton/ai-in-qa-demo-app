import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Map as MapIcon,
} from '@mui/icons-material';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  source: 'geolocation' | 'map' | 'search';
}

interface LocationPickerProps {
  onLocationChange?: (location: LocationData | null) => void;
  initialLocation?: LocationData;
  mapHeight?: number;
  showSearch?: boolean;
  showGeolocation?: boolean;
  disabled?: boolean;
}

interface SearchResult {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationChange,
  initialLocation,
  mapHeight = 400,
  showSearch = true,
  showGeolocation = true,
  disabled = false,
}) => {
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Initialize map (using Leaflet as a simple alternative to Google Maps)
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainerRef.current || mapLoaded) return;

      try {
        // For demo purposes, we'll create a simple interactive map
        // In a real app, you'd use Leaflet, Google Maps, or another mapping library
        const mapContainer = mapContainerRef.current;
        mapContainer.innerHTML = `

          <div style="
            width: 100%;
            height: ${mapHeight}px;
            background: linear-gradient(45deg, #e3f2fd 25%, transparent 25%), 
                        linear-gradient(-45deg, #e3f2fd 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #e3f2fd 75%), 
                        linear-gradient(-45deg, transparent 75%, #e3f2fd 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            border: 2px solid #ccc;
            border-radius: 8px;
            position: relative;
            cursor: crosshair;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            color: #666;
          ">

            <div style="
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 300px;
            ">
              <div style="font-size: 48px; margin-bottom: 10px;">???</div>
              <div style="font-weight: bold; margin-bottom: 8px;">Interactive Map</div>
              <div style="font-size: 14px; color: #888;">
                ${location ? 'Selected: ' + (location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`) : 'Click anywhere to select a location'}
              </div>
              ${location ? `

                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-size: 24px;
                  color: #1976d2;
                  background: white;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">??</div>
              ` : ''}
            </div>
          </div>
        `;

        // Add click event listener for location selection
        mapContainer.addEventListener('click', handleMapClick);
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setLocationError('Failed to load map');
      }
    };

    initializeMap();

    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener('click', handleMapClick);
      }
    };
  }, [mapHeight, location]);

  const handleMapClick = (event: MouseEvent) => {
    if (disabled) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert click coordinates to mock lat/lng
    // In a real implementation, this would use the map library's conversion
    const latitude = 42.6977 + (0.5 - y / rect.height) * 0.1; // Sofia, Bulgaria area
    const longitude = 23.3219 + (x / rect.width - 0.5) * 0.1;

    const newLocation: LocationData = {
      latitude,
      longitude,
      address: `Selected location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      source: 'map',
    };

    setLocation(newLocation);
    onLocationChange?.(newLocation);
    setLocationError(null);

    // Re-render map with new location
    setMapLoaded(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: `Current location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          source: 'geolocation',
        };

        setLocation(newLocation);
        onLocationChange?.(newLocation);
        setIsLoadingLocation(false);
        setMapLoaded(false); // Re-render map with new location
      },
      (error) => {
        let errorMessage = 'Failed to get current location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Mock search results - in a real app, you'd use a geocoding service
      const mockResults: SearchResult[] = [
        {
          id: '1',
          address: `${query} Street, Sofia, Bulgaria`,

          latitude: 42.6977 + Math.random() * 0.1,
          longitude: 23.3219 + Math.random() * 0.1,
          type: 'street',
        },
        {
          id: '2',
          address: `${query} Boulevard, Sofia, Bulgaria`,

          latitude: 42.6977 + Math.random() * 0.1,
          longitude: 23.3219 + Math.random() * 0.1,
          type: 'street',
        },
        {
          id: '3',
          address: `${query} Square, Sofia, Bulgaria`,

          latitude: 42.6977 + Math.random() * 0.1,
          longitude: 23.3219 + Math.random() * 0.1,
          type: 'square',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    const newLocation: LocationData = {
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      source: 'search',
    };

    setLocation(newLocation);
    onLocationChange?.(newLocation);
    setSearchQuery(result.address);
    setSearchResults([]);
    setMapLoaded(false); // Re-render map with new location
  };

  const clearLocation = () => {
    setLocation(null);
    onLocationChange?.(null);
    setSearchQuery('');
    setSearchResults([]);
    setLocationError(null);
    setMapLoaded(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 3) {
      searchLocations(value);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <Card data-testid="cs-location-picker">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MapIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Location Selection
          </Typography>
        </Box>

        {locationError && (
          <Alert severity="error" sx={{ mb: 2 }} data-testid="cs-location-error">
            {locationError}
          </Alert>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {showGeolocation && (
            <Button
              variant="outlined"
              startIcon={isLoadingLocation ? <CircularProgress size={20} /> : <MyLocationIcon />}
              onClick={getCurrentLocation}
              disabled={disabled || isLoadingLocation}
              data-testid="cs-location-geolocation"
            >
              {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>
          )}

          {location && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearLocation}
              disabled={disabled}
              data-testid="cs-location-clear"
            >
              Clear Location
            </Button>
          )}
        </Box>

        {/* Search */}
        {showSearch && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for an address or location..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              disabled={disabled}
              data-testid="cs-location-search"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: isSearching ? <CircularProgress size={20} /> : null,
              }}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }} data-testid="cs-location-search-results">
                <List dense>
                  {searchResults.map((result) => (
                    <ListItemButton
                      key={result.id}
                      onClick={() => handleSearchSelect(result)}
                      data-testid={`cs-location-search-result-${result.id}`}

                    >
                      <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={result.address}
                        secondary={
                          <Chip
                            label={result.type}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Map Container */}
        <Box
          ref={mapContainerRef}
          data-testid="cs-location-map"
          sx={{
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
        />

        {/* Selected Location Display */}
        {location && (
          <Paper sx={{ p: 2, bgcolor: 'primary.50' }} data-testid="cs-location-selected">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="primary">
                Selected Location
              </Typography>
              <Chip
                label={location.source}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ ml: 'auto' }}
              />
            </Box>
            
            <Typography variant="body2" gutterBottom>
              {location.address || 'Custom location'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Lat: {location.latitude.toFixed(6)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Lng: {location.longitude.toFixed(6)}
              </Typography>
              {location.accuracy && (
                <Typography variant="caption" color="text.secondary">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Instructions */}
        {!location && (
          <Alert severity="info" data-testid="cs-location-instructions">
            <Typography variant="body2">
              Select a location by:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {showGeolocation && <li>Using your current location</li>}
              {showSearch && <li>Searching for an address</li>}
              <li>Clicking on the map</li>
            </ul>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationPicker;