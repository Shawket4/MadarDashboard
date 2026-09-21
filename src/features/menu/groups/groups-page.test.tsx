import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Cap } from "@/generated/capabilities";

let held: string[] = [];

const GROUPS = [
  {
    id: "g-1",
    org_id: "org-1",
    name: "Milk",
    name_translations: { ar: "الحليب" },
    selection_type: "single",
    min_selections: 1,
    max_selections: 1,
    is_required: true,
    sort: 0,
    is_active: true,
    legacy_addon_type: "milk_type",
    effect: "swaps",
    options: [],
  },
];

vi.mock("@/data/api/generated/api", () => ({
  useListGroups: () => ({ data: GROUPS, isLoading: false, refetch: vi.fn() }),
  patchGroup: vi.fn(),
  deleteGroup: vi.fn(),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () =>
    real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} } as never);
  return { ...real, useAuthz: authz, useCan: (cap: string) => authz().can(cap as never) };
});
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn(), useSearch: () => ({}) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn() }));
vi.mock("./use-group-usage", () => ({ useGroupUsage: () => ({ byGroup: new Map(), countOf: () => 0, isLoading: false }) }));
vi.mock("./group-editor-dialog", () => ({ GroupEditorDialog: () => null }));
vi.mock("./group-usage-dialog", () => ({ GroupUsageDialog: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { GroupsPage } = await import("./groups-page");

describe("GroupsPage permissions", () => {
  beforeEach(() => {
    held = [];
  });

  it("read-only users see the groups but no edit controls", () => {
    held = [Cap.menuItemsRead];
    render(<GroupsPage />);
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.queryByText("New group")).toBeNull();
    expect(screen.queryByLabelText("Delete")).toBeNull();
    expect(screen.queryByLabelText("Move up")).toBeNull();
    expect(screen.queryByLabelText(/to reorder/)).toBeNull();
  });

  it("editors get create, reorder and delete", () => {
    held = [Cap.menuItemsRead, Cap.menuItemsEdit];
    render(<GroupsPage />);
    expect(screen.getByText("New group")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete")).toBeInTheDocument();
    expect(screen.getByLabelText("Move up")).toBeInTheDocument();
    expect(screen.getByLabelText("Drag Milk to reorder")).toBeInTheDocument();
  });
});
