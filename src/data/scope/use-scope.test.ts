/**
 * The scope's period. The case that matters is "custom" arriving WITHOUT its
 * dates: the last-used preset is persisted and the hand-picked range is not,
 * so a bare-URL entry used to replay `preset=custom` with nothing to resolve.
 * Every page then read the null range differently — the till sessions report
 * showed "none in this period" for ever, others silently queried all time.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const search: Record<string, unknown> = {};

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => search,
  useNavigate: () => vi.fn(),
}));

const { useScope } = await import("./use-scope");
const { rangeForPreset } = await import("./presets");
const { APP_TZ } = await import("@/data/config/constants");

const scopeFor = (s: Record<string, unknown>) => {
  for (const k of Object.keys(search)) delete search[k];
  Object.assign(search, s);
  return renderHook(() => useScope()).result.current;
};

describe("useScope period", () => {
  it("keeps a custom range that carries both dates", () => {
    const s = scopeFor({ preset: "custom", from: "2026-09-01T00:00:00.000Z", to: "2026-09-07T23:59:59.999Z" });
    expect(s.preset).toBe("custom");
    expect(s.from).toBe("2026-09-01T00:00:00.000Z");
    expect(s.to).toBe("2026-09-07T23:59:59.999Z");
  });

  it("falls back to the default preset when custom has no dates", () => {
    const s = scopeFor({ preset: "custom" });
    expect(s.preset).toBe("30d");
    // The resolved window is the default preset's, not an empty one.
    expect({ from: s.from, to: s.to }).toEqual(rangeForPreset("30d", APP_TZ));
  });

  it("falls back when custom carries only half a range", () => {
    // A `to` with no `from` is not a period either — resolving it as one would
    // send an open-ended window to every report on the page.
    expect(scopeFor({ preset: "custom", to: "2026-09-07T23:59:59.999Z" }).preset).toBe("30d");
    expect(scopeFor({ preset: "custom", from: "2026-09-01T00:00:00.000Z" }).preset).toBe("30d");
  });

  it("never hands a page a null period", () => {
    for (const s of [scopeFor({}), scopeFor({ preset: "custom" }), scopeFor({ preset: "today" })]) {
      expect(s.from).toBeTruthy();
      expect(s.to).toBeTruthy();
    }
  });
});
