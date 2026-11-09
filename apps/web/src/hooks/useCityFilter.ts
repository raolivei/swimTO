import { useCallback, useState } from "react";

const STORAGE_KEY = "swimto_city";

/** Keep the selected city when switching between the map and schedule. */
export function useCityFilter(): [string, (city: string) => void] {
  const [city, setCityState] = useState(() => localStorage.getItem(STORAGE_KEY) || "All");
  const setCity = useCallback((next: string) => {
    setCityState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);
  return [city, setCity];
}
