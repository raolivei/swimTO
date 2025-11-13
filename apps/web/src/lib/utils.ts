import { format, parse, isToday, isTomorrow } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateString: string): string {
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
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "EEEE");
}

// GPS Location types and utilities
export interface UserLocation {
  latitude: number;
  longitude: number;
}

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

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

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
        maximumAge: 300000,
      }
    );
  });
}

const FAVORITES_KEY = "swimto_favorites";

export function getFavoritesFromLocalStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error("Error loading favorites from localStorage:", error);
  }
  return new Set();
}

export function saveFavoritesToLocalStorage(facilityIds: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(facilityIds)));
  } catch (error) {
    console.error("Error saving favorites to localStorage:", error);
  }
}

export function addFavoriteToLocalStorage(facilityId: string): void {
  try {
    const favorites = getFavoritesFromLocalStorage();
    favorites.add(facilityId);
    saveFavoritesToLocalStorage(favorites);
  } catch (error) {
    console.error("Error adding favorite to localStorage:", error);
  }
}

export function removeFavoriteFromLocalStorage(facilityId: string): void {
  try {
    const favorites = getFavoritesFromLocalStorage();
    favorites.delete(facilityId);
    saveFavoritesToLocalStorage(favorites);
  } catch (error) {
    console.error("Error removing favorite from localStorage:", error);
  }
}

export async function syncLocalFavoritesToBackend(
  favoritesApi: {
    add: (facilityId: string) => Promise<unknown>;
  }
): Promise<void> {
  try {
    const localFavorites = getFavoritesFromLocalStorage();
    if (localFavorites.size > 0) {
      const promises = Array.from(localFavorites).map((facilityId) =>
        favoritesApi.add(facilityId).catch((err) => {
          console.warn(`Failed to sync favorite ${facilityId}:`, err);
        })
      );
      await Promise.all(promises);
      localStorage.removeItem(FAVORITES_KEY);
    }
  } catch (error) {
    console.error("Error syncing favorites to backend:", error);
  }
}

export function isNextAvailableSession(
  session: { date: string; start_time: string; end_time: string },
  allSessions: Array<{
    date: string;
    start_time: string;
    end_time: string;
    id: number;
  }>
): boolean {
  try {
    const now = new Date();
    const [year, month, day] = session.date.split("-").map(Number);
    const [startHour, startMinute] = session.start_time.split(":").map(Number);
    const [endHour, endMinute] = session.end_time.split(":").map(Number);

    const sessionStart = new Date(year, month - 1, day, startHour, startMinute);
    const sessionEnd = new Date(year, month - 1, day, endHour, endMinute);
    if (now >= sessionEnd) {
      return false;
    }
    const availableSessions = allSessions.filter((s) => {
      const [y, m, d] = s.date.split("-").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      const sEnd = new Date(y, m - 1, d, eh, em);
      return now < sEnd;
    });
    if (availableSessions.length === 0) {
      return false;
    }
    const earliest = availableSessions.reduce((earliest, current) => {
      const [cy, cm, cd] = current.date.split("-").map(Number);
      const [csh, csm] = current.start_time.split(":").map(Number);
      const currentStart = new Date(cy, cm - 1, cd, csh, csm);

      const [ey, em, ed] = earliest.date.split("-").map(Number);
      const [esh, esm] = earliest.start_time.split(":").map(Number);
      const earliestStart = new Date(ey, em - 1, ed, esh, esm);

      return currentStart < earliestStart ? current : earliest;
    });
    return (
      session.date === earliest.date &&
      session.start_time === earliest.start_time &&
      session.end_time === earliest.end_time
    );
  } catch (error) {
    console.error("Error checking if session is next available:", error);
    return false;
  }
}
