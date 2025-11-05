import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { facilityApi } from "@/lib/api";
import { 
  formatTimeRange, 
  formatDate, 
  getUserLocation, 
  calculateDistance,
  formatDistance,
  type UserLocation 
} from "@/lib/utils";
import {
  MapPin,
  ExternalLink,
  Phone,
  AlertCircle,
  RefreshCw,
  Navigation,
} from "lucide-react";
import type { Facility } from "@/types";

// Toronto coordinates
const TORONTO_CENTER: [number, number] = [43.6532, -79.3832];

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

// Extended Facility type with distance
interface FacilityWithDistance extends Facility {
  distance?: number;
}

export default function MapView() {
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithDistance | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  // Handle getting user location
  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setSortByDistance(true);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "Failed to get location");
      setSortByDistance(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate distances and sort facilities if user location is available
  const facilitiesWithDistance: FacilityWithDistance[] = facilities?.map(f => {
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

  const sortedFacilities = sortByDistance && userLocation
    ? [...facilitiesWithDistance].sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      })
    : facilitiesWithDistance;

  if (error) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to Load Facilities
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't load the pool locations. This might be due to:
                </p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc list-inside">
                  <li>Network connectivity issues</li>
                  <li>API service temporarily unavailable</li>
                  <li>Server maintenance</li>
                </ul>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                  />
                  {isRefetching ? "Retrying..." : "Try Again"}
                </button>
                {error instanceof Error && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      Technical details
                    </summary>
                    <p className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {error.message}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validFacilities = sortedFacilities.filter((f) => f.latitude && f.longitude);

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      {/* Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pools...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={TORONTO_CENTER}
            zoom={11}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validFacilities.map((facility) => (
              <Marker
                key={facility.facility_id}
                position={[facility.latitude!, facility.longitude!]}
                icon={poolIcon}
                eventHandlers={{
                  click: () => setSelectedFacility(facility),
                }}
              >
                <Popup>
                  <div className="min-w-[250px]">
                    <h3 className="font-semibold text-lg mb-2">
                      {facility.name}
                    </h3>
                    {facility.address && (
                      <p className="text-sm text-gray-600 mb-2 flex gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        {facility.address}
                      </p>
                    )}
                    {facility.distance !== undefined && (
                      <div className="bg-green-50 p-2 rounded mb-2">
                        <p className="text-xs font-semibold text-green-900 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          Distance
                        </p>
                        <p className="text-sm font-semibold">
                          {formatDistance(facility.distance)}
                        </p>
                      </div>
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
            ))}
          </MapContainer>
        )}
      </div>

      {/* Sidebar - Full width on mobile, fixed width on desktop */}
      {selectedFacility && (
        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <button
            onClick={() => setSelectedFacility(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
            aria-label="Close facility details"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-3">{selectedFacility.name}</h2>

          {selectedFacility.address && (
            <div className="flex gap-2 mb-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedFacility.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                {selectedFacility.address}
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </div>
          )}

          {selectedFacility.phone && (
            <div className="flex gap-2 mb-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <a
                href={`tel:${selectedFacility.phone}`}
                className="text-primary-500 hover:underline"
              >
                {selectedFacility.phone}
              </a>
            </div>
          )}

          {selectedFacility.distance !== undefined && (
            <div className="bg-green-50 p-3 rounded-lg mb-3">
              <p className="text-xs font-semibold text-green-900 mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                DISTANCE FROM YOU
              </p>
              <p className="font-semibold text-lg">
                {formatDistance(selectedFacility.distance)}
              </p>
            </div>
          )}

          {selectedFacility.next_session && (
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">
                NEXT SESSION
              </p>
              <p className="font-semibold">
                {formatDate(selectedFacility.next_session.date)}
              </p>
              <p className="text-sm">
                {formatTimeRange(
                  selectedFacility.next_session.start_time,
                  selectedFacility.next_session.end_time
                )}
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>{selectedFacility.session_count || 0} upcoming sessions</p>
            {selectedFacility.district && (
              <p className="mt-1">District: {selectedFacility.district}</p>
            )}
          </div>
        </div>
      )}

      {/* Location and Stats overlay - Hide on small screens when facility selected to avoid overlap */}
      {!selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto space-y-2">
          {/* Location controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            {!userLocation ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGetLocation}
                  disabled={isLoadingLocation}
                  className="flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Navigation className={`w-4 h-4 ${isLoadingLocation ? "animate-pulse" : ""}`} />
                  {isLoadingLocation ? "Getting location..." : "Show nearest pools"}
                </button>
                {locationError && (
                  <p className="text-xs text-red-600 text-center">{locationError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-green-600">
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {sortByDistance ? "Sorted by distance" : "Location enabled"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortByDistance(!sortByDistance)}
                    className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {sortByDistance ? "Default order" : "Sort by distance"}
                  </button>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setSortByDistance(false);
                      setLocationError(null);
                    }}
                    className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 text-center md:text-left">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {validFacilities.length}
              </span>{" "}
              pools with lane swim
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
