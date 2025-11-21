import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { scheduleApi, getApiErrorMessage } from "../lib/api";
import {
  formatDate,
  formatTimeRange,
  getSwimTypeLabel,
  getSwimTypeColor,
  getDayOfWeek,
  getUserLocation,
  calculateDistance,
  formatDistance,
  type UserLocation,
} from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Filter,
  MapPin,
  AlertCircle,
  RefreshCw,
  List,
  Table2,
  Navigation,
  Star,
  ArrowUpDown,
  Waves,
} from "lucide-react";
import type { SwimType, Session } from "../types";

type ViewMode = "list" | "table";

// Extended Session type with distance
interface SessionWithDistance extends Session {
  distance?: number;
}

// Helper function to check if a session is happening right now
// Includes a 30-minute travel time window before the start time
const isHappeningNow = (session: Session): boolean => {
  const now = new Date();
  const sessionStart = new Date(`${session.date} ${session.start_time}`);
  const sessionEnd = new Date(`${session.date} ${session.end_time}`);
  
  // Subtract 30 minutes from start time for travel window
  const travelWindowStart = new Date(sessionStart.getTime() - 30 * 60 * 1000);

  // Session is happening now if: (start_time - 30 min) <= now < end_time
  // This includes sessions starting within 30 minutes (travel time) and currently in progress
  return travelWindowStart <= now && now < sessionEnd;
};

