import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngBounds } from "leaflet";
import { facilityApi, getApiErrorMessage } from "@/lib/api";
import {
  formatTimeRange,
  formatDate,
  getUserLocation,
  calculateDistance,
  formatDistance,
  getFavorites,
  toggleFavorite,
  type UserLocation,
} from "@/lib/utils";
import {
  MapPin,
  ExternalLink,
  Phone,
  AlertCircle,
  RefreshCw,
  Navigation,
  Locate,
  Star,
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import type { Facility } from "@/types";

// Toronto coordinates
const TORONTO_CENTER: [number, number] = [43.6532, -79.3832];

// Custom icons
const poolIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const favoritePoolIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userLocationIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Extended Facility type with distance
interface FacilityWithDistance extends Facility {
  distance?: number;
}

// Map controller component to handle auto-zoom based on location
function MapController({
  userLocation,
  facilities,
}: {
  userLocation: UserLocation | null;
  facilities: FacilityWithDistance[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || facilities.length === 0) return;

    // Calculate distances and find nearby facilities (within 10km)
    const nearbyFacilities = facilities.filter((f) => {
      if (!f.latitude || !f.longitude) return false;
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        f.latitude,
        f.longitude
      );
      return distance <= 10; // 10km radius
    });

    if (nearbyFacilities.length === 0) {
      // No nearby facilities, just center on user location with a reasonable zoom
      map.setView([userLocation.latitude, userLocation.longitude], 12);
      return;
    }

    // Create bounds that include user location and nearby facilities
    const bounds = new LatLngBounds([
      [userLocation.latitude, userLocation.longitude],
    ]);

    nearbyFacilities.forEach((f) => {
      if (f.latitude && f.longitude) {
        bounds.extend([f.latitude, f.longitude]);
      }
    });

    // Fit the map to these bounds with padding
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
    });
  }, [userLocation, facilities, map]);

  return null;
}

