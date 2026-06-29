import type { PoolTypeFilter } from "./api";
import type { Facility } from "../types";

export function poolFlags(
  facility: Facility | undefined | null
): { hasIndoor: boolean; hasOutdoor: boolean } {
  if (!facility) {
    return { hasIndoor: false, hasOutdoor: false };
  }
  if (facility.has_indoor !== undefined || facility.has_outdoor !== undefined) {
    return {
      hasIndoor: facility.has_indoor ?? false,
      hasOutdoor: facility.has_outdoor ?? false,
    };
  }
  return { hasIndoor: facility.is_indoor ?? false, hasOutdoor: !(facility.is_indoor ?? true) };
}

export function poolTypeLabel(facility: Facility | undefined | null): string {
  const { hasIndoor, hasOutdoor } = poolFlags(facility);
  if (hasIndoor && hasOutdoor) return "Indoor & outdoor";
  if (hasOutdoor) return "Outdoor";
  return "Indoor";
}

export function matchesPoolTypeFilter(
  facility: Facility | undefined | null,
  poolType: PoolTypeFilter
): boolean {
  if (poolType === "all") return true;
  const { hasIndoor, hasOutdoor } = poolFlags(facility);
  if (poolType === "indoor") return hasIndoor;
  return hasOutdoor;
}
