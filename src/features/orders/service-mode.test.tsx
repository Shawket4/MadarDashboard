import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

await import("@/i18n");
const { serviceModeOf, serviceModeRows } = await import("./service-mode");
const { ServiceModeBadge } = await import("./service-mode-badge");
const { ServiceModeSplit } = await import("@/features/analytics/service-mode-split");

describe("service mode", () => {
  it("an order without one (an older till) is Pickup", () => {
    expect(serviceModeOf({})).toBe("takeaway");
    expect(serviceModeOf({ service_mode: "dine_in" })).toBe("dine_in");
    expect(serviceModeOf({ service_mode: "weird" })).toBe("takeaway");
    expect(serviceModeOf(null)).toBe("takeaway");
  });

  it("the report split is always both rows, in order, with shares that add to 1", () => {
    expect(serviceModeRows(undefined).map((r) => [r.mode, r.share])).toEqual([["takeaway", 0], ["dine_in", 0]]);
    const rows = serviceModeRows([
      { service_mode: "dine_in", orders: 1, revenue: 25000 },
      { service_mode: "takeaway", orders: 3, revenue: 75000 },
    ]);
    expect(rows.map((r) => r.mode)).toEqual(["takeaway", "dine_in"]);
    expect(rows[0].share).toBeCloseTo(0.75);
    expect(rows[1].share).toBeCloseTo(0.25);
  });

  it("shows the word on an order and the split in the report", () => {
    const { unmount } = render(<ServiceModeBadge order={{ service_mode: "dine_in" }} />);
    expect(screen.getByText("Dine in")).toBeInTheDocument();
    unmount();
    render(<ServiceModeSplit rows={[{ service_mode: "takeaway", orders: 2, revenue: 10000 }, { service_mode: "dine_in", orders: 0, revenue: 0 }]} />);
    expect(screen.getByText("Pickup")).toBeInTheDocument();
    expect(screen.getByText("Dine in")).toBeInTheDocument();
    expect(screen.getByText("2 orders")).toBeInTheDocument();
  });
});