// Helper function to compare sessions for sorting
const compareSessions = (
  a: SessionWithDistance,
  b: SessionWithDistance,
  sortMode: 'distance' | 'favorites' | null,
  userLocation: UserLocation | null,
  isFavorite: (facilityId: string) => boolean
): number => {
  const isFavA = a.facility?.facility_id ? isFavorite(a.facility.facility_id) : false;
  const isFavB = b.facility?.facility_id ? isFavorite(b.facility.facility_id) : false;

  // Sort by distance mode: pure distance sorting (no favorites priority)
  if (sortMode === 'distance' && userLocation) {
    const distA = a.distance;
    const distB = b.distance;
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  // Favorites first mode: favorites first (sorted by location), then non-favorites (sorted by location)
  if (sortMode === 'favorites' && userLocation) {
    // Favorites come first
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    // Within favorites and non-favorites, sort by distance
    const distA = a.distance;
    const distB = b.distance;
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  // Default when location is available: favorites first, then by distance
  if (userLocation) {
    // Favorites come first
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    // Within favorites and non-favorites, sort by distance
    const distA = a.distance;
    const distB = b.distance;
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  // Fallback when no location: favorites first, then chronological order
  if (isFavA && !isFavB) return -1;
  if (!isFavA && isFavB) return 1;

  // Then chronological order (by date, then start time)
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);
  if (dateA.getTime() !== dateB.getTime()) {
    return dateA.getTime() - dateB.getTime();
  }
  return a.start_time.localeCompare(b.start_time);
};

export default function ScheduleView() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [swimType, setSwimType] = useState<SwimType | "ALL">("LANE_SWIM");
  const [showFilters, setShowFilters] = useState(false);
  // Default to list view on mobile (< 768px), table view on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "table"
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prioritizeHappeningNow, setPrioritizeHappeningNow] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sortMode, setSortMode] = useState<'distance' | 'favorites' | null>(null);
  const [iconJump, setIconJump] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = prev week
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set()); // Track expanded table cells
  const [mapsModalAddress, setMapsModalAddress] = useState<string | null>(null); // Track address for maps modal

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["schedule", swimType],
    queryFn: () =>
      scheduleApi.getSchedule({
        swim_type: swimType === "ALL" ? undefined : swimType,
        limit: 1000, // Fetch enough sessions to cover multiple weeks
      }),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle toggling favorites
  const handleToggleFavorite = async (facilityId: string | undefined) => {
    if (!facilityId) return;
    await toggleFavorite(facilityId);
  };

  // Automatically get user location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Trigger icon jump animation when sortMode changes
  useEffect(() => {
    if (sortMode !== null) {
      setIconJump(true);
      const timer = setTimeout(() => setIconJump(false), 600);
      return () => clearTimeout(timer);
    }
  }, [sortMode]);

  // Handle getting user location
  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Failed to get location"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate distances for sessions
  const sessionsWithDistance: SessionWithDistance[] =
    sessions?.map((session) => {
      if (
        userLocation &&
        session.facility?.latitude &&
        session.facility?.longitude
      ) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          session.facility.latitude,
          session.facility.longitude
        );
        return { ...session, distance };
      }
      return session;
    }) || [];

  // Sort sessions using helper function
  const sortedSessions = [...sessionsWithDistance].sort((a, b) =>
    compareSessions(a, b, sortMode, userLocation, isFavorite)
  );

  // Get dates for the selected week (Sunday to Saturday)
  const getWeekDates = (offset: number = 0) => {
    // Get today at midnight to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekDates: Date[] = [];

    // Calculate the start of the week (Sunday) with offset
    const weekStart = new Date(today);
    const daysToSunday = currentDay; // Days since last Sunday
    const offsetDays = offset * 7; // Weeks to offset
    weekStart.setDate(today.getDate() - daysToSunday + offsetDays);

    // Calculate dates for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const weekDates = getWeekDates(weekOffset);

  // Show today plus next 6 days (7 days total)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 6); // Today + 6 more days = 7 days total
  
  const visibleWeekDates = weekDates.filter(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly >= today && dateOnly <= endDate;
  });

  // Filter sessions to only show those in the selected week, and optionally only happening now
  const filteredSessions = sortedSessions.filter((session) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = session.date.split("-").map(Number);
    const sessionDate = new Date(year, month - 1, day);
    sessionDate.setHours(0, 0, 0, 0); // Normalize to midnight
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const isInWeek = sessionDate >= weekStart && sessionDate <= weekEnd;

    // If "happening now" filter is active, only show sessions happening right now
    if (prioritizeHappeningNow) {
      return isInWeek && isHappeningNow(session);
    }

    return isInWeek;
  });

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof filteredSessions>);

  const sortedDates = Object.keys(sessionsByDate || {}).sort();

  if (error) {
    const errorInfo = getApiErrorMessage(error);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
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

  // Group sessions by facility and weekday for table view
  const sessionsByFacilityAndDay = filteredSessions.reduce((acc, session) => {
    const facilityName = session.facility?.name || "Unknown";
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = session.date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    if (!acc[facilityName]) {
      acc[facilityName] = {
        facility: session.facility,
        sessions: {},
        distance: session.distance,
      };
    }

    if (!acc[facilityName].sessions[dayOfWeek]) {
      acc[facilityName].sessions[dayOfWeek] = [];
    }

    acc[facilityName].sessions[dayOfWeek].push(session);
    return acc;
  }, {} as Record<string, { facility: Session["facility"]; sessions: Record<string, SessionWithDistance[]>; distance?: number }>);

  // Sort facilities: by distance (if enabled) or favorites first then by location
  const sortedFacilityEntries = Object.entries(sessionsByFacilityAndDay || {});
  sortedFacilityEntries.sort((a, b) => {
    const facilityA = a[1].facility;
    const facilityB = b[1].facility;
    const isFavA = facilityA?.facility_id ? isFavorite(facilityA.facility_id) : false;
    const isFavB = facilityB?.facility_id ? isFavorite(facilityB.facility_id) : false;

    // Sort by distance mode: pure distance sorting (no favorites priority)
    if (sortMode === 'distance' && userLocation) {
      const distA = a[1].distance;
      const distB = b[1].distance;
      if (distA === undefined) return 1;
      if (distB === undefined) return -1;
      return distA - distB;
    }

    // Favorites first mode: favorites first (sorted by location), then non-favorites (sorted by location)
    if (sortMode === 'favorites' && userLocation) {
      // Favorites come first
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;

      // Within favorites and non-favorites, sort by distance
      const distA = a[1].distance;
      const distB = b[1].distance;
      if (distA === undefined) return 1;
      if (distB === undefined) return -1;
      return distA - distB;
    }

    // Default when location is available: favorites first, then by distance
    if (userLocation) {
      // Favorites come first
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;

      // Within favorites and non-favorites, sort by distance
      const distA = a[1].distance;
      const distB = b[1].distance;
      if (distA === undefined) return 1;
      if (distB === undefined) return -1;
      return distA - distB;
    }

    // Fallback when no location: favorites first, then alphabetical order
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    const nameA = facilityA?.name || "";
    const nameB = facilityB?.name || "";
    return nameA.localeCompare(nameB);
  });

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Format date as "Mon Jan-15"
  const formatWeekdayHeader = (date: Date) => {
    const weekdayShort = weekdays[date.getDay()].substring(0, 3);
    const monthShort = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return {
      weekday: weekdayShort,
      date: `${monthShort}-${day}`,
    };
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50 to-primary-50/10 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-3">
            Swim Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            Find drop-in swim times at Toronto's community pools
          </p>

          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 shadow-sm"
            >
              ← Previous Week
            </button>

            <div className="text-center px-6 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {weekOffset === 0
                  ? "This Week"
                  : weekOffset === 1
                  ? "Next Week"
                  : weekOffset === -1
                  ? "Last Week"
                  : `Week of ${weekDates[0].toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {weekDates[0].toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {weekDates[6].toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 shadow-sm"
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold md:hidden hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Location loading indicator */}
              {isLoadingLocation ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs">
                  <Navigation className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
                  <span className="text-green-800 dark:text-green-300 font-medium">
                    Getting location...
                  </span>
                </div>
              ) : userLocation ? (
                <>
                  {/* Sort by location button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode(sortMode === 'distance' ? null : 'distance');
                    }}
                    className={`flex items-center justify-center px-3 py-2 rounded-md transition-all duration-300 cursor-pointer ${
                      sortMode === 'distance'
                        ? "bg-green-100 dark:bg-green-900/40 border-2 border-green-400 dark:border-green-600 shadow-md shadow-green-400/30"
                        : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                    }`}
                    title="Sort by location (distance only)"
                  >
                    <Navigation className={`w-5 h-5 transition-all duration-300 ${
                      sortMode === 'distance'
                        ? "text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400"
                        : "text-green-600 dark:text-green-400"
                    }`} />
                  </button>

                  {/* Favorites first button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode(sortMode === 'favorites' ? null : 'favorites');
                    }}
                    className={`flex items-center justify-center px-3 py-2 rounded-md transition-all duration-300 cursor-pointer ${
                      sortMode === 'favorites'
                        ? "bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400 dark:border-yellow-600 shadow-md shadow-yellow-400/30"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                    }`}
                    title="Favorites first, sorted by location"
                  >
                    <Star className={`w-5 h-5 transition-all duration-300 ${
                      sortMode === 'favorites'
                        ? "text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGetLocation}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Enable location to sort by distance"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Enable Location</span>
                </button>
              )}

              {/* Happening Now Filter Button (styled as legend) */}
              <button
                onClick={() =>
                  setPrioritizeHappeningNow(!prioritizeHappeningNow)
                }
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-all duration-300 cursor-pointer ${
                  prioritizeHappeningNow
                    ? "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600 shadow-md shadow-blue-400/30"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
              >
                <Waves className={`w-5 h-5 transition-all duration-300 ${
                  prioritizeHappeningNow
                    ? "text-blue-600 dark:text-blue-400 animate-pulse"
                    : "text-blue-500 dark:text-blue-500 opacity-70"
                }`} />
                <span className="text-blue-800 dark:text-blue-300 ml-2">
                  Happening now!
                </span>
              </button>

              {/* View Mode Toggle - Hidden on mobile since list view is optimal */}
              <div className="hidden md:flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 ml-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <List className="w-5 h-5" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                    viewMode === "table"
                      ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Table2 className="w-5 h-5" />
                  <span>Table View</span>
                </button>
              </div>
            </div>
          </div>

          {locationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                {locationError}
              </p>
            </div>
          )}

          <div className={`${showFilters ? "block" : "hidden"} md:block`}>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                "ALL",
                "LANE_SWIM",
                "RECREATIONAL",
                "ADULT_SWIM",
                "SENIOR_SWIM",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => setSwimType(type as SwimType | "ALL")}
                  className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    swimType === type
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {type === "ALL" ? "All Types" : getSwimTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading schedule...
            </p>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold">
              No sessions found
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              let dateSessions = sessionsByDate[date];

              // Sort sessions within each date using helper function
              dateSessions = [...dateSessions].sort((a, b) =>
                compareSessions(a, b, sortMode, userLocation, isFavorite)
              );
              return (
                <div
                  key={date}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 hover:shadow-xl"
                >
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
                    <p className="text-sm text-primary-100 font-medium">
                      {getDayOfWeek(date)}
                    </p>
                  </div>

                  {/* Sessions */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dateSessions.map((session) => {
                      const happeningNow = isHappeningNow(session);

                      return (
                        <div
                          key={session.id}
                          className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-200 ${
                            happeningNow
                              ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-400 dark:border-yellow-600 shadow-lg ring-2 ring-yellow-400/50"
                              : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                            {/* Facility */}
                            <div className="flex-1 flex items-start gap-2">
                              <button
                                onClick={() =>
                                  handleToggleFavorite(
                                    session.facility?.facility_id
                                  )
                                }
                                className="flex-shrink-0 hover:scale-110 transition-transform duration-200 mt-1"
                                aria-label={
                                  favorites.has(
                                    session.facility?.facility_id || ""
                                  )
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                                title={
                                  favorites.has(
                                    session.facility?.facility_id || ""
                                  )
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    favorites.has(
                                      session.facility?.facility_id || ""
                                    )
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                                  }`}
                                />
                              </button>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 text-lg">
                                  {session.facility?.website ? (
                                    <a
                                      href={session.facility.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                                    >
                                      {session.facility.name}
                                    </a>
                                  ) : (
                                    session.facility?.name
                                  )}
                                  {session.distance !== undefined &&
                                    session.facility?.address && (
                                      <button
                                        onClick={() =>
                                          setMapsModalAddress(
                                            session.facility!.address!
                                          )
                                        }
                                        className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
                                        title="Open in maps"
                                      >
                                        ({formatDistance(session.distance)})
                                      </button>
                                    )}
                                </h3>
                                {session.facility?.address && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        session.facility.address
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                                    >
                                      {session.facility.address}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Type */}
                            <div className="flex-shrink-0">
                              <span
                                className={`px-4 py-2 rounded-xl text-xs font-bold ${getSwimTypeColor(
                                  session.swim_type
                                )} shadow-sm`}
                              >
                                {getSwimTypeLabel(session.swim_type)}
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {session.notes && (
                            <div className="w-full mt-3 md:col-span-full">
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                {session.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
            <div className="overflow-x-auto max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-500 to-primary-600 text-white sticky top-0 z-20 shadow-md">
                  <tr>
                    <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-7 text-left sticky left-0 bg-gradient-to-b from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 z-30 shadow-[2px_0_8px_rgba(0,0,0,0.15)] border-r-2 border-primary-400/40">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg border border-white/20">
                          {sortMode === 'favorites' ? (
                            <Star className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 fill-white ${
                              iconJump ? 'animate-bounce' : ''
                            }`} />
                          ) : sortMode === 'distance' ? (
                            <Navigation className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 ${
                              iconJump ? 'animate-bounce' : ''
                            }`} />
                          ) : (
                            <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 ${
                              iconJump ? 'animate-bounce' : ''
                            }`} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white leading-tight">
                            <span className="hidden sm:inline">Community Center</span>
                            <span className="sm:hidden">Pool</span>
                          </span>
                          <span className="text-[10px] sm:text-xs text-primary-100/80 mt-0.5 font-medium">
                            {sortMode === 'distance' 
                              ? 'Sorted by Location'
                              : sortMode === 'favorites'
                              ? 'Sorted by Favorites'
                              : 'Location & Distance'}
                          </span>
                        </div>
                      </div>
                    </th>
                    {visibleWeekDates.map((date, index) => {
                      const formatted = formatWeekdayHeader(date);
                      const isToday = new Date(date).toDateString() === new Date().toDateString();
                      return (
                        <th
                          key={index}
                          className={`px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-7 text-center min-w-[100px] sm:min-w-[120px] md:min-w-[160px] transition-all relative ${
                            isToday
                              ? "bg-gradient-to-b from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 ring-2 ring-yellow-400 dark:ring-yellow-500 ring-inset shadow-lg"
                              : "bg-gradient-to-b from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700"
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                            <div className={`text-sm sm:text-base md:text-xl font-black uppercase tracking-wider ${
                              isToday ? "text-yellow-100 drop-shadow-lg" : "text-white"
                            }`}>
                              {formatted.weekday}
                            </div>
                            <div className={`text-xs sm:text-sm md:text-base font-bold px-2 py-1 rounded-md ${
                              isToday 
                                ? "bg-yellow-400/20 text-yellow-100 border border-yellow-300/30" 
                                : "bg-white/10 text-primary-50 border border-white/20"
                            }`}>
                              {formatted.date}
                            </div>
                            {isToday && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedFacilityEntries.map(([facilityName, data]) => (
                    <tr
                      key={facilityName}
                      className="hover:bg-primary-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 sticky left-0 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md z-10 border-r-2 border-gray-300 dark:border-gray-600 shadow-[2px_0_8px_rgba(0,0,0,0.05)] min-w-[200px] sm:min-w-[250px] md:min-w-[300px]">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <button
                            onClick={() =>
                              handleToggleFavorite(data.facility?.facility_id)
                            }
                            className="flex-shrink-0 mt-1 hover:scale-110 transition-transform duration-200 p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            aria-label={
                              isFavorite(data.facility?.facility_id || "")
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                            title={
                              isFavorite(data.facility?.facility_id || "")
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            <Star
                              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                                isFavorite(data.facility?.facility_id || "")
                                  ? "fill-yellow-400 text-yellow-400 scale-110"
                                  : "text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                              }`}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-100 leading-tight mb-2">
                              {data.facility?.website ? (
                                <a
                                  href={data.facility.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                                >
                                  {facilityName}
                                </a>
                              ) : (
                                facilityName
                              )}
                            </div>
                            {data.distance !== undefined &&
                              data.facility?.address && (
                                <button
                                  onClick={() =>
                                    setMapsModalAddress(
                                      data.facility!.address!
                                    )
                                  }
                                  className="mb-2 px-2 py-1 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 cursor-pointer transition-all duration-200 flex items-center gap-1.5"
                                  title="Open in maps"
                                >
                                  <Navigation className="w-4 h-4" />
                                  {formatDistance(data.distance)}
                                </button>
                              )}
                            {data.facility?.address && (
                              <div className="hidden sm:flex text-sm text-gray-600 dark:text-gray-400 items-start gap-2 leading-relaxed">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                                <span className="line-clamp-2">
                                  {data.facility.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {visibleWeekDates.map((currentDate, index) => {
                        // Get day of week (0 = Sunday, 1 = Monday, etc.)
                        const dayOfWeek = currentDate.getDay();
                        const daySessions =
                          data.sessions[String(dayOfWeek)] || [];
                        const cellKey = `${facilityName}-${dayOfWeek}-${currentDate.toISOString()}`;
                        const isExpanded = expandedCells.has(cellKey);
                        const displaySessions = isExpanded
                          ? daySessions
                          : daySessions.slice(0, 3);
                        const isToday = new Date(currentDate).toDateString() === new Date().toDateString();

                        return (
                          <td
                            key={index}
                            className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-5 text-center align-top transition-colors ${
                              isToday
                                ? "bg-primary-50/30 dark:bg-primary-900/10 border-l-2 border-r-2 border-primary-300 dark:border-primary-700"
                                : ""
                            }`}
                          >
                            {daySessions.length > 0 ? (
                              <div className="space-y-2 sm:space-y-2.5">
                                {displaySessions.map((session) => {
                                  const happeningNow = isHappeningNow(session);

                                  return (
                                    <div
                                      key={session.id}
                                      className={`group relative p-2 sm:p-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                                        happeningNow
                                          ? "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/60 dark:to-yellow-900/40 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg shadow-yellow-400/20"
                                          : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                      }`}
                                    >
                                      <div className={`text-xs sm:text-sm font-bold whitespace-nowrap mb-1.5 ${
                                        happeningNow
                                          ? "text-yellow-900 dark:text-yellow-100"
                                          : "text-gray-900 dark:text-gray-100"
                                      }`}>
                                        {formatTimeRange(
                                          session.start_time,
                                          session.end_time
                                        )}
                                      </div>
                                      <span
                                        className={`inline-block px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold shadow-sm ${getSwimTypeColor(
                                          session.swim_type
                                        )}`}
                                      >
                                        {getSwimTypeLabel(session.swim_type)}
                                      </span>
                                    </div>
                                  );
                                })}
                                {daySessions.length > 3 && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(
                                        expandedCells
                                      );
                                      if (isExpanded) {
                                        newExpanded.delete(cellKey);
                                      } else {
                                        newExpanded.add(cellKey);
                                      }
                                      setExpandedCells(newExpanded);
                                    }}
                                    className="w-full mt-2 px-2 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200"
                                  >
                                    {isExpanded
                                      ? "Show less"
                                      : `+${daySessions.length - 3} more`}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-4">
                                <span className="text-gray-300 dark:text-gray-700 text-xs">
                                  —
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedFacilityEntries.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No facilities found with the selected filters
              </div>
            )}
          </div>
        )}
      </div>

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
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  mapsModalAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    Google Maps
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Open in browser or app
                  </div>
                </div>
              </a>

              <a
                href={`http://maps.apple.com/?q=${encodeURIComponent(
                  mapsModalAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all group"
                onClick={() => setMapsModalAddress(null)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    Apple Maps
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Open in Maps app
                  </div>
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
