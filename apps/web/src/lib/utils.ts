import { format, parse, isToday, isTomorrow } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateString: string): string {
  // Parse date as local date to avoid timezone issues
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  return format(date, "MMM d, yyyy");
}

export function formatTime(timeString: string): string {
  const time = parse(timeString, "HH:mm:ss", new Date());
  return format(time, "h:mm a");
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function getSwimTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LANE_SWIM: "Lane Swim",
    RECREATIONAL: "Recreational Swim",
    ADULT_SWIM: "Adult Swim",
    SENIOR_SWIM: "Senior Swim",
    OTHER: "Other",
  };
  return labels[type] || type;
}

export function getSwimTypeColor(type: string): string {
  const colors: Record<string, string> = {
    LANE_SWIM: "bg-blue-100 text-blue-800",
    RECREATIONAL: "bg-green-100 text-green-800",
    ADULT_SWIM: "bg-purple-100 text-purple-800",
    SENIOR_SWIM: "bg-orange-100 text-orange-800",
    OTHER: "bg-gray-100 text-gray-800",
  };
  return colors[type] || colors.OTHER;
}

export function getDayOfWeek(dateString: string): string {
  // Parse date as local date to avoid timezone issues
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "EEEE");
}

// GPS Location types and utilities
export interface UserLocation {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Get user's current GPS location
 * Returns a promise that resolves to UserLocation or rejects if permission denied/error
 */
export function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

// Favorites management using localStorage
const FAVORITES_KEY = "swimto_favorites";

/**
 * Get all favorite facility IDs from localStorage
 */
export function getFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error("Error loading favorites:", error);
  }
  return new Set();
}

/**
 * Check if a facility is favorited
 */
export function isFavorite(facilityId: string): boolean {
  return getFavorites().has(facilityId);
}

/**
 * Add a facility to favorites
 */
export function addFavorite(facilityId: string): void {
  try {
    const favorites = getFavorites();
    favorites.add(facilityId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (error) {
    console.error("Error adding favorite:", error);
  }
}

/**
 * Remove a facility from favorites
 */
export function removeFavorite(facilityId: string): void {
  try {
    const favorites = getFavorites();
    favorites.delete(facilityId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (error) {
    console.error("Error removing favorite:", error);
  }
}

/**
 * Toggle favorite status for a facility
 */
export function toggleFavorite(facilityId: string): boolean {
  const favorites = getFavorites();
  if (favorites.has(facilityId)) {
    removeFavorite(facilityId);
    return false;
  } else {
    addFavorite(facilityId);
    return true;
  }
}
