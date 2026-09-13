import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Device } from "./api";

await import("@/i18n");
const { DevicesTable } = await import("./devices-page");

const device = (over: Partial<Device>): Device => ({
  id: "d", org_id: "o", branch_id: "b", code: "36B", label: "Counter", kind: "pos", platform: "ios", app_version: "0.7.0",
  first_seen_at: "2026-09-01T00:00:00Z", last_seen_at: "2026-09-13T10:00:00Z", retired_at: null, code_conflict: false, ...over,
});

describe("DevicesTable", () => {
  it("warns only on devices whose code clashes", () => {
    render(<DevicesTable devices={[device({ id: "a", code_conflict: true }), device({ id: "b", code: "12" })]} onEdit={() => {}} />);
    expect(screen.getAllByTestId("device-row")).toHaveLength(2);
    expect(screen.getAllByTestId("code-conflict")).toHaveLength(1);
    expect(screen.getByText(/Another device uses this code|جهاز آخر يستخدم هذا الرمز/)).toBeInTheDocument();
  });
});
