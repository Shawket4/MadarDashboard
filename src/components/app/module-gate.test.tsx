/** Route gating by module (PS-2, PS-3): a switched-off module's page is not reachable by URL. */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
/** Where the router is heading, when it differs from the page still on screen (a redirect loading). */
let heading: string | null = null;
let orgId: string | null = "org1";
let answer: { modules: string[] } | undefined;
let failure: Error | null = null;
const refetch = vi.fn();
let authzFailure: Error | null = null;
const authzRefetch = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: heading ?? pathname }, resolvedLocation: { pathname } }),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => orgId }));
vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  useGetOrgModules: (id: string) => ({
    data: answer ? { org_id: id, modules: answer.modules } : undefined,
    error: failure,
    refetch,
  }),
  useGetMyAuthz: () => ({ data: undefined, error: authzFailure, refetch: authzRefetch }),
}));
await import("@/i18n");
const { ModuleGate } = await import("./module-gate");
const { useAuthStore } = await import("@/data/stores/auth.store");

const page = () => render(<ModuleGate><p>the page</p></ModuleGate>);

beforeEach(() => {
  pathname = "/";
  heading = null;
  orgId = "org1";
  answer = undefined;
  failure = null;
  authzFailure = null;
  useAuthStore.setState({ plan: null });
});

describe("ModuleGate", () => {
  it("a manager in a Dawam-only org cannot open a POS page by URL", () => {
    answer = { modules: ["dawam"] };
    for (const p of ["/orders", "/tills", "/menu/items", "/reports/operations"]) {
      pathname = p;
      const { unmount } = page();
      expect(screen.queryByText("the page")).toBeNull();
      expect(screen.getByText(/switched off|غير مفعّل|متوقف/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("with Dawam off, staff pages are unreachable", () => {
    answer = { modules: ["pos"] };
    for (const p of ["/staff/employees", "/staff/attendance", "/staff/rules", "/reports/staff"]) {
      pathname = p;
      const { unmount } = page();
      expect(screen.queryByText("the page")).toBeNull();
      unmount();
    }
  });

  it("shows nothing module-tagged until the server answers — never all modules on a guess", () => {
    pathname = "/orders";
    page();
    expect(screen.queryByText("the page")).toBeNull();
  });

  it("when the modules can't be read it says so, with a retry, and still shows no module page", async () => {
    failure = new Error("Network Error");
    pathname = "/orders";
    page();
    expect(screen.queryByText("the page")).toBeNull();
    expect(screen.getByText(/Couldn't check what this business has switched on/)).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(refetch).toHaveBeenCalled();
  });

  it("shared pages and switched-on modules render", () => {
    answer = { modules: ["dawam"] };
    for (const p of ["/branches", "/settings", "/staff/team", "/reports/legal"]) {
      pathname = p;
      const { unmount } = page();
      expect(screen.getByText("the page")).toBeInTheDocument();
      unmount();
    }
  });

  it("a platform admin with no org pinned sees everything", () => {
    orgId = null;
    pathname = "/staff/employees";
    page();
    expect(screen.getByText("the page")).toBeInTheDocument();
  });

  it("when what this person may do can't be read, every page says so, with a retry (SH-10)", () => {
    authzFailure = new Error("Network Error");
    answer = { modules: ["pos", "dawam"] };
    pathname = "/branches";
    page();
    expect(screen.queryByText("the page")).toBeNull();
    expect(screen.getByText(/Couldn't load what you're allowed to do here/)).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(authzRefetch).toHaveBeenCalled();
  });

  it("a Free org gets the upgrade page, with a WhatsApp link, instead of a paid feature", () => {
    answer = { modules: ["pos", "dawam"] };
    useAuthStore.setState({ plan: "free" });
    for (const p of ["/inventory/today", "/settings/brand", "/bookings"]) {
      pathname = p;
      const { unmount } = page();
      expect(screen.queryByText("the page")).toBeNull();
      const link = screen.getByRole("link", { name: /WhatsApp|واتساب/ });
      expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
      unmount();
    }
  });

  it("a Free org still opens what Free includes, and a paid or unknown plan opens everything", () => {
    answer = { modules: ["pos", "dawam"] };
    useAuthStore.setState({ plan: "free" });
    for (const p of ["/orders", "/floor"]) {
      pathname = p;
      const first = page();
      expect(screen.getByText("the page")).toBeInTheDocument();
      first.unmount();
    }
    for (const plan of ["paid", null]) {
      useAuthStore.setState({ plan });
      pathname = "/floor";
      const { unmount } = page();
      expect(screen.getByText("the page")).toBeInTheDocument();
      unmount();
    }
  });

  it("judges the page on screen, not the one being navigated to (a redirect must not let a paid page mount)", () => {
    answer = { modules: ["pos"] };
    useAuthStore.setState({ plan: "free" });
    pathname = "/bookings";
    heading = "/onboarding";
    page();
    expect(screen.queryByText("the page")).toBeNull();
  });
});
