import type { PoolTypeFilter } from "./api";
import type { SwimType } from "../types";

/** Drop-in types commonly offered at outdoor pools (City of Toronto). */
export const OUTDOOR_DROP_IN_SWIM_TYPES: readonly SwimType[] = [
  "LANE_SWIM",
  "RECREATIONAL",
];

export function getSwimTypeFilterLabel(
  swimType: SwimType | "ALL",
  poolType: PoolTypeFilter
): string {
  if (swimType === "ALL") return "All Types";
  if (swimType === "LANE_SWIM" && poolType === "outdoor") {
    return "Lane & Rec";
  }
  const labels: Record<string, string> = {
    LANE_SWIM: "Lane Swim",
    RECREATIONAL: "Recreational Swim",
    ADULT_SWIM: "Adult Swim",
    SENIOR_SWIM: "Senior Swim",
    AQUATIC_FITNESS: "Aquatic Fitness",
    OTHER: "Other",
  };
  return labels[swimType] || swimType;
}

/**
 * Schedule swim-type filter. Outdoor pools default to lane + recreational
 * when the Lane Swim chip is selected (same default as indoor-only lane view).
 */
export function matchesSwimTypeFilter(
  sessionSwimType: string,
  swimType: SwimType | "ALL",
  poolType: PoolTypeFilter
): boolean {
  if (swimType === "ALL") return true;
  if (poolType === "outdoor" && swimType === "LANE_SWIM") {
    return OUTDOOR_DROP_IN_SWIM_TYPES.includes(sessionSwimType as SwimType);
  }
  return sessionSwimType === swimType;
}
