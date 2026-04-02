import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { DivIcon, LatLngBounds, Map as LeafletMap } from "leaflet";
import { facilityApi, getApiErrorMessage } from "../lib/api";
import {
  formatTimeRange,
  formatDate,
  getUserLocation,
  calculateDistance,
  formatDistance,
  type UserLocation,
} from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import {
  MapPin,
  ExternalLink,
  Phone,
  AlertCircle,
  RefreshCw,
  Navigation,
  Locate,
  Star,
  Search,
  X,
  Info,
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import type { Facility } from "../types";

const TORONTO_CENTER: [number, number] = [43.6532, -79.3832];

// ─── Marker colours ───────────────────────────────────────────────────────────

type MarkerVariant = "happening-now" | "today" | "no-sessions" | "favorite" | "user";

const MARKER_COLORS: Record<MarkerVariant, string> = {
  "happening-now": "#22c55e",
  today: "#3b82f6",
  "no-sessions": "#9ca3af",
  favorite: "#f59e0b",
  user: "#0ea5e9",
};

// User-location dot still uses a DivIcon so it looks distinct (filled dot with ring)
function buildUserIcon(): DivIcon {
  return new DivIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}
const USER_ICON = buildUserIcon();

// ─── Availability helper ─────────────────────────────────────────────────────

type SessionAvailability = "happening-now" | "today" | "no-sessions";

function getSessionAvailability(facility: Facility): SessionAvailability {
  if (!facility.next_session) return "no-sessions";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = facility.next_session.date.split("-").map(Number);
  const sessionDate = new Date(year, month - 1, day);

  if (sessionDate.getTime() !== today.getTime()) return "no-sessions";

  const [startHour, startMin] = facility.next_session.start_time.split(":").map(Number);
  const [endHour, endMin] = facility.next_session.end_time.split(":").map(Number);
  const sessionStart = new Date(year, month - 1, day, startHour, startMin);
  const sessionEnd = new Date(year, month - 1, day, endHour, endMin);
  const startWithBuffer = new Date(sessionStart.getTime() - 30 * 60 * 1000);

  if (now >= startWithBuffer && now < sessionEnd) return "happening-now";
  if (now < sessionStart) return "today";
  return "no-sessions";
}

function getMarkerVariant(
  availability: SessionAvailability,
  isFavorited: boolean
): MarkerVariant {
  if (isFavorited) return "favorite";
  return availability;
}

// ─── Map ref setter (inside MapContainer so useMap works) ────────────────────

function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// ─── Map controller ──────────────────────────────────────────────────────────

interface FacilityWithDistance extends Facility {
  distance?: number;
}

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

    const nearby = facilities.filter((f) => {
      if (!f.latitude || !f.longitude) return false;
      return (
        calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          f.latitude,
          f.longitude
        ) <= 10
      );
    });

    if (nearby.length === 0) {
      map.setView([userLocation.latitude, userLocation.longitude], 12);
      return;
    }

    const bounds = new LatLngBounds([[userLocation.latitude, userLocation.longitude]]);
    nearby.forEach((f) => {
      if (f.latitude && f.longitude) bounds.extend([f.latitude, f.longitude]);
    });
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [userLocation, facilities, map]);

  return null;
}

// ─── Map-level click handler ─────────────────────────────────────────────────
//
// Instead of per-marker eventHandlers (fragile across browsers/touch devices),
// we listen for any genuine map click, convert both the click point and every
// facility position to screen pixels, and select the nearest one within 44 px.
// This is guaranteed to fire because Leaflet always emits 'click' on a tap that
// didn't move (i.e. is not a pan).

interface MapClickHandlerProps {
  facilities: FacilityWithDistance[];
  onSelect: (facility: FacilityWithDistance) => void;
}

