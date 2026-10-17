import { describe, expect, it } from "vitest";

import { Cap, type Capability } from "@/generated/capabilities";
import { financialTabs, legalTabs, openTab } from "./queries";

const holding = (...caps: Capability[]) => (c: Capability) => caps.includes(c);

describe("report tab resolution (page and sidebar prefetch agree)", () => {
  it("opens on the remembered tab when it is visible, else the first visible one", () => {
    expect(openTab("revenue", ["profitability", "revenue"])).toBe("revenue");
    expect(openTab("profitability", ["valuation"])).toBe("valuation");
    expect(openTab("tax", [])).toBeUndefined();
  });

  it("shows Financial tabs by what they read", () => {
    expect(financialTabs(holding(Cap.inventoryRead))).toEqual(["valuation"]);
    expect(financialTabs(holding(Cap.ordersRead, Cap.purchasingOrdersRead))).toEqual([
      "profitability", "revenue", "channel", "supplierSpend", "materialCostTrend",
    ]);
  });

  it("shows Legal tabs by module and the pay/attendance capabilities", () => {
    expect(legalTabs(holding(), ["dawam"])).toEqual([]);
    expect(legalTabs(holding(Cap.hrAttendanceRead), ["dawam"])).toEqual(["attendance_corrections"]);
    expect(legalTabs(holding(), ["pos"])[0]).toBe("tax");
  });
});
