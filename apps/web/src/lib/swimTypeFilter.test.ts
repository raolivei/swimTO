import { describe, expect, it } from "vitest";
import {
  matchesSwimTypeFilter,
  orderSwimTypeOptions,
  swimTypeForPoolTypeChange,
} from "./swimTypeFilter";

describe("matchesSwimTypeFilter", () => {
  it("filters to a single swim type", () => {
    expect(matchesSwimTypeFilter("RECREATIONAL", "RECREATIONAL")).toBe(true);
    expect(matchesSwimTypeFilter("LANE_SWIM", "RECREATIONAL")).toBe(false);
  });

  it("returns all types when ALL selected", () => {
    expect(matchesSwimTypeFilter("RECREATIONAL", "ALL")).toBe(true);
    expect(matchesSwimTypeFilter("LANE_SWIM", "ALL")).toBe(true);
  });
});

describe("orderSwimTypeOptions", () => {
  it("puts lane and recreational before other types", () => {
    const options = orderSwimTypeOptions(
      new Set(["AQUATIC_FITNESS", "RECREATIONAL", "LANE_SWIM"])
    );
    expect(options).toEqual([
      "ALL",
      "LANE_SWIM",
      "RECREATIONAL",
      "AQUATIC_FITNESS",
    ]);
  });
});

describe("swimTypeForPoolTypeChange", () => {
  it("broadens lane-only to all when outdoor is selected", () => {
    expect(swimTypeForPoolTypeChange("outdoor", "LANE_SWIM")).toBe("ALL");
    expect(swimTypeForPoolTypeChange("indoor", "LANE_SWIM")).toBe("LANE_SWIM");
    expect(swimTypeForPoolTypeChange("outdoor", "RECREATIONAL")).toBe(
      "RECREATIONAL"
    );
  });
});