function MapClickHandler({ facilities, onSelect }: MapClickHandlerProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const clickPx = map.latLngToContainerPoint(e.latlng);
      let nearest: FacilityWithDistance | null = null;
      let minDist = 80; // 80 px hit-area — catches clicks near but not exactly on circles

      for (const facility of facilities) {
        if (!facility.latitude || !facility.longitude) continue;
        const fPx = map.latLngToContainerPoint([facility.latitude, facility.longitude]);
        const d = Math.hypot(fPx.x - clickPx.x, fPx.y - clickPx.y);
        if (d < minDist) {
          minDist = d;
          nearest = facility;
        }
      }

      if (nearest) onSelect(nearest);
    },
  });

  return null;
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function MapLegend() {
  const [open, setOpen] = useState(false);

  const items: { variant: MarkerVariant; label: string }[] = [
    { variant: "happening-now", label: "Happening now" },
    { variant: "today", label: "Later today" },
    { variant: "favorite", label: "Favorite" },
    { variant: "no-sessions", label: "No sessions today" },
  ];

  return (
    <div className="relative pointer-events-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Map legend"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[180px]">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Legend
          </p>
          <div className="space-y-1.5">
            {items.map(({ variant, label }) => (
              <div key={variant} className="flex items-center gap-2">
                <div
                  className="flex-shrink-0 rounded-full border-2 border-white shadow"
                  style={{
                    width: 12,
                    height: 12,
                    background: MARKER_COLORS[variant],
                  }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom sheet (mobile) / right panel (desktop) ───────────────────────────

interface FacilityPanelProps {
  facility: FacilityWithDistance;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onOpenMaps: (address: string) => void;
  onClose: () => void;
}

function FacilityPanel({
  facility,
  isFavorited,
  onToggleFavorite,
  onOpenMaps,
  onClose,
}: FacilityPanelProps) {
  const availability = getSessionAvailability(facility);

  const availabilityBadge = {
    "happening-now": (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Happening now
      </span>
    ),
    today: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold">
        Today
      </span>
    ),
    "no-sessions": null,
  }[availability];

  return (
    <div className="flex flex-col h-full">
      {/* Drag handle (mobile only) */}
      <div className="md:hidden flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {facility.website ? (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                >
                  {facility.name}
                </a>
              ) : (
                facility.name
              )}
            </h2>
            {availabilityBadge}
          </div>
          {facility.district && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{facility.district}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleFavorite}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`w-5 h-5 ${
                isFavorited
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-yellow-400"
              }`}
            />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 dark:text-gray-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-3">
        {/* Address */}
        {facility.address && (
          <div className="flex gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                facility.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 dark:text-primary-400 hover:underline"
            >
              {facility.address}
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </div>
        )}

        {/* Phone */}
        {facility.phone && (
          <div className="flex gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <a
              href={`tel:${facility.phone}`}
              className="text-primary-500 dark:text-primary-400 hover:underline"
            >
              {facility.phone}
            </a>
          </div>
        )}

        {/* Distance */}
        {facility.distance !== undefined && facility.address && (
          <button
            onClick={() => onOpenMaps(facility.address!)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-left"
          >
            <Navigation className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                Distance · tap to navigate
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatDistance(facility.distance)}
              </p>
            </div>
          </button>
        )}

        {/* Next session */}
        {facility.next_session && (
          <div
            className={`px-3 py-2.5 rounded-lg ${
              availability === "happening-now"
                ? "bg-green-50 dark:bg-green-900/20"
                : availability === "today"
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "bg-gray-50 dark:bg-gray-700/50"
            }`}
          >
            <p
              className={`text-xs font-semibold mb-0.5 ${
                availability === "happening-now"
                  ? "text-green-700 dark:text-green-400"
                  : availability === "today"
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {availability === "today" ? "Next today" : "Next session"}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(facility.next_session.date)}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {formatTimeRange(
                facility.next_session.start_time,
                facility.next_session.end_time
              )}
            </p>
          </div>
        )}

        {/* Session count */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {facility.session_count || 0} upcoming sessions
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MapView() {
  const { isDarkMode } = useDarkMode();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithDistance | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapsModalAddress, setMapsModalAddress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedFacilityId, setHighlightedFacilityId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const { data: facilities, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["facilities", "lane-swim"],
    queryFn: () => facilityApi.getAll(true),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    handleGetLocation();
  }, []);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const handleToggleFavorite = async (facilityId: string | undefined) => {
    if (!facilityId) return;
    await toggleFavorite(facilityId);
  };

  const facilitiesWithDistance: FacilityWithDistance[] =
    facilities?.map((f) => {
      if (userLocation && f.latitude && f.longitude) {
        return {
          ...f,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            f.latitude,
            f.longitude
          ),
        };
      }
      return f;
    }) || [];

  const sortedFacilities = [...facilitiesWithDistance].sort((a, b) => {
    const isFavA = favorites.has(a.facility_id);
    const isFavB = favorites.has(b.facility_id);
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;
    if (sortByDistance && userLocation) {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    }
    return 0;
  });

  const visibleFacilities = sortedFacilities.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.address?.toLowerCase().includes(q) ||
      f.district?.toLowerCase().includes(q)
    );
  });

  const validFacilities = visibleFacilities.filter((f) => f.latitude && f.longitude);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const match = sortedFacilities.find((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())
      );
      if (match) {
        setHighlightedFacilityId(match.facility_id);
        setSelectedFacility(match);
      }
    } else {
      setHighlightedFacilityId(null);
    }
  };

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

  const handleSelectFacility = (facility: FacilityWithDistance) => {
    setSelectedFacility(facility);
    setHighlightedFacilityId(facility.facility_id);
  };

  const handleClose = () => {
    setSelectedFacility(null);
    setHighlightedFacilityId(null);
  };

  if (error) {
    const errorInfo = getApiErrorMessage(error);
    return (
      <div className="h-[calc(100dvh-8rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {errorInfo.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{errorInfo.message}</p>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                  {isRefetching ? "Retrying..." : "Try Again"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-8rem)] relative overflow-hidden">
      {/* ── Map ─────────────────────────────────────────────────────── */}
      {/* `isolate` creates a stacking context so Leaflet's pane z-indices (200/400/600)
          are contained here and don't compete with the panel's z-20 in the outer context */}
      <div className="absolute inset-0 isolate">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading pools...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={TORONTO_CENTER}
            zoom={11}
            className="h-full w-full"
            zoomControl={false}
            scrollWheelZoom={true}
          >
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

            <MapController userLocation={userLocation} facilities={validFacilities} />
            <MapRefSetter mapRef={mapRef} />

            {/* Map-level click → nearest-circle selection (most reliable approach) */}
            <MapClickHandler
              facilities={validFacilities}
              onSelect={handleSelectFacility}
            />

            {/* User location dot */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={USER_ICON}
              />
            )}

            {/* Pool markers — CircleMarker (SVG vector), visual only */}
            {validFacilities.map((facility) => {
              const availability = getSessionAvailability(facility);
              const isFavorited = isFavorite(facility.facility_id);
              const isSelected = highlightedFacilityId === facility.facility_id;
              const variant = getMarkerVariant(availability, isFavorited);
              const color = MARKER_COLORS[variant];
              const radius = isSelected ? 14 : 10;

              return (
                <CircleMarker
                  key={facility.facility_id}
                  center={[facility.latitude!, facility.longitude!]}
                  radius={radius}
                  pathOptions={{
                    color: "white",
                    weight: isSelected ? 3 : 2,
                    fillColor: color,
                    fillOpacity: 1,
                  }}
                />
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* ── Top-left: search bar ─────────────────────────────────────── */}
      {/* pointer-events-none on the container so the transparent area doesn't
          block clicks on markers underneath; re-enabled on interactive children */}
      <div className="absolute top-3 left-3 right-14 z-10 flex items-center gap-2 pointer-events-none">
        {showSearch ? (
          <div className="flex-1 pointer-events-auto bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 flex items-center px-3 gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 h-10 bg-transparent focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setHighlightedFacilityId(null);
                setShowSearch(false);
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="pointer-events-auto h-10 px-4 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search pools</span>
          </button>
        )}
      </div>

      {/* ── Top-right: zoom controls ─────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xl font-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xl font-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* ── Bottom-right: FABs (locate + legend) ────────────────────── */}
      <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2 items-end pointer-events-none">
        <MapLegend />
        <button
          onClick={handleGetLocation}
          disabled={isLoadingLocation}
          title={userLocation ? "Recenter on your location" : "Enable location"}
          className={`pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full shadow-md border transition-colors ${
            userLocation
              ? "bg-primary-500 border-primary-600 text-white hover:bg-primary-600"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          aria-label={userLocation ? "Recenter" : "Enable location"}
        >
          {isLoadingLocation ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Locate className="w-4 h-4" />
          )}
        </button>
        {locationError && !userLocation && (
          <div className="pointer-events-auto bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 shadow-md max-w-[200px]">
            <p className="text-xs text-amber-700 dark:text-amber-400">{locationError}</p>
          </div>
        )}
      </div>

      {/* ── Facility panel: bottom sheet (mobile) / sidebar (desktop) ─ */}
      {selectedFacility && (
        <>
          {/* Mobile bottom sheet */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[65dvh] flex flex-col animate-slide-up">
            <FacilityPanel
              facility={selectedFacility}
              isFavorited={isFavorite(selectedFacility.facility_id)}
              onToggleFavorite={() => handleToggleFavorite(selectedFacility.facility_id)}
              onOpenMaps={setMapsModalAddress}
              onClose={handleClose}
            />
          </div>

          {/* Desktop right sidebar */}
          <div className="hidden md:flex absolute top-3 right-3 z-20 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex-col max-h-[calc(100%-1.5rem)]">
            <FacilityPanel
              facility={selectedFacility}
              isFavorited={isFavorite(selectedFacility.facility_id)}
              onToggleFavorite={() => handleToggleFavorite(selectedFacility.facility_id)}
              onOpenMaps={setMapsModalAddress}
              onClose={handleClose}
            />
          </div>
        </>
      )}

      {/* ── Maps app modal ───────────────────────────────────────────── */}
      {mapsModalAddress && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setMapsModalAddress(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Open in Maps
            </h3>
            <div className="space-y-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  mapsModalAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:shadow-md transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Google Maps
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Open in browser or app
                  </div>
                </div>
              </a>
              <a
                href={`http://maps.apple.com/?q=${encodeURIComponent(mapsModalAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:shadow-md transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Apple Maps
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Open in Maps app</div>
                </div>
              </a>
            </div>
            <button
              onClick={() => setMapsModalAddress(null)}
              className="mt-3 w-full h-11 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
