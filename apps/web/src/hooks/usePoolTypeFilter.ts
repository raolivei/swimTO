import { useCallback, useState } from "react";
import type { PoolTypeFilter } from "../lib/api";

const STORAGE_KEY = "swimto_pool_type";

function readStoredPoolType(): PoolTypeFilter {
  if (typeof window === "undefined") return "all";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "indoor" || stored === "outdoor" || stored === "all") {
    return stored;
  }
  return "all";
}

/** Shared indoor/outdoor filter — persisted across schedule and map. */
export function usePoolTypeFilter(): [PoolTypeFilter, (next: PoolTypeFilter) => void] {
  const [poolType, setPoolTypeState] = useState<PoolTypeFilter>(readStoredPoolType);

  const setPoolType = useCallback((next: PoolTypeFilter) => {
    setPoolTypeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return [poolType, setPoolType];
}
