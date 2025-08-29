# 🗺️ Leaflet Map Integration Installation Guide

## Required Dependencies

The map integration requires these npm packages to be installed:

```bash
npm install leaflet react-leaflet @types/leaflet
```

## Installation Steps

1. **Open a terminal/command prompt** in the UI directory:
   ```
   cd C:\SourceCode\ai-in-qa-demo-app\city-services-portal\ui
   ```

2. **Install the required packages:**
   ```bash
   npm install leaflet react-leaflet @types/leaflet
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## What Was Implemented

✅ **Map Components Created:**
- `LocationMapComponent.tsx` - Interactive map for service request form
- `LocationDisplayMap.tsx` - Read-only map for request details page

✅ **Form Integration:**
- Updated `LocationStep.tsx` with side-by-side map and address fields
- Added latitude/longitude fields to form schema
- Real-time geocoding and coordinate updates

✅ **Features:**
- 📍 Interactive pin dropping
- 🎯 Current location detection
- 🗺️ Address-to-coordinates geocoding
- 📊 Map display on request details page
- 🔄 Two-way sync between address fields and map

## Verification

After installation, you should be able to:

1. **Create new service requests** with map integration on the location step
2. **View existing requests** with location maps on the detail page
3. **Use current location** button to auto-detect your position
4. **Click anywhere on the map** to place/move the location pin

## Troubleshooting

If you still get import errors after installation:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**
   ```bash
   rmdir /s node_modules
   npm install
   ```

3. **Restart your development server** completely

## Alternative: Temporary Fallback

If you need to run the app immediately without map functionality, the fallback components will display placeholder content until the dependencies are installed.