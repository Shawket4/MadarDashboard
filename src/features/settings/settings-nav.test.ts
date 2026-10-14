/**
 * The Settings rail follows the org's modules (PS-3, DSH-2): a Dawam-only
 * business never sees the till's panes (delivery, bookings, loyalty, QR,
 * payment methods, kitchen, staff drinks), and typing their URL is refused
 * by the same module table the sidebar uses.
 */
import { describe, expect, it } from "vitest";

import { featureOfPath, moduleOfPath } from "@/config/nav";
import { authzFrom } from "@/data/authz/use-authz";

import { SETTINGS_NAV, visibleSettings } from "./settings-nav";

const owner = authzFrom({
  user_id: "u",
  epoch: 0,
  spec_version: 0,
  owner: true,
  platform: false,
  role_kinds: ["org_admin"],
  capabilities: [
    "delivery.settings.read",
    "bookings.edit",
    "loyalty.use",
    "payment_methods.edit",
    "org.settings.read",
    "kitchen.stations.edit",
    "integrations.read",
  ] as never,
  ask_manager: [],
  limits: {},
});

const paths = (modules: string[]) => visibleSettings(owner, modules).flatMap((g) => g.items.map((i) => i.to));

describe("visibleSettings", () => {
  it("a Dawam-only org keeps only what isn't the till's", () => {
    expect(paths(["dawam"])).toEqual(["/settings"]);
  });

  it("a POS org sees its panes", () => {
    const pos = paths(["pos"]);
    for (const p of ["/settings/delivery", "/settings/payment-methods", "/settings/kitchen-stations", "/settings/brand"]) {
      expect(pos).toContain(p);
    }
  });

  it("nothing module-tagged shows until the modules are known", () => {
    expect(paths([])).toEqual(["/settings"]);
  });

  it("every POS pane is refused by URL too (one module table)", () => {
    for (const item of SETTINGS_NAV.flatMap((g) => g.items)) {
      expect(moduleOfPath(item.to)).toBe(item.module);
    }
  });

  it("every pane is gated by the same plan feature in the rail and by URL", () => {
    for (const item of SETTINGS_NAV.flatMap((g) => g.items)) {
      expect(featureOfPath(item.to), item.to).toBe(item.feature);
    }
  });
});

describe("visibleSettings on the Free plan", () => {
  const free = (modules: string[]) => visibleSettings(owner, modules, "free").flatMap((g) => g.items.map((i) => i.to));

  it("drops brand, links, delivery, bookings, loyalty, QR, kitchen and integrations", () => {
    const shown = free(["pos"]);
    for (const p of [
      "/settings/brand", "/settings/links", "/settings/delivery", "/settings/bookings", "/settings/loyalty",
      "/settings/qr", "/settings/kitchen-stations", "/settings/kitchen-routing", "/settings/integrations",
    ]) {
      expect(shown, p).not.toContain(p);
    }
  });

  it("keeps what a till needs, and shows the Plan pane", () => {
    const shown = free(["pos"]);
    expect(shown).toContain("/settings/payment-methods");
    expect(shown).toContain("/settings/plan");
  });

  it("a paid org (or an unknown plan) sees every pane and no Plan pane", () => {
    for (const plan of ["paid", null, undefined]) {
      const shown = visibleSettings(owner, ["pos"], plan).flatMap((g) => g.items.map((i) => i.to));
      expect(shown, String(plan)).toContain("/settings/brand");
      expect(shown, String(plan)).not.toContain("/settings/plan");
    }
  });
});
