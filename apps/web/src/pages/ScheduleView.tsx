import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePoolTypeFilter } from "@/hooks/usePoolTypeFilter";
import { scheduleApi, getApiErrorMessage } from "../lib/api";
import { matchesPoolTypeFilter, poolFlags, poolTypeLabel } from "../lib/poolType";
import { compareFacilityGroups, facilityDistanceKm } from "../lib/facilitySort";
import {
  getSwimTypeFilterLabel,
  matchesSwimTypeFilter,
} from "../lib/swimTypeFilter";
import { PoolTypeFilterControl } from "@/components/PoolTypeFilterControl";
import {
  formatDate,
  formatTimeRange,
  formatTimeRangeAbbreviated,
  getSwimTypeLabel,
  getSwimTypeLabelAbbreviated,
  getSwimTypeColor,
  getDayOfWeek,
  getUserLocation,
  calculateDistance,
  formatDistance,
  type UserLocation,
} from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { TimeRangeSlider } from "@/components/TimeRangeSlider";
import {
  Filter,
  MapPin,
  AlertCircle,
  RefreshCw,
  List,
  Table2,
  Navigation,
  Star,
  Waves,
  Timer,
  Share2,
  Calendar as CalendarIcon,
  Check,
  Sun,
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

// Helper function to find the next upcoming session
const findNextSession = (sessions: Session[]): Session | null => {
  const now = new Date();
  
  // Filter to future sessions only and sort by datetime
  const futureSessions = sessions
    .filter((session) => {
      const sessionStart = new Date(`${session.date} ${session.start_time}`);
      return sessionStart > now;
    })
    .sort((a, b) => {
      const startA = new Date(`${a.date} ${a.start_time}`);
      const startB = new Date(`${b.date} ${b.start_time}`);
      return startA.getTime() - startB.getTime();
    });
  
  return futureSessions[0] || null;
};

// Helper function to format time until a session
const formatTimeUntil = (session: Session): { text: string; isUrgent: boolean; isToday: boolean } => {
  const now = new Date();
  const sessionStart = new Date(`${session.date} ${session.start_time}`);
  const diffMs = sessionStart.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return { text: "Started", isUrgent: false, isToday: false };
  }
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const isToday = diffDays === 0;
  const isUrgent = diffMins <= 60; // Within 1 hour
  
  if (diffMins < 60) {
    return { text: `${diffMins} min`, isUrgent, isToday };
  } else if (diffHours < 24) {
    const mins = diffMins % 60;
    return { text: mins > 0 ? `${diffHours}h ${mins}m` : `${diffHours}h`, isUrgent, isToday };
  } else {
    const hours = diffHours % 24;
    return { text: hours > 0 ? `${diffDays}d ${hours}h` : `${diffDays}d`, isUrgent, isToday };
  }
};

// Generate calendar event for a session
const generateCalendarUrl = (session: Session): string => {
  const start = new Date(`${session.date} ${session.start_time}`);
  const end = new Date(`${session.date} ${session.end_time}`);
  
  // Format for Google Calendar
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const title = encodeURIComponent(`${getSwimTypeLabel(session.swim_type)} at ${session.facility?.name || 'Pool'}`);
  const details = encodeURIComponent(`Drop-in swim session\n\nTime: ${formatTimeRange(session.start_time, session.end_time)}\nType: ${getSwimTypeLabel(session.swim_type)}${session.notes ? `\nNotes: ${session.notes}` : ''}\n\nFound via SwimTO - swimto.app`);
  const location = encodeURIComponent(session.facility?.address || '');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(start)}/${formatGoogleDate(end)}&details=${details}&location=${location}`;
};

// Generate share text for a session
const getShareText = (session: Session): { title: string; text: string; url: string } => {
  const title = `${getSwimTypeLabel(session.swim_type)} at ${session.facility?.name || 'Pool'}`;
  const text = `${getSwimTypeLabel(session.swim_type)} at ${session.facility?.name}\n${formatDate(session.date)} from ${formatTimeRange(session.start_time, session.end_time)}\n${session.facility?.address || ''}`;
  const url = window.location.origin + '/schedule';
  
  return { title, text, url };
};

// Share Button Component
const ShareButton = ({ session }: { session: Session }) => {
  const [copied, setCopied] = useState(false);
  
  const handleShare = async () => {
    const { title, text, url } = getShareText(session);
    
    // Use native share API if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled or error - silently ignore
      }
    } else {
      // Fallback: copy to clipboard
      const fullText = `${text}\n\nFind more swim times at ${url}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <button
      onClick={handleShare}
      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
      aria-label="Share this session"
      title="Share this session"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
};

