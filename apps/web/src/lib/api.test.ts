import { beforeEach, expect, test, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({
  default: {
    create: () => ({
      get,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

import { scheduleApi } from "./api";

beforeEach(() => get.mockReset());

test("GTA schedules include records beyond the first 1,000 sessions", async () => {
  get.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, id) => ({ id })) });
  get.mockResolvedValueOnce({ data: [{ id: 1000, facility_id: "vaughan-maple" }] });
  const filters = { city: "Vaughan", date_from: "2026-10-29", date_to: "2026-11-05" };
  const result = await scheduleApi.getAllSchedule(filters);
  expect(result).toHaveLength(1001);
  expect(result[result.length - 1]?.facility_id).toBe("vaughan-maple");
  expect(get).toHaveBeenNthCalledWith(2, "/schedule", {
    params: { ...filters, limit: 1000, offset: 1000 },
  });
});

test("a failed later page does not silently return an incomplete schedule", async () => {
  get.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, id) => ({ id })) });
  get.mockRejectedValueOnce(new Error("Calendar unavailable"));
  await expect(scheduleApi.getAllSchedule()).rejects.toThrow("Calendar unavailable");
});
