# GPS Proximity Sorting Feature

## Overview
Added GPS-based proximity sorting functionality to both the Map View and Schedule View, allowing users to find the nearest swimming pools based on their current location.

## Changes Made

### 1. Utility Functions (`apps/web/src/lib/utils.ts`)
Added geolocation and distance calculation utilities:

- **`UserLocation` interface**: Type definition for GPS coordinates
- **`calculateDistance()`**: Haversine formula implementation to calculate distance between two GPS coordinates in kilometers
- **`formatDistance()`**: Formats distance for display (meters if < 1km, otherwise kilometers)
- **`getUserLocation()`**: Browser geolocation API wrapper with error handling and timeout configuration

### 2. Map View (`apps/web/src/pages/MapView.tsx`)
Enhanced the map view with proximity-based features:

#### New State Management
- `userLocation`: Stores user's GPS coordinates
- `locationError`: Tracks geolocation errors
- `sortByDistance`: Toggle for distance-based sorting
- `isLoadingLocation`: Loading state for location requests

#### Features Added
- **"Show nearest pools" button**: Requests user's location and enables distance sorting
- **Distance calculation**: Automatically calculates distance from user to each facility
- **Sorting**: Facilities can be sorted by proximity when location is enabled
- **Distance display**: Shows distance in facility popups and sidebar
- **Location controls**: Toggle between default order and distance sorting
- **Clear location**: Option to disable location tracking and reset sorting

#### UI Enhancements
- Green badge showing distance in facility details
- Location status indicator in bottom overlay
- Sort/Default toggle buttons
- Error messages for location permission issues

### 3. Schedule View (`apps/web/src/pages/ScheduleView.tsx`)
Added similar proximity features for schedule browsing:

#### New State Management
- Same location-related states as Map View
- `SessionWithDistance` interface: Extended session type with distance field

#### Features Added
- **"Sort by distance" button**: Enables GPS-based sorting in schedule view
- **Distance calculation**: Calculates distance for each session's facility
- **List view sorting**: Sessions sorted by facility distance
- **Table view sorting**: Facilities sorted by distance in weekly table
- **Distance display**: Shows distance next to facility names in both views
- **Location controls**: Same control panel as Map View

#### UI Enhancements
- Green text showing distance next to facility names
- Location control panel integrated with view toggle and filters
- Error banner for location issues
- Consistent styling with Map View

## Technical Implementation

### Distance Calculation
Uses the Haversine formula to calculate great-circle distance between two points on Earth:
```typescript
R = 6371 // Earth's radius in km
distance = R * 2 * atan2(√a, √(1-a))
where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
```

### Geolocation Configuration
- **High accuracy mode**: Enabled for better precision
- **Timeout**: 10 seconds to prevent indefinite waiting
- **Maximum age**: 5 minutes cache for location data
- **Error handling**: Graceful degradation with user-friendly error messages

### Permission Handling
The feature properly handles:
- Permission denied
- Position unavailable
- Timeout errors
- Browser not supporting geolocation

## User Experience

### Map View Flow
1. User clicks "Show nearest pools"
2. Browser requests location permission
3. Once granted, distances are calculated
4. Facilities automatically sorted by proximity
5. Distance shown in popup and sidebar
6. User can toggle sorting or clear location

### Schedule View Flow
1. User clicks "Sort by distance" button
2. Browser requests location permission
3. Sessions/facilities sorted by proximity
4. Distance displayed next to facility names
5. Works in both list and table views
6. User can toggle sorting or clear location

## Benefits

1. **Improved Discoverability**: Users can quickly find nearby pools
2. **Better Planning**: See exact distances to make informed decisions
3. **Accessibility**: Simple one-click activation
4. **Privacy-Conscious**: Users control when location is shared
5. **Cross-Platform**: Works on desktop and mobile browsers
6. **Performance**: Efficient client-side calculation
7. **Error Resilient**: Graceful fallback if location unavailable

## Browser Compatibility
Requires browsers with Geolocation API support (all modern browsers):
- Chrome/Edge 5+
- Firefox 3.5+
- Safari 5+
- Opera 10.6+
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Future Enhancements
Potential improvements for future iterations:
- Save user's preferred sorting method in local storage
- Show user's location marker on map
- Add radius filter (e.g., "within 5km")
- Automatic location update when user moves
- Integration with device compass for direction
- Driving/walking distance via routing APIs