// Free Entry Badge Component
const FreeEntryBadge = () => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
      FREE
    </span>
  );
};

// Helper function to compare sessions for sorting
const compareSessions = (
  a: SessionWithDistance,
  b: SessionWithDistance,
  sortMode: "distance" | "favorites",
  userLocation: UserLocation | null,
  isFavorite: (facilityId: string) => boolean
): number => {
  const isFavA = a.facility?.facility_id
    ? isFavorite(a.facility.facility_id)
    : false;
  const isFavB = b.facility?.facility_id
    ? isFavorite(b.facility.facility_id)
    : false;

  // Sort by distance mode: pure distance sorting (no favorites priority)
  if (sortMode === "distance" && userLocation) {
    const distA = facilityDistanceKm(a.facility, userLocation, a.distance);
    const distB = facilityDistanceKm(b.facility, userLocation, b.distance);
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  // Favorites first mode: favorites first (sorted by location), then non-favorites (sorted by location)
  if (sortMode === "favorites" && userLocation) {
    // Favorites come first
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    // Within favorites and non-favorites, sort by distance
    const distA = facilityDistanceKm(a.facility, userLocation, a.distance);
    const distB = facilityDistanceKm(b.facility, userLocation, b.distance);
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
    const distA = facilityDistanceKm(a.facility, userLocation, a.distance);
    const distB = facilityDistanceKm(b.facility, userLocation, b.distance);
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

type AgeFilter = "all" | "infant" | "child" | "adult";

export default function ScheduleView() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [swimType, setSwimType] = useState<SwimType | "ALL">("LANE_SWIM");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [poolType, setPoolType] = usePoolTypeFilter();
  // Time-of-day filter: default is full day [5am, 11pm]
  const TIME_MIN = 5 * 60;
  const TIME_MAX = 23 * 60;
  const [timeStart, setTimeStart] = useState<number>(TIME_MIN);
  const [timeEnd, setTimeEnd] = useState<number>(TIME_MAX);
  const isTimeDefault = timeStart === TIME_MIN && timeEnd === TIME_MAX;
  const [showFilters, setShowFilters] = useState(false);
  // Default to list view on mobile (< 768px), table view on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "table"
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prioritizeHappeningNow, setPrioritizeHappeningNow] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sortMode, setSortMode] = useState<"distance" | "favorites">(
    "distance"
  );
  const [iconJump, setIconJump] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = prev week (desktop)
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow, -1 = yesterday (mobile)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set()); // Track expanded table cells
  const [mapsModalAddress, setMapsModalAddress] = useState<string | null>(null); // Track address for maps modal
  const [isMobile, setIsMobile] = useState(false); // Track if we're on mobile
  const [countdownTick, setCountdownTick] = useState(0); // Force re-render for countdown

  // Track window size for responsive layout. We do NOT mutate `viewMode` here
  // — it stores the user's desktop preference. The effective view mode is
  // computed at render time as: mobile ? "list" : viewMode. This way a brief
  // mobile-width resize doesn't wipe out the user's table/list choice.
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Effective view mode: list on mobile, otherwise the user's chosen mode
  const effectiveViewMode: ViewMode = isMobile ? "list" : viewMode;

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTick((t) => t + 1);
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate date range to request from API (yesterday to 7 days ahead)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAhead = new Date(today);
  weekAhead.setDate(today.getDate() + 7);

  // Convert age filter to age_max parameter for API
  const getAgeMaxFromFilter = (filter: AgeFilter): number | undefined => {
    switch (filter) {
      case "infant":
        return 3;
      case "child":
        return 12;
      default:
        return undefined;
    }
  };

  // Fetch all sessions (no swim_type filter) to compute available types
  // Filter by swimType client-side for better UX
  const {
    data: allSessions,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["schedule", ageFilter],
    queryFn: () =>
      scheduleApi.getSchedule({
        date_from: yesterday.toISOString().split("T")[0], // Request from yesterday
        date_to: weekAhead.toISOString().split("T")[0], // Request up to a week ahead
        age_max: getAgeMaxFromFilter(ageFilter),
        limit: 1000, // Fetch enough sessions to cover multiple weeks
      }),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Compute available swim types from fetched data
  const availableSwimTypes = useMemo(() => {
    if (!allSessions?.length) return new Set<string>();
    return new Set(allSessions.map((s) => s.swim_type));
  }, [allSessions]);

  // Filter sessions by swimType, free entry, and selected time-of-day range (client-side)
  const sessions = useMemo(() => {
    if (!allSessions) return undefined;
    let filtered = allSessions;
    if (swimType !== "ALL") {
      filtered = filtered.filter((s) =>
        matchesSwimTypeFilter(s.swim_type, swimType, poolType)
      );
    }
    if (showFreeOnly) {
      filtered = filtered.filter((s) => s.facility?.is_free_entry === true);
    }
    if (poolType !== "all") {
      filtered = filtered.filter((s) => matchesPoolTypeFilter(s.facility, poolType));
    }
    if (!isTimeDefault) {
      filtered = filtered.filter((s) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        const sessionStart = sh * 60 + (sm || 0);
        const sessionEnd = eh * 60 + (em || 0);
        // Show sessions that overlap the selected window
        return sessionStart < timeEnd && sessionEnd > timeStart;
      });
    }
    return filtered;
  }, [allSessions, swimType, showFreeOnly, poolType, isTimeDefault, timeStart, timeEnd]);

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

  // Generate dates for the visible range
  // Desktop: 6 days starting from yesterday, shifted by weekOffset
  // Mobile: Single day, shifted by dayOffset from today
  const currentToday = new Date();
  currentToday.setHours(0, 0, 0, 0);
  const currentYesterday = new Date(currentToday);
  currentYesterday.setDate(currentToday.getDate() - 1);

  const visibleWeekDates: Date[] = [];
  
  if (isMobile) {
    // Mobile: Show single day based on dayOffset
    const singleDate = new Date(currentToday);
    singleDate.setDate(currentToday.getDate() + dayOffset);
    singleDate.setHours(0, 0, 0, 0);
    visibleWeekDates.push(singleDate);
  } else {
    // Desktop: Show 6 days starting from yesterday, shifted by weekOffset
    const startDate = new Date(currentYesterday);
    startDate.setDate(currentYesterday.getDate() + weekOffset * 6);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      visibleWeekDates.push(date);
    }
  }

  // Pre-compute visible date strings once for efficiency
  const visibleDateStrings = visibleWeekDates.map((d) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dDay = d.getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(dDay).padStart(
      2,
      "0"
    )}`;
  });

  // Filter sessions to only show those in the visible date range, and optionally only happening now
  const filteredSessions = sortedSessions.filter((session) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = session.date.split("-").map(Number);
    const sessionDate = new Date(year, month - 1, day);
    sessionDate.setHours(0, 0, 0, 0); // Normalize to midnight

    // Create date strings for comparison - normalize session date string
    const sessionDateString = `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Check if session date string is in the visible dates (using pre-computed array)
    const isInRange = visibleDateStrings.includes(sessionDateString);

    // If "happening now" filter is active, only show sessions actually happening now
    // (in the travel window: start - 30min ≤ now < end). Same logic as the yellow highlight.
    if (prioritizeHappeningNow) {
      return isInRange && isHappeningNow(session);
    }

    return isInRange;
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

  // Group sessions by facility ID and date for table view (using facility_id to avoid duplicates from name variations)
  const sessionsByFacilityAndDay = filteredSessions.reduce((acc, session) => {
    const facilityId = session.facility?.facility_id || "unknown";
    // Normalize date string to ensure consistent format (YYYY-MM-DD)
    const [year, month, day] = session.date.split("-").map(Number);
    const normalizedDateString = `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Only include sessions for visible dates
    if (!visibleDateStrings.includes(normalizedDateString)) {
      return acc;
    }

    if (!acc[facilityId]) {
      acc[facilityId] = {
        facility: session.facility,
        sessions: {},
        distance: session.distance,
      };
    }

    if (!acc[facilityId].sessions[normalizedDateString]) {
      acc[facilityId].sessions[normalizedDateString] = [];
    }

    acc[facilityId].sessions[normalizedDateString].push(session);
    return acc;
  }, {} as Record<string, { facility: Session["facility"]; sessions: Record<string, SessionWithDistance[]>; distance?: number }>);

  // Sort facilities: by distance (if enabled) or favorites first then by location
  const sortedFacilityEntries = Object.entries(sessionsByFacilityAndDay || {});
  const facilitySortOptions = {
    sortMode,
    userLocation,
    isFavorite,
    prioritizeHappeningNow,
    isHappeningNow,
  };
  sortedFacilityEntries.sort((a, b) =>
    compareFacilityGroups(
      { facility: a[1].facility, distance: a[1].distance, sessions: a[1].sessions },
      { facility: b[1].facility, distance: b[1].distance, sessions: b[1].sessions },
      facilitySortOptions
    )
  );

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
    <div className="bg-gradient-to-br from-gray-50 to-primary-50/10 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-3">
            Swim Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            Find drop-in swim times at Toronto's community pools
          </p>

          {/* Session Summary Stats */}
          {filteredSessions && (
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Session Count */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
                <Waves className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  <span className="font-bold">{filteredSessions.length}</span> session{filteredSessions.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              {/* Unique Facilities */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  <span className="font-bold">
                    {new Set(filteredSessions.map(s => s.facility?.facility_id).filter(Boolean)).size}
                  </span> pool{new Set(filteredSessions.map(s => s.facility?.facility_id).filter(Boolean)).size !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Next Session Countdown */}
              {sessions && sessions.length > 0 && (() => {
                const nextSession = findNextSession(sessions);
                if (!nextSession) return null;
                const timeUntil = formatTimeUntil(nextSession);
                // Using countdownTick to force re-render
                void countdownTick;
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    timeUntil.isUrgent
                      ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-2 border-amber-400 dark:border-amber-600 shadow-md shadow-amber-400/20"
                      : timeUntil.isToday
                      ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-300 dark:border-green-700"
                      : "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                  }`}>
                    <Timer className={`w-4 h-4 ${
                      timeUntil.isUrgent
                        ? "text-amber-700 dark:text-amber-300 animate-pulse"
                        : timeUntil.isToday
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Next:
                      </span>
                      <span className={`text-sm font-bold ${
                        timeUntil.isUrgent
                          ? "text-amber-700 dark:text-amber-300"
                          : timeUntil.isToday
                          ? "text-green-700 dark:text-green-300"
                          : "text-gray-900 dark:text-gray-100"
                      }`}>
                        {timeUntil.text}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        @ {nextSession.facility?.name?.slice(0, 20) || "Unknown"}{(nextSession.facility?.name?.length || 0) > 20 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Date Navigation - Different for Mobile vs Desktop */}
          {isMobile ? (
            /* Mobile: Day-by-day navigation */
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setDayOffset(dayOffset - 1)}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 shadow-sm text-sm"
                aria-label="Previous day"
              >
                ←
              </button>

              <div className="flex-1 text-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                  {dayOffset === 0
                    ? "Today"
                    : dayOffset === 1
                    ? "Tomorrow"
                    : dayOffset === -1
                    ? "Yesterday"
                    : visibleWeekDates[0].toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {visibleWeekDates[0].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <button
                onClick={() => setDayOffset(dayOffset + 1)}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 shadow-sm text-sm"
                aria-label="Next day"
              >
                →
              </button>

              {dayOffset !== 0 && (
                <button
                  onClick={() => setDayOffset(0)}
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-primary-500 dark:bg-primary-600 text-white hover:bg-primary-600 dark:hover:bg-primary-700 transition-all font-medium shadow-sm text-sm"
                  title="Go to today"
                >
                  Today
                </button>
              )}
            </div>
          ) : (
            /* Desktop: Week navigation */
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="min-h-[44px] px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 shadow-sm text-sm"
              >
                ← Prev
              </button>

              <div className="text-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {weekOffset === 0
                    ? "This Week"
                    : weekOffset > 0
                    ? `+${weekOffset} Week${weekOffset > 1 ? "s" : ""}`
                    : `${weekOffset} Week${weekOffset < -1 ? "s" : ""}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {visibleWeekDates[0].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {visibleWeekDates[
                    visibleWeekDates.length - 1
                  ].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="min-h-[44px] px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 shadow-sm text-sm"
              >
                Next →
              </button>

              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-primary-500 dark:bg-primary-600 text-white hover:bg-primary-600 dark:hover:bg-primary-700 transition-all font-medium shadow-sm text-sm"
                  title="Go to today"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="min-h-[44px] flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold md:hidden hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Swim Types
            </button>

            <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-4 flex-1">
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
                  {/* Sort Mode Toggle: Location vs Favorites */}
                  <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Location Button */}
                    <button
                      type="button"
                      onClick={() => setSortMode("distance")}
                      className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 transition-all duration-200 ${
                        sortMode === "distance"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title="Sort by distance"
                    >
                      <Navigation
                        className={`w-4 h-4 transition-all duration-200 ${
                          sortMode === "distance"
                            ? "fill-green-600 dark:fill-green-400"
                            : ""
                        }`}
                      />
                      <span className="text-sm font-medium hidden sm:inline">Nearest</span>
                    </button>
                    
                    {/* Favorites Button */}
                    <button
                      type="button"
                      onClick={() => setSortMode("favorites")}
                      className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 transition-all duration-200 border-l border-gray-200 dark:border-gray-700 ${
                        sortMode === "favorites"
                          ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title="Favorites first, then by distance"
                    >
                      <Star
                        className={`w-4 h-4 transition-all duration-200 ${
                          sortMode === "favorites"
                            ? "fill-yellow-500 dark:fill-yellow-400"
                            : ""
                        }`}
                      />
                      <span className="text-sm font-medium hidden sm:inline">Favorites</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleGetLocation}
                  className="min-h-[44px] flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                className={`min-h-[44px] flex items-center justify-center px-3 py-2 rounded-md transition-all duration-300 cursor-pointer ${
                  prioritizeHappeningNow
                    ? "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600 shadow-md shadow-blue-400/30"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
              >
                <Waves
                  className={`w-5 h-5 transition-all duration-300 ${
                    prioritizeHappeningNow
                      ? "text-blue-600 dark:text-blue-400 animate-pulse"
                      : "text-blue-500 dark:text-blue-500 opacity-70"
                  }`}
                />
                <span className="text-blue-800 dark:text-blue-300 ml-2 text-sm sm:text-base">
                  <span className="hidden sm:inline">Happening </span>now
                </span>
              </button>

              {/* Pool type: indoor / outdoor */}
              <PoolTypeFilterControl
                value={poolType}
                onChange={setPoolType}
                testId="schedule-pool-type-filter"
                showHint={false}
                label="Pool type"
              />

              {/* View Mode Toggle - Hidden on mobile since list view is optimal */}
              <div className="hidden md:flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 ml-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
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
                  className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
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

          {/* Age Filter Chips - Hidden for adult/senior-only swim types */}
          {swimType !== "ADULT_SWIM" && swimType !== "SENIOR_SWIM" && (
            <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
              <div className="flex gap-2 sm:flex-wrap min-w-max sm:min-w-0">
                {[
                  { key: "all", label: "All Ages" },
                  { key: "infant", label: "Infant (0-3)" },
                  { key: "child", label: "Child (4-12)" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setAgeFilter(key as AgeFilter)}
                    className={`min-h-[44px] whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 flex-shrink-0 ${
                      ageFilter === key
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time-of-day range slider */}
          <div className="mt-3 mb-1 px-2 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <TimeRangeSlider
              start={timeStart}
              end={timeEnd}
              minMinute={TIME_MIN}
              maxMinute={TIME_MAX}
              step={30}
              isDefault={isTimeDefault}
              onChange={(s, e) => {
                setTimeStart(s);
                setTimeEnd(e);
              }}
              onReset={() => {
                setTimeStart(TIME_MIN);
                setTimeEnd(TIME_MAX);
              }}
            />
          </div>

          {/* Free Entry Filter */}
          <div className="mt-3 mb-1">
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show free pools only
              </span>
            </label>
          </div>

          <div className={`${showFilters ? "block" : "hidden"} md:block mt-2`}>
            {/* Swim Type Filter Chips - Horizontal scrollable on mobile, wrapping on desktop */}
            <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
              <div className="flex gap-2 sm:flex-wrap min-w-max sm:min-w-0">
                {["ALL", ...Array.from(availableSwimTypes)].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSwimType(type as SwimType | "ALL")}
                    className={`min-h-[44px] whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 flex-shrink-0 ${
                      swimType === type
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {type === "ALL"
                      ? "All Types"
                      : getSwimTypeFilterLabel(type as SwimType | "ALL", poolType)}
                  </button>
                ))}
              </div>
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
        ) : effectiveViewMode === "list" ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              let dateSessions = sessionsByDate[date];

              // Sort sessions within each date using helper function
              dateSessions = [...dateSessions].sort((a, b) =>
                compareSessions(a, b, sortMode, userLocation, isFavorite)
              );

              // Group sessions by facility for mobile view
              const sessionsByFacility = dateSessions.reduce((acc, session) => {
                const facilityId = session.facility?.facility_id || "unknown";
                if (!acc[facilityId]) {
                  acc[facilityId] = {
                    facility: session.facility,
                    sessions: [],
                    distance: session.distance,
                  };
                }
                acc[facilityId].sessions.push(session);
                return acc;
              }, {} as Record<string, { facility: typeof dateSessions[0]["facility"]; sessions: typeof dateSessions; distance?: number }>);

              // Sort facilities by the same criteria
              const sortedFacilities = Object.entries(sessionsByFacility).sort(
                ([, a], [, b]) =>
                  compareFacilityGroups(
                    { facility: a.facility, distance: a.distance, sessions: a.sessions },
                    { facility: b.facility, distance: b.distance, sessions: b.sessions },
                    facilitySortOptions
                  )
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

                  {/* Sessions grouped by facility */}
                  <div className="p-3 md:p-4 space-y-4">
                    {sortedFacilities.map(([facilityId, data]) => {
                      const { hasOutdoor } = poolFlags(data.facility);
                      const label = poolTypeLabel(data.facility);

                      return (
                        <div
                          key={facilityId}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                        >
                          {/* Facility Header */}
                          <div className="p-3 md:p-4 bg-primary-50 dark:bg-gray-700 border-b border-primary-100 dark:border-gray-600">
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() =>
                                  handleToggleFavorite(data.facility?.facility_id)
                                }
                                className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110 transition-transform duration-200"
                                aria-label={
                                  favorites.has(data.facility?.facility_id || "")
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Star
                                  className={`w-5 h-5 md:w-6 md:h-6 ${
                                    favorites.has(data.facility?.facility_id || "")
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-400 dark:text-gray-500 hover:text-yellow-400"
                                  }`}
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base leading-tight">
                                    {data.facility?.website ? (
                                      <a
                                        href={data.facility.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                                      >
                                        {data.facility?.name}
                                      </a>
                                    ) : (
                                      data.facility?.name
                                    )}
                                    {data.facility?.is_free_entry && (
                                      <FreeEntryBadge />
                                    )}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      hasOutdoor
                                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}
                                  >
                                    {hasOutdoor && <Sun className="w-3 h-3" />}
                                    {label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {data.distance !== undefined && (
                                    <button
                                      onClick={() =>
                                        setMapsModalAddress(data.facility?.address || "")
                                      }
                                      className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                    >
                                      <Navigation className="w-3 h-3" />
                                      {formatDistance(data.distance)}
                                    </button>
                                  )}
                                  {data.facility?.address && (
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        data.facility.address
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs md:text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-[200px] md:max-w-none"
                                    >
                                      {data.facility.address}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Time Slots Grid - sorted with happening now first */}
                          <div className="p-2 md:p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {[...data.sessions].sort((a, b) => {
                              const aHappening = isHappeningNow(a);
                              const bHappening = isHappeningNow(b);
                              if (aHappening && !bHappening) return -1;
                              if (!aHappening && bHappening) return 1;
                              return a.start_time.localeCompare(b.start_time);
                            }).map((session) => {
                              const happeningNow = isHappeningNow(session);
                              return (
                                <div
                                  key={session.id}
                                  className={`p-2.5 md:p-3 rounded-lg transition-all ${
                                    happeningNow
                                      ? "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 ring-2 ring-yellow-400 dark:ring-yellow-600"
                                      : "bg-gray-50 dark:bg-gray-700/50"
                                  }`}
                                >
                                  <div className={`text-sm md:text-base font-bold mb-1 ${
                                    happeningNow
                                      ? "text-yellow-900 dark:text-yellow-100"
                                      : "text-primary-600 dark:text-primary-400"
                                  }`}>
                                    {formatTimeRangeAbbreviated(session.start_time, session.end_time)}
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold ${getSwimTypeColor(
                                        session.swim_type
                                      )}`}
                                    >
                                      {getSwimTypeLabelAbbreviated(session.swim_type)}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      <div className="hidden md:block">
                                        <ShareButton session={session} />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const url = generateCalendarUrl(session);
                                          window.open(url, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        aria-label="Add to calendar"
                                      >
                                        <CalendarIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                      </button>
                                    </div>
                                  </div>
                                  {session.notes && (
                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 md:line-clamp-2">
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
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View - Single page scroll, no separate table scroll */
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="w-full table-fixed min-w-full"
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <thead className="bg-gradient-to-r from-primary-500 to-primary-600 text-white sticky top-0 z-20 shadow-md">
                  <tr>
                    <th
                      className="px-2 sm:px-4 py-3 sm:py-4 text-left sticky left-0 bg-gradient-to-b from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 z-30 shadow-[2px_0_8px_rgba(0,0,0,0.15)] border-r-2 border-primary-400/40"
                      style={{
                        width: isMobile ? "140px" : "280px",
                        minWidth: isMobile ? "140px" : "280px",
                        maxWidth: isMobile ? "140px" : "280px",
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg border border-white/20">
                          {sortMode === "favorites" ? (
                            <Star
                              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 fill-white ${
                                iconJump ? "animate-bounce" : ""
                              }`}
                            />
                          ) : sortMode === "distance" ? (
                            <Navigation
                              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 fill-white ${
                                iconJump ? "animate-bounce" : ""
                              }`}
                            />
                          ) : (
                            <MapPin
                              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 transition-transform duration-300 ${
                                iconJump ? "animate-bounce" : ""
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white leading-tight">
                            <span className="hidden sm:inline">
                              Community Centre
                            </span>
                            <span className="sm:hidden">Pool</span>
                          </span>
                          <span className="text-[10px] sm:text-xs text-primary-100/80 mt-0.5 font-medium">
                            {sortMode === "distance"
                              ? "Sorted by Location"
                              : "Sorted by Favorites"}
                          </span>
                        </div>
                      </div>
                    </th>
                    {visibleWeekDates.map((date, index) => {
                      const formatted = formatWeekdayHeader(date);
                      const isToday =
                        new Date(date).toDateString() ===
                        new Date().toDateString();
                      return (
                        <th
                          key={index}
                          className={`px-2 sm:px-2 py-3 sm:py-4 text-center transition-all relative ${
                            isToday
                              ? "bg-gradient-to-b from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 ring-2 ring-yellow-400 dark:ring-yellow-500 ring-inset shadow-lg"
                              : "bg-gradient-to-b from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700"
                          }`}
                          style={{
                            width: isMobile
                              ? `calc((100% - 140px) / 6)`
                              : `calc((100% - 280px) / 6)`,
                            minWidth: isMobile ? "80px" : "100px",
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div
                              className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                                isToday
                                  ? "text-yellow-100 drop-shadow-lg"
                                  : "text-white"
                              }`}
                            >
                              {formatted.weekday}
                            </div>
                            <div
                              className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md ${
                                isToday
                                  ? "bg-yellow-400/20 text-yellow-100 border border-yellow-300/30"
                                  : "bg-white/10 text-primary-50 border border-white/20"
                              }`}
                            >
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
                  {sortedFacilityEntries.map(([facilityId, data]) => (
                    <tr
                      key={facilityId}
                      className="hover:bg-primary-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td
                        className="px-2 sm:px-4 py-2 sm:py-3 sticky left-0 bg-white/98 dark:bg-gray-800/98 backdrop-blur-md z-10 border-r-2 border-gray-300 dark:border-gray-600 shadow-[2px_0_8px_rgba(0,0,0,0.05)]"
                        style={{
                          width: isMobile ? "140px" : "280px",
                          minWidth: isMobile ? "140px" : "280px",
                          maxWidth: isMobile ? "140px" : "280px",
                        }}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <button
                            onClick={() =>
                              handleToggleFavorite(data.facility?.facility_id)
                            }
                            className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110 transition-transform duration-200 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
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
                              className={`w-6 h-6 transition-all duration-200 ${
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
                                  {data.facility?.name || "Unknown"}
                                </a>
                              ) : (
                                data.facility?.name || "Unknown"
                              )}
                              {data.facility?.is_free_entry && (
                                <span className="ml-2 inline-block"><FreeEntryBadge /></span>
                              )}
                            </div>
                            {data.distance !== undefined &&
                              data.facility?.address && (
                                <button
                                  onClick={() =>
                                    setMapsModalAddress(data.facility!.address!)
                                  }
                                  className="mb-2 min-h-[44px] px-3 py-2 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 cursor-pointer transition-all duration-200 flex items-center gap-1.5"
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
                        // Format date to match session date format (YYYY-MM-DD) using local timezone
                        // Use the date object directly to avoid timezone conversion issues
                        // Normalize current date for comparisons
                        const currentDateNormalized = new Date(currentDate);
                        currentDateNormalized.setHours(0, 0, 0, 0);

                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth() + 1;
                        const day = currentDate.getDate();
                        const dateString = `${year}-${String(month).padStart(
                          2,
                          "0"
                        )}-${String(day).padStart(2, "0")}`;

                        // Look up sessions for this date - try exact match first
                        let daySessions = data.sessions[dateString] || [];

                        // If no sessions found, check all session keys to find matching date
                        // This handles any date format inconsistencies
                        if (
                          daySessions.length === 0 &&
                          Object.keys(data.sessions).length > 0
                        ) {
                          // Try to find sessions by comparing date values
                          const matchingKey = Object.keys(data.sessions).find(
                            (key) => {
                              try {
                                const [keyYear, keyMonth, keyDay] = key
                                  .split("-")
                                  .map(Number);
                                const keyDate = new Date(
                                  keyYear,
                                  keyMonth - 1,
                                  keyDay
                                );
                                keyDate.setHours(0, 0, 0, 0);
                                return (
                                  keyDate.getTime() ===
                                  currentDateNormalized.getTime()
                                );
                              } catch {
                                return false;
                              }
                            }
                          );
                          if (matchingKey) {
                            daySessions = data.sessions[matchingKey] || [];
                          }
                        }

                        const cellKey = `${facilityId}-${dateString}`;
                        const isExpanded = expandedCells.has(cellKey);
                        const displaySessions = isExpanded
                          ? daySessions
                          : daySessions.slice(0, 3);

                        // Check if this date is today - use normalized dates for accurate comparison
                        const todayNormalized = new Date();
                        todayNormalized.setHours(0, 0, 0, 0);
                        const isToday =
                          currentDateNormalized.getTime() ===
                          todayNormalized.getTime();

                        // Check if this date is yesterday
                        const yesterdayNormalized = new Date(todayNormalized);
                        yesterdayNormalized.setDate(
                          todayNormalized.getDate() - 1
                        );
                        const isYesterday =
                          currentDateNormalized.getTime() ===
                          yesterdayNormalized.getTime();

                        return (
                          <td
                            key={index}
                            className={`px-2 sm:px-1.5 py-2.5 sm:py-2 text-center align-top transition-colors overflow-hidden ${
                              isToday
                                ? "bg-primary-50/30 dark:bg-primary-900/10 border-l-2 border-r-2 border-primary-300 dark:border-primary-700"
                                : isYesterday
                                ? "bg-gray-50/50 dark:bg-gray-800/30 border-l border-r border-gray-200 dark:border-gray-700"
                                : ""
                            }`}
                            style={{
                              width: isMobile
                                ? `calc((100% - 140px) / 6)`
                                : `calc((100% - 280px) / 6)`,
                              minWidth: isMobile ? "80px" : "100px",
                            }}
                          >
                            {daySessions.length > 0 ? (
                              <div className="space-y-2 sm:space-y-2">
                                {displaySessions.map((session) => {
                                  const happeningNow = isHappeningNow(session);

                                  return (
                                    <div
                                      key={session.id}
                                      className={`group relative p-2 sm:p-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                                        happeningNow
                                          ? "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/60 dark:to-yellow-900/40 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg shadow-yellow-400/20"
                                          : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                      }`}
                                    >
                                      <div
                                        className={`text-sm font-bold mb-1 break-words leading-tight ${
                                          happeningNow
                                            ? "text-yellow-900 dark:text-yellow-100"
                                            : isToday || isYesterday
                                            ? "text-primary-700 dark:text-primary-300 font-semibold"
                                            : "text-gray-900 dark:text-gray-100"
                                        }`}
                                      >
                                        {isMobile
                                          ? formatTimeRangeAbbreviated(
                                              session.start_time,
                                              session.end_time
                                            )
                                          : formatTimeRange(
                                              session.start_time,
                                              session.end_time
                                            )}
                                      </div>
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm break-words ${getSwimTypeColor(
                                          session.swim_type
                                        )}`}
                                      >
                                        {isMobile
                                          ? getSwimTypeLabelAbbreviated(session.swim_type)
                                          : getSwimTypeLabel(session.swim_type)}
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
                                    className="w-full mt-2 min-h-[44px] px-2 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200"
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
              className="mt-4 w-full min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
