import type { PoolTypeFilter } from "./api";
import { getSwimTypeLabel } from "./utils";
import type { SwimType } from "../types";

export type SwimTypeFilter = SwimType | "ALL";

/** Primary drop-in types — always offer chips when present in data. */
export const PRIMARY_SWIM_TYPES: readonly SwimType[] = [
  "LANE_SWIM",
  "RECREATIONAL",
];

const SWIM_TYPE_SORT_ORDER: readonly string[] = [
  "LANE_SWIM",
  "RECREATIONAL",
  "ADULT_SWIM",
  "SENIOR_SWIM",
  "AQUATIC_FITNESS",
  "OTHER",
];

export function getSwimTypeFilterLabel(swimType: SwimTypeFilter): string {
  if (swimType === "ALL") return "All Types";
  return getSwimTypeLabel(swimType);
}

export function matchesSwimTypeFilter(
  sessionSwimType: string,
  swimType: SwimTypeFilter
): boolean {
  if (swimType === "ALL") return true;
  return sessionSwimType === swimType;
}

/** Ordered chip list: primary types first, then any others in the dataset. */
export function orderSwimTypeOptions(available: Set<string>): SwimTypeFilter[] {
  const options: SwimTypeFilter[] = ["ALL"];
  for (const type of SWIM_TYPE_SORT_ORDER) {
    if (available.has(type)) {
      options.push(type as SwimType);
    }
  }
  for (const type of available) {
    if (!SWIM_TYPE_SORT_ORDER.includes(type)) {
      options.push(type as SwimType);
    }
  }
  return options;
}

/** When switching to outdoor pools, broaden default from lane-only to all drop-in types. */
export function swimTypeForPoolTypeChange(
  poolType: PoolTypeFilter,
  current: SwimTypeFilter
): SwimTypeFilter {
  if (poolType === "outdoor" && current === "LANE_SWIM") {
    return "ALL";
  }
  return current;
}
