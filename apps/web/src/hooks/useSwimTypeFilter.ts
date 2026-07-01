import { useCallback, useState } from "react";
import type { SwimTypeFilter } from "../lib/swimTypeFilter";

const STORAGE_KEY = "swimto_swim_type";

function readStoredSwimType(): SwimTypeFilter {
  if (typeof window === "undefined") return "LANE_SWIM";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ALL") return "ALL";
  if (
    stored === "LANE_SWIM" ||
    stored === "RECREATIONAL" ||
    stored === "ADULT_SWIM" ||
    stored === "SENIOR_SWIM" ||
    stored === "AQUATIC_FITNESS" ||
    stored === "OTHER"
  ) {
    return stored;
  }
  return "LANE_SWIM";
}

/** Shared swim-type filter — persisted across schedule and map. */
export function useSwimTypeFilter(): [
  SwimTypeFilter,
  (next: SwimTypeFilter) => void,
] {
  const [swimType, setSwimTypeState] = useState<SwimTypeFilter>(readStoredSwimType);

  const setSwimType = useCallback((next: SwimTypeFilter) => {
    setSwimTypeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return [swimType, setSwimType];
}
