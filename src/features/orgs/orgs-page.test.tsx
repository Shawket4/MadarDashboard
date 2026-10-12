/** `/orgs` is the platform admin's: anyone else gets the Restricted screen and no request goes out. */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrgsPage } from "./orgs-page";

let platform = false;
const useListOrgs = vi.fn(() => ({ data: [], isLoading: false }));

vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ platform }) }));
vi.mock("@/data/api/generated/api", () => ({ useListOrgs: () => useListOrgs(), deleteOrg: vi.fn() }));
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

beforeEach(() => useListOrgs.mockClear());

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
});
