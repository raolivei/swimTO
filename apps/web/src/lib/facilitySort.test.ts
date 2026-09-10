import { describe, expect, it } from "vitest";
import { compareFacilityGroups } from "./facilitySort";
import type { Facility, Session } from "../types";

const userLocation = { latitude: 43.6532, longitude: -79.3832 };

const nearFacility = {
  facility_id: "near",
  name: "Near Pool",
  address: null,
  postal_code: null,
  latitude: 43.66,
  longitude: -79.38,
  is_free_entry: false,
  website: null,
  district: null,
  is_indoor: true,
  phone: null,
  source: null,
  created_at: "",
  updated_at: "",
} satisfies Facility;

const farFacility = {
  facility_id: "far",
  name: "Far Pool",
  address: null,
  postal_code: null,
  latitude: 43.9,
  longitude: -79.5,
  is_free_entry: false,
  website: null,
  district: null,
  is_indoor: true,
  phone: null,
  source: null,
  created_at: "",
  updated_at: "",
} satisfies Facility;

const dummySession = (facility: Facility): Session => ({
  id: 1,
  facility_id: facility.facility_id,
  swim_type: "LANE_SWIM",
  date: "2026-06-23",
  start_time: "12:00",
  end_time: "13:00",
  notes: null,
  age_min: null,
  age_max: null,
  source: null,
  created_at: "",
  facility,
});

describe("compareFacilityGroups", () => {
  it("sorts by ascending distance in nearest mode", () => {
    const result = compareFacilityGroups(
      { facility: farFacility, distance: 30, sessions: [dummySession(farFacility)] },
      { facility: nearFacility, distance: 1, sessions: [dummySession(nearFacility)] },
      {
        sortMode: "distance",
        userLocation,
        isFavorite: () => false,
        prioritizeHappeningNow: false,
        isHappeningNow: () => true, // must not override nearest mode
      }
    );
    expect(result).toBeGreaterThan(0); // far after near
  });

  it("does not let happening-now override nearest mode", () => {
    const result = compareFacilityGroups(
      { facility: farFacility, distance: 30, sessions: [dummySession(farFacility)] },
      { facility: nearFacility, distance: 1, sessions: [dummySession(nearFacility)] },
      {
        sortMode: "distance",
        userLocation,
        isFavorite: () => false,
        prioritizeHappeningNow: true,
        isHappeningNow: (s) => s.facility_id === "far",
      }
    );
    expect(result).toBeGreaterThan(0);
  });

  it("boosts happening-now only when filter is on and not in nearest mode", () => {
    const result = compareFacilityGroups(
      { facility: farFacility, distance: 30, sessions: [dummySession(farFacility)] },
      { facility: nearFacility, distance: 1, sessions: [dummySession(nearFacility)] },
      {
        sortMode: "favorites",
        userLocation,
        isFavorite: () => false,
        prioritizeHappeningNow: true,
        isHappeningNow: (s) => s.facility_id === "far",
      }
    );
    expect(result).toBeLessThan(0); // far (happening now) before near
  });
});
