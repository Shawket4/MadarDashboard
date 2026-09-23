/** Route gating by module (PS-2, PS-3): a switched-off module's page is not reachable by URL. */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
let orgId: string | null = "org1";
let answer: { modules: string[] } | undefined;
let failure: Error | null = null;
const refetch = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ pathname }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => orgId }));
vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  useGetOrgModules: (id: string) => ({
    data: answer ? { org_id: id, modules: answer.modules } : undefined,
    error: failure,
    refetch,
  }),
}));
await import("@/i18n");
const { ModuleGate } = await import("./module-gate");

const page = () => render(<ModuleGate><p>the page</p></ModuleGate>);

beforeEach(() => {
  pathname = "/";
  orgId = "org1";
  answer = undefined;
  failure = null;
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
});
