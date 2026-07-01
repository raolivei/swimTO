import { describe, expect, it } from "vitest";
import { getSwimTypeFilterLabel, matchesSwimTypeFilter } from "./swimTypeFilter";

describe("matchesSwimTypeFilter", () => {
  it("includes recreational when outdoor and lane chip selected", () => {
    expect(matchesSwimTypeFilter("RECREATIONAL", "LANE_SWIM", "outdoor")).toBe(
      true
    );
    expect(matchesSwimTypeFilter("LANE_SWIM", "LANE_SWIM", "outdoor")).toBe(
      true
    );
  });

  it("excludes recreational for indoor lane-only filter", () => {
    expect(matchesSwimTypeFilter("RECREATIONAL", "LANE_SWIM", "indoor")).toBe(
      false
    );
    expect(matchesSwimTypeFilter("LANE_SWIM", "LANE_SWIM", "indoor")).toBe(
      true
    );
  });

  it("shows only recreational when that chip is selected", () => {
    expect(matchesSwimTypeFilter("RECREATIONAL", "RECREATIONAL", "outdoor")).toBe(
      true
    );
    expect(matchesSwimTypeFilter("LANE_SWIM", "RECREATIONAL", "outdoor")).toBe(
      false
    );
  });
});

describe("getSwimTypeFilterLabel", () => {
  it("labels outdoor lane default as Lane & Rec", () => {
    expect(getSwimTypeFilterLabel("LANE_SWIM", "outdoor")).toBe("Lane & Rec");
    expect(getSwimTypeFilterLabel("LANE_SWIM", "indoor")).toBe("Lane Swim");
  });
});
