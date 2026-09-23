/**
 * Rules first (DSH-6): the banner shows only while the server says the rules
 * were never saved, and a clock-in refused for that reason reads as words,
 * not as "conflict".
 */
import { render, screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

let settings: unknown;
let branches: unknown = [{ id: "b1", name: "Zamalek", latitude: 30.06, longitude: 31.22, geo_radius_meters: 80 }];
let employees: unknown = [{ is_active: true, employment_status: "active" }];
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/api/generated/api", () => ({
  useGetAttendanceSettings: () => ({ data: settings }),
  useListBranches: () => ({ data: branches }),
  useListEmployees: () => ({ data: employees }),
  useListWorkShifts: () => ({ data: [{ is_active: true }] }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { RulesFirstBanner } = await import("./rules-banner");
const { getErrorMessage } = await import("@/data/api/errors");

describe("rules first", () => {
  it("sends the owner to the rules until they're saved", () => {
    settings = { rules_saved_at: null };
    const { unmount } = render(<RulesFirstBanner />);
    expect(screen.getByText("Save the rules before anyone can clock in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set the rules" })).toHaveAttribute("href", "/staff/rules");
    unmount();

    settings = { rules_saved_at: "2026-09-01T00:00:00Z" };
    const { container } = render(<RulesFirstBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sends them to the set-up checklist when more than the rules is missing (SA-4)", () => {
    settings = { rules_saved_at: null };
    branches = [{ id: "b1", name: "Zamalek", latitude: null, longitude: null, geo_radius_meters: null }];
    employees = [];
    render(<RulesFirstBanner />);
    expect(screen.getByRole("link", { name: "Finish set-up" })).toHaveAttribute("href", "/staff/setup");
  });

  it("says nothing while the answer is loading", () => {
    settings = undefined;
    const { container } = render(<RulesFirstBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reads a punch refused with RULES_NOT_SET in the user's language", () => {
    const err = new AxiosError("409", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 409, statusText: "Conflict", headers: {}, config: { headers: new AxiosHeaders() },
      data: { code: "RULES_NOT_SET", error: "server words" },
    });
    expect(getErrorMessage(err)).toMatch(/hasn't set its attendance rules yet/);
  });
});
