import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ClientSeen } from "./api";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
await import("@/i18n");
const { ClientVersionsTable, validateDevicesSearch } = await import("./devices-page");

const client = (over: Partial<ClientSeen>): ClientSeen => ({
  device_id: "d1",
  device_code: "36B",
  client: "madar-pos/0.6.2 (ios)",
  app_version: "0.6.2",
  branch_id: "b1",
  branch_name: "Zamalek",
  first_seen_at: "2026-09-01T08:00:00Z",
  last_seen_at: "2026-09-13T10:00:00Z",
  last_legacy_at: "2026-09-13T09:00:00Z",
  last_legacy_kind: "legacy_shifts_route",
  last_legacy_path: "/shifts/branches/b1/open",
  legacy_kinds: ["legacy_shifts_route", "replay_shift_id_field"],
  ...over,
});

describe("ClientVersionsTable", () => {
  it("shows the legacy hit for legacy clients and 'up to date' for the rest", () => {
    render(
      <ClientVersionsTable
        days={14}
        legacyOnly={false}
        rows={[client({}), client({ device_id: "d2", device_code: null, client: "curl/8", app_version: null, last_legacy_at: null, last_legacy_kind: null, last_legacy_path: null, legacy_kinds: [] })]}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/legacy_shifts_route/)).toBeInTheDocument();
    expect(within(rows[0]).getByText("0.6.2")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Unregistered client|عميل غير مسجّل/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Up to date|محدّث/)).toBeInTheDocument();
  });

  it("says no legacy clients remain when the legacy-only list is empty", () => {
    render(<ClientVersionsTable days={30} legacyOnly rows={[]} />);
    expect(screen.getByText(/No legacy clients|لا توجد تطبيقات قديمة/)).toBeInTheDocument();
  });

  it("reads the view from the URL", () => {
    expect(validateDevicesSearch({ view: "clients", days: "30", all: "true" })).toEqual({ view: "clients", days: 30, all: true });
    expect(validateDevicesSearch({ view: "x", days: "5" })).toEqual({ view: undefined, days: undefined, all: undefined });
  });
});
