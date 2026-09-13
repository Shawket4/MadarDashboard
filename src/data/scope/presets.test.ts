import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({ preset: "today" }),
  useNavigate: () => vi.fn(),
}));

import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { rangeForPreset } from "./presets";
import { useScope } from "./use-scope";

// 2026-03-08 15:00 UTC — US DST starts that morning (02:00 EST → 03:00 EDT).
const NOW = Date.UTC(2026, 2, 8, 15, 0, 0);

describe("rangeForPreset timezone", () => {
  afterEach(() => useAppStore.getState().setActiveTimezone(APP_TZ));

  it("New York and Cairo branches get different today boundaries", () => {
    const ny = rangeForPreset("today", "America/New_York", NOW);
    const cairo = rangeForPreset("today", "Africa/Cairo", NOW);
    expect(cairo).toEqual({ from: "2026-03-07T22:00:00.000Z", to: "2026-03-08T21:59:59.999Z" });
    expect(ny.from).toBe("2026-03-08T05:00:00.000Z"); // midnight EST
    expect(ny.from).not.toBe(cairo.from);
  });

  it("handles the DST transition day (23h day)", () => {
    const ny = rangeForPreset("today", "America/New_York", NOW);
    expect(ny.to).toBe("2026-03-09T03:59:59.999Z"); // 23:59:59.999 EDT
    expect(Date.parse(ny.to) - Date.parse(ny.from) + 1).toBe(23 * 3600_000);
    const y = rangeForPreset("yesterday", "America/New_York", Date.UTC(2026, 2, 9, 15));
    expect(y).toEqual({ from: "2026-03-08T05:00:00.000Z", to: "2026-03-09T03:59:59.999Z" });
    const wk = rangeForPreset("7d", "America/New_York", NOW);
    expect(wk.from).toBe("2026-03-02T05:00:00.000Z");
    expect(rangeForPreset("mtd", "America/New_York", NOW).from).toBe("2026-03-01T05:00:00.000Z");
    expect(rangeForPreset("30d", "Africa/Cairo", NOW).from).toBe("2026-02-06T22:00:00.000Z");
  });

  it("useScope recomputes when the active (branch) timezone changes", () => {
    act(() => useAppStore.getState().setActiveTimezone("Africa/Cairo"));
    const { result } = renderHook(() => useScope());
    const cairoFrom = result.current.from!;
    act(() => useAppStore.getState().setActiveTimezone("America/New_York"));
    expect(result.current.from).not.toBe(cairoFrom);
    expect(result.current.from).toBe(rangeForPreset("today", "America/New_York").from);
  });
});