export default function MapView() {
  const { isDarkMode } = useDarkMode();
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityWithDistance | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mapsModalAddress, setMapsModalAddress] = useState<string | null>(null);

  const {
    data: facilities,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["facilities", "lane-swim"],
    queryFn: () => facilityApi.getAll(true),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Automatically get user location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Handle toggling favorites
  const handleToggleFavorite = (facilityId: string | undefined) => {
    if (!facilityId) return;
    toggleFavorite(facilityId);
    setFavorites(getFavorites());
  };

  // Handle getting user location
  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setSortByDistance(true);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Failed to get location"
      );
      setSortByDistance(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate distances and sort facilities if user location is available
  const facilitiesWithDistance: FacilityWithDistance[] =
    facilities?.map((f) => {
      if (userLocation && f.latitude && f.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          f.latitude,
          f.longitude
        );
        return { ...f, distance };
      }
      return f;
    }) || [];

  // Sort facilities: favorites first, then by distance if enabled
  const sortedFacilities = [...facilitiesWithDistance].sort((a, b) => {
    const isFavA = favorites.has(a.facility_id);
    const isFavB = favorites.has(b.facility_id);

    // Favorites always come first
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    // Then sort by distance if enabled
    if (sortByDistance && userLocation) {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
    }

    return 0;
  });

  if (error) {
    const errorInfo = getApiErrorMessage(error);
    
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {errorInfo.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {errorInfo.message}
                </p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Troubleshooting Steps:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    {errorInfo.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                </ul>
                </div>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-2 bg-primary-500 dark:bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                  />
                  {isRefetching ? "Retrying..." : "Try Again"}
                </button>
                  <details className="mt-4">
                    <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                      Technical details
                    </summary>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded break-all">
                    {errorInfo.details}
                    </p>
                  </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validFacilities = sortedFacilities.filter(
    (f) => f.latitude && f.longitude
  );

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      {/* Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading pools...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={TORONTO_CENTER}
            zoom={11}
            className="h-full w-full"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {/* Map tiles with dark mode support */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={
                isDarkMode
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              }
              subdomains="abcd"
              maxZoom={20}
            />
            
            {/* Map controller for auto-zoom based on location */}
            <MapController
              userLocation={userLocation}
              facilities={validFacilities}
            />
            
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Locate className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold">Your Location</h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      Finding pools near you...
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Pool markers */}
            {validFacilities.map((facility) => {
              const isFavorited = favorites.has(facility.facility_id);
              return (
              <Marker
                key={facility.facility_id}
                position={[facility.latitude!, facility.longitude!]}
                  icon={isFavorited ? favoritePoolIcon : poolIcon}
                eventHandlers={{
                  click: () => setSelectedFacility(facility),
                }}
              >
                <Popup>
                  <div className="min-w-[250px]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg flex-1">
                          {facility.website ? (
                            <a
                              href={facility.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary-600 hover:underline transition-colors"
                            >
                      {facility.name}
                            </a>
                          ) : (
                            facility.name
                          )}
                    </h3>
                        <button
                          onClick={() => handleToggleFavorite(facility.facility_id)}
                          className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
                          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isFavorited
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      </div>
                    {facility.address && (
                      <p className="text-sm text-gray-600 mb-2 flex gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        {facility.address}
                      </p>
                    )}
                    {facility.distance !== undefined && facility.address && (
                      <button
                        onClick={() => setMapsModalAddress(facility.address!)}
                        className="bg-green-50 p-2 rounded mb-2 w-full hover:bg-green-100 transition-colors cursor-pointer text-left"
                        title="Open in maps"
                      >
                        <p className="text-xs font-semibold text-green-900 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          Distance (click to open in maps)
                        </p>
                        <p className="text-sm font-semibold">
                          {formatDistance(facility.distance)}
                        </p>
                      </button>
                    )}
                    {facility.next_session && (
                      <div className="bg-blue-50 p-2 rounded mb-2">
                        <p className="text-xs font-semibold text-blue-900">
                          Next Session
                        </p>
                        <p className="text-sm">
                          {formatDate(facility.next_session.date)}
                        </p>
                        <p className="text-sm">
                          {formatTimeRange(
                            facility.next_session.start_time,
                            facility.next_session.end_time
                          )}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {facility.session_count || 0} upcoming sessions
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
            })}
          </MapContainer>
        )}
      </div>

      {/* Sidebar - Full width on mobile, fixed width on desktop */}
      {selectedFacility && (
        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <button
            onClick={() => setSelectedFacility(null)}
            className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Close facility details"
          >
            ✕
          </button>

          <div className="flex items-start gap-2 mb-3">
            <h2 className="text-xl font-bold flex-1 text-gray-900 dark:text-gray-100">
              {selectedFacility.website ? (
                <a
                  href={selectedFacility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                >
                  {selectedFacility.name}
                </a>
              ) : (
                selectedFacility.name
              )}
            </h2>
            <button
              onClick={() => handleToggleFavorite(selectedFacility.facility_id)}
              className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
              aria-label={favorites.has(selectedFacility.facility_id) ? 'Remove from favorites' : 'Add to favorites'}
              title={favorites.has(selectedFacility.facility_id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className={`w-6 h-6 ${
                  favorites.has(selectedFacility.facility_id)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400'
                }`}
              />
            </button>
          </div>

          {selectedFacility.address && (
            <div className="flex gap-2 mb-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedFacility.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-primary-400 hover:underline"
              >
                {selectedFacility.address}
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </div>
          )}

          {selectedFacility.phone && (
            <div className="flex gap-2 mb-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <a
                href={`tel:${selectedFacility.phone}`}
                className="text-primary-500 dark:text-primary-400 hover:underline"
              >
                {selectedFacility.phone}
              </a>
            </div>
          )}

          {selectedFacility.distance !== undefined && selectedFacility.address && (
            <button
              onClick={() => setMapsModalAddress(selectedFacility.address!)}
              className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-3 w-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer text-left"
              title="Open in maps"
            >
              <p className="text-xs font-semibold text-green-900 dark:text-green-400 mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                DISTANCE FROM YOU (CLICK TO OPEN IN MAPS)
              </p>
              <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {formatDistance(selectedFacility.distance)}
              </p>
            </button>
          )}

          {selectedFacility.next_session && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-400 mb-1">
                NEXT SESSION
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(selectedFacility.next_session.date)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatTimeRange(
                  selectedFacility.next_session.start_time,
                  selectedFacility.next_session.end_time
                )}
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>{selectedFacility.session_count || 0} upcoming sessions</p>
            {selectedFacility.district && (
              <p className="mt-1">District: {selectedFacility.district}</p>
            )}
          </div>
        </div>
      )}

      {/* Location and Stats overlay - Hide on small screens when facility selected to avoid overlap */}
      {!selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 space-y-2">
          {/* Location controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            {!userLocation && !isLoadingLocation && locationError ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Location Access</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {locationError}. You can still browse all pools.
                </p>
                <button
                  onClick={handleGetLocation}
                  className="flex items-center justify-center gap-2 bg-primary-500 dark:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            ) : !userLocation ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-pulse flex items-center gap-2 text-primary-600 dark:text-primary-400">
                  <Navigation className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-semibold">
                    Getting your location...
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Locate className="w-4 h-4" />
                    <span className="text-sm font-semibold">Location Active</span>
                  </div>
                  <button
                    onClick={handleGetLocation}
                    className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                    title="Recenter map on your location"
                  >
                    <Navigation className="w-3 h-3" />
                    Recenter
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    Showing pools within 10km radius
                  </span>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setSortByDistance(false);
                      setLocationError(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                  >
                    Disable
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {validFacilities.length}
              </span>{" "}
              pools with lane swim
            </p>
          </div>
        </div>
      )}

      {/* Maps Modal */}
      {mapsModalAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setMapsModalAddress(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Open in Maps
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose which map app to open:
            </p>
            <div className="space-y-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsModalAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Google Maps</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Open in browser or app</div>
                </div>
              </a>

              <a
                href={`http://maps.apple.com/?q=${encodeURIComponent(mapsModalAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Apple Maps</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Open in Maps app</div>
                </div>
              </a>
            </div>

            <button
              onClick={() => setMapsModalAddress(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
