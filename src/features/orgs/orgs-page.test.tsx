/** `/orgs` is the platform admin's: anyone else gets the Restricted screen and no request goes out. */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrgsPage } from "./orgs-page";

let platform = false;
const useListOrgs = vi.fn((_params?: unknown) => ({ data: [], isLoading: false }));
let filterValues = { plan: "all", source: "all" };

vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ platform }) }));
vi.mock("@/data/api/generated/api", () => ({ useListOrgs: (p?: unknown) => useListOrgs(p), deleteOrg: vi.fn() }));
vi.mock("@/components/app/restricted", () => ({ Restricted: () => <div>restricted</div> }));
vi.mock("./org-dialog", () => ({ OrgDialog: () => null }));
vi.mock("./provision-wizard", () => ({ ProvisionWizard: () => null }));
vi.mock("@/components/app/data-table", () => ({ DataTable: () => <div>table</div> }));
vi.mock("@/components/app/page", () => ({
  Page: ({ children }: { children: unknown }) => <div>{children as never}</div>,
  PageHeader: () => null,
}));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/components/app/export-button", () => ({ ExportButton: () => null }));
vi.mock("@/components/app/stat-card", () => ({ StatCard: () => null }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => null }));
vi.mock("@/data/scope/use-page-search", () => ({ usePageSearch: () => [{}, vi.fn()] }));
vi.mock("@/data/scope/use-list-filters", () => ({ useListFilters: () => ({ values: filterValues, set: vi.fn(), reset: vi.fn(), isFiltered: () => false }) }));

beforeEach(() => {
  useListOrgs.mockClear();
  filterValues = { plan: "all", source: "all" };
});

describe("OrgsPage", () => {
  it("shows Restricted and fetches nothing for a non-platform user", () => {
    platform = false;
    render(<OrgsPage />);
    expect(screen.getByText("restricted")).toBeTruthy();
    expect(useListOrgs).not.toHaveBeenCalled();
  });

  it("renders the page for a platform admin", () => {
    platform = true;
    render(<OrgsPage />);
    expect(screen.queryByText("restricted")).toBeNull();
    expect(useListOrgs).toHaveBeenCalled();
  });

  it("asks the server for the plan and the source being filtered", () => {
    platform = true;
    filterValues = { plan: "free", source: "self" };
    render(<OrgsPage />);
    expect(useListOrgs).toHaveBeenLastCalledWith({ plan: "free", signup_source: "self" });
  });

  it("asks for everything by default", () => {
    platform = true;
    render(<OrgsPage />);
    expect(useListOrgs).toHaveBeenLastCalledWith({ plan: undefined, signup_source: undefined });
  });
});
