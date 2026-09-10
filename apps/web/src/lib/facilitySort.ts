import { calculateDistance, type UserLocation } from "./utils";
import type { Facility, Session } from "../types";

export type FacilitySortMode = "distance" | "favorites";

export interface FacilityGroupSortInput {
  facility?: Facility | null;
  distance?: number;
  sessions: Session[] | Record<string, Session[]>;
}

function flatSessions(
  sessions: Session[] | Record<string, Session[]>
): Session[] {
  return Array.isArray(sessions) ? sessions : Object.values(sessions).flat();
}

/** Distance in km — uses cached value or recomputes from facility coordinates. */
export function facilityDistanceKm(
  facility: Facility | null | undefined,
  userLocation: UserLocation | null,
  cached?: number
): number | undefined {
  if (cached !== undefined) return cached;
  if (
    !userLocation ||
    facility?.latitude == null ||
    facility?.longitude == null
  ) {
    return undefined;
  }
  return calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    facility.latitude,
    facility.longitude
  );
}

export function compareFacilityGroups(
  a: FacilityGroupSortInput,
  b: FacilityGroupSortInput,
  options: {
    sortMode: FacilitySortMode;
    userLocation: UserLocation | null;
    isFavorite: (facilityId: string) => boolean;
    prioritizeHappeningNow: boolean;
    isHappeningNow: (session: Session) => boolean;
  }
): number {
  const {
    sortMode,
    userLocation,
    isFavorite,
    prioritizeHappeningNow,
    isHappeningNow,
  } = options;

  const facilityA = a.facility;
  const facilityB = b.facility;
  const isFavA = facilityA?.facility_id
    ? isFavorite(facilityA.facility_id)
    : false;
  const isFavB = facilityB?.facility_id
    ? isFavorite(facilityB.facility_id)
    : false;

  // Nearest mode: strict ascending numeric distance — no other overrides
  if (sortMode === "distance" && userLocation) {
    const distA = facilityDistanceKm(facilityA, userLocation, a.distance);
    const distB = facilityDistanceKm(facilityB, userLocation, b.distance);
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  // Happening-now boost only when user enabled that filter (never in nearest mode)
  if (prioritizeHappeningNow) {
    const hasA = flatSessions(a.sessions).some(isHappeningNow);
    const hasB = flatSessions(b.sessions).some(isHappeningNow);
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
  }

  if (sortMode === "favorites" && userLocation) {
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;
    const distA = facilityDistanceKm(facilityA, userLocation, a.distance);
    const distB = facilityDistanceKm(facilityB, userLocation, b.distance);
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  if (userLocation) {
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;
    const distA = facilityDistanceKm(facilityA, userLocation, a.distance);
    const distB = facilityDistanceKm(facilityB, userLocation, b.distance);
    if (distA === undefined) return 1;
    if (distB === undefined) return -1;
    return distA - distB;
  }

  if (isFavA && !isFavB) return -1;
  if (!isFavA && isFavB) return 1;
  return (facilityA?.name || "").localeCompare(facilityB?.name || "");
}
