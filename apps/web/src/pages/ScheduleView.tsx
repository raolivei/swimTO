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
} from "lucide-react";
import type { SwimType, Session } from "../types";

type ViewMode = "list" | "table";

// Extended Session type with distance
interface SessionWithDistance extends Session {
  distance?: number;
}

export default function ScheduleView() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [swimType, setSwimType] = useState<SwimType | "ALL">("LANE_SWIM");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
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

  // Sort sessions by distance if enabled
  const sortedSessions =
    sortByDistance && userLocation
      ? [...sessionsWithDistance].sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        })
      : sessionsWithDistance;

  // Get dates for the selected week (Sunday to Saturday)
  const getWeekDates = (offset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekDates: Date[] = [];

    // Calculate the start of the week (Sunday) with offset
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay + offset * 7);

    // Calculate dates for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const weekDates = getWeekDates(weekOffset);

  // Filter sessions to only show those in the selected week
  const filteredSessions = sortedSessions.filter((session) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = session.date.split("-").map(Number);
    const sessionDate = new Date(year, month - 1, day);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    return sessionDate >= weekStart && sessionDate <= weekEnd;
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
  }, {} as Record<string, { facility: any; sessions: Record<number, SessionWithDistance[]>; distance?: number }>);

  // Sort facilities: favorites first, then by distance if enabled
  const sortedFacilityEntries = Object.entries(sessionsByFacilityAndDay || {});
  sortedFacilityEntries.sort((a, b) => {
    const facilityA = a[1].facility;
    const facilityB = b[1].facility;
    const isFavA = facilityA?.facility_id ? isFavorite(facilityA.facility_id) : false;
    const isFavB = facilityB?.facility_id ? isFavorite(facilityB.facility_id) : false;

    // Favorites always come first
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    // Then sort by distance if enabled
    if (sortByDistance && userLocation) {
      const distA = a[1].distance;
      const distB = b[1].distance;
      if (distA === undefined) return 1;
      if (distB === undefined) return -1;
      return distA - distB;
    }

    return 0;
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
            Browse upcoming swim sessions across Toronto
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

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Location controls */}
              <div className="flex-shrink-0">
                {!userLocation ? (
                  <button
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center justify-center gap-2 bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <Navigation
                      className={`w-4 h-4 ${
                        isLoadingLocation ? "animate-pulse" : ""
                      }`}
                    />
                    {isLoadingLocation
                      ? "Getting location..."
                      : "Sort by distance"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {sortByDistance
                        ? "Sorted by distance"
                        : "Location enabled"}
                    </span>
                    <button
                      onClick={() => setSortByDistance(!sortByDistance)}
                      className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {sortByDistance ? "Default order" : "Sort"}
                    </button>
                    <button
                      onClick={() => {
                        setUserLocation(null);
                        setSortByDistance(false);
                        setLocationError(null);
                      }}
                      className="text-xs px-3 py-1 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 ml-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <List className="w-5 h-5" />
                  <span className="hidden sm:inline">List View</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    viewMode === "table"
                      ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Table2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
              </div>
            </div>
          </div>

          {locationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {locationError}
              </p>
            </div>
          )}

          <div className={`${showFilters ? "block" : "hidden"} md:block`}>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
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
              const dateSessions = sessionsByDate[date];
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
                      const isNextAvailable = isNextAvailableSession(
                        session,
                        filteredSessions
                      );

                          {/* Facility */}
                          <div className="flex-1 flex items-start gap-2">
                            <button
                              onClick={() => handleToggleFavorite(session.facility?.facility_id)}
                              className="flex-shrink-0 hover:scale-110 transition-transform duration-200 mt-1"
                              aria-label={isFavorite(session.facility?.facility_id || '') ? 'Remove from favorites' : 'Add to favorites'}
                              title={isFavorite(session.facility?.facility_id || '') ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  isFavorite(session.facility?.facility_id || '')
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400'
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
                              </p>
                            </div>

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
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 md:ml-48 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              {session.notes}
                            </p>
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
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider sticky left-0 bg-primary-500 dark:bg-primary-600 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                      Community Center
                    </th>
                    {weekDates.map((date, index) => {
                      const formatted = formatWeekdayHeader(date);
                      return (
                        <th
                          key={index}
                          className="px-4 py-5 text-center min-w-[120px]"
                        >
                          <div className="text-lg font-extrabold uppercase tracking-wide">
                            {formatted.weekday}
                          </div>
                          <div className="text-sm font-semibold text-primary-100 mt-1">
                            {formatted.date}
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
                      <td className="px-6 py-4 sticky left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleFavorite(data.facility?.facility_id)
                            }
                            className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
                            aria-label={isFavorite(data.facility?.facility_id || '') ? 'Remove from favorites' : 'Add to favorites'}
                            title={isFavorite(data.facility?.facility_id || '') ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFavorite(data.facility?.facility_id || '')
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400'
                              }`}
                            />
                          </button>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100">
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
                              {data.distance !== undefined &&
                                data.facility?.address && (
                                  <button
                                    onClick={() =>
                                      setMapsModalAddress(
                                        data.facility!.address!
                                      )
                                    }
                                    className="ml-2 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
                                    title="Open in maps"
                                  >
                                    ({formatDistance(data.distance)})
                                  </button>
                                )}
                            </div>
                            {data.facility?.address && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">
                                  {data.facility.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {weekdays.map((_, dayIndex) => {
                        const daySessions = data.sessions[dayIndex] || [];
                        const cellKey = `${facilityName}-${dayIndex}`;
                        const isExpanded = expandedCells.has(cellKey);
                        const displaySessions = isExpanded
                          ? daySessions
                          : daySessions.slice(0, 3);

                        return (
                          <td
                            key={dayIndex}
                            className="px-4 py-4 text-center align-top"
                          >
                            {daySessions.length > 0 ? (
                              <div className="space-y-2">
                                {displaySessions.map((session) => {
                                  const isNextAvailable =
                                    isNextAvailableSession(
                                      session,
                                      filteredSessions
                                    );

                                  return (
                                    <div
                                      key={session.id}
                                      className={`text-xs p-2 rounded-lg transition-colors ${
                                        isNextAvailable
                                          ? "bg-yellow-200 dark:bg-yellow-900/50 ring-2 ring-yellow-400 dark:ring-yellow-600"
                                          : ""
                                      }`}
                                    >
                                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatTimeRange(
                                          session.start_time,
                                          session.end_time
                                        )}
                                      </div>
                                      <span
                                        className={`inline-block mt-1 px-2 py-1 rounded-lg text-[10px] font-bold ${getSwimTypeColor(
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
                                    className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors cursor-pointer"
                                  >
                                    {isExpanded
                                      ? "Show less"
                                      : `+${daySessions.length - 3} more`}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs">
                                —
                              </span>
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
