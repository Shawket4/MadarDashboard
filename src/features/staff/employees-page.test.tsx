/**
 * The Employees page (Phase A): everyone who works here, whatever their kind —
 * a staff-app person, a records-only person, a Madar user who is also an
 * employee — with their number, app access and the phone they're signed in on.
 * Every action follows a capability, never a role name.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
const revokeDevice = vi.fn(async (_id: string) => ({}));
const deleteEmployee = vi.fn(async (_id: string) => ({}));
const createEmployee = vi.fn(async (_b: unknown) => ({}));

const q = (data: unknown) => () => ({ data, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });

const EMPLOYEES = [
  {
    id: "e1", org_id: "o", name: "Sara Ahmed", kind: "app", phone: "201001234567", app_access: true, branch_ids: ["b1", "b2"],
    role: null, user_id: null, device_model: "Galaxy A54", device_since: "2026-09-01T08:00:00Z", employment_status: "active",
    pay_method: "cash", cant_work_days: [], created_at: "", updated_at: "",
  },
  {
    id: "e2", org_id: "o", name: "Hassan Ali", kind: "manual", phone: null, app_access: false, branch_ids: ["b1"],
    role: null, user_id: null, device_model: null, employment_status: "active",
    pay_method: "cash", cant_work_days: [], created_at: "", updated_at: "",
  },
  {
    id: "e3", org_id: "o", name: "Karim Said", kind: "linked", phone: "201009998887", app_access: false, branch_ids: ["b2"],
    role: "teller", user_id: "u9", device_model: null, employment_status: "active",
    pay_method: "cash", cant_work_days: [], created_at: "", updated_at: "",
  },
];

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const me = () =>
    real.authzFrom({
      user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
      capabilities: held as never, ask_manager: [], limits: {},
    });
  return { ...real, useAuthz: me };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => async () => true }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn(), invalidateEmployees: vi.fn(), invalidateDepartments: vi.fn() };
});
vi.mock("@/data/api/generated/api", () => ({
  useListEmployees: q(EMPLOYEES),
  useListDepartments: q([]),
  useListBranches: q([{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }]),
  useLinkableUsers: q([]),
  revokeDevice: (id: string) => revokeDevice(id),
  deleteEmployee: (id: string) => deleteEmployee(id),
  createEmployee: (b: unknown) => createEmployee(b),
  createDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  putEmployee: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { EmployeesPage } = await import("./employees-page");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>{node}</TooltipProvider>
    </QueryClientProvider>,
  );
const rowOf = (name: string) => screen.getAllByText(name)[0].closest("tr") as HTMLElement;

beforeEach(() => {
  held = ["hr.staff.read", "hr.staff.create", "hr.staff.edit", "hr.staff.delete"];
  revokeDevice.mockClear();
  deleteEmployee.mockClear();
  createEmployee.mockClear();
});

describe("EmployeesPage", () => {
  it("shows each person's kind, branches, number, app access, role and phone", () => {
    wrap(<EmployeesPage />);
    const sara = rowOf("Sara Ahmed");
    expect(within(sara).getByText("Staff app")).toBeInTheDocument();
    expect(within(sara).getByText("Zamalek، Maadi")).toBeInTheDocument();
    expect(within(sara).getByText("+201001234567")).toBeInTheDocument();
    expect(within(sara).getByText("Galaxy A54")).toBeInTheDocument();
    expect(within(sara).getByText("Yes")).toBeInTheDocument();
    const hassan = rowOf("Hassan Ali");
    expect(within(hassan).getByText("Records only")).toBeInTheDocument();
    const karim = rowOf("Karim Said");
    expect(within(karim).getByText("Madar user")).toBeInTheDocument();
    expect(within(karim).getByText("Teller")).toBeInTheDocument();
  });

  it("signs a phone out (hr.staff.edit), only where one is signed in", async () => {
    const user = userEvent.setup();
    wrap(<EmployeesPage />);
    expect(within(rowOf("Hassan Ali")).queryByRole("button", { name: "Sign the phone out" })).toBeNull();
    await user.click(within(rowOf("Sara Ahmed")).getByRole("button", { name: "Sign the phone out" }));
    await waitFor(() => expect(revokeDevice).toHaveBeenCalledWith("e1"));
  });

  it("hides revoke without hr.staff.edit", () => {
    held = ["hr.staff.read"];
    wrap(<EmployeesPage />);
    expect(screen.queryByRole("button", { name: "Sign the phone out" })).toBeNull();
    expect(screen.queryByRole("button", { name: "End employment" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Add employee/ })).toBeNull();
  });

  it("removing ends the employment (DELETE), by employee id", async () => {
    const user = userEvent.setup();
    wrap(<EmployeesPage />);
    await user.click(within(rowOf("Hassan Ali")).getByRole("button", { name: "End employment" }));
    await waitFor(() => expect(deleteEmployee).toHaveBeenCalledWith("e2"));
  });

  it("adds a records-only person from the page (hr.staff.create)", async () => {
    const user = userEvent.setup();
    wrap(<EmployeesPage />);
    await user.click(screen.getByRole("button", { name: "Add employee" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: "Records only" }));
    await user.type(within(dialog).getByLabelText("Name"), "Mona");
    await user.click(within(dialog).getByRole("checkbox", { name: "Zamalek" }));
    const add = within(dialog).getByRole("button", { name: "Add employee" });
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    await waitFor(() =>
      expect(createEmployee).toHaveBeenCalledWith(expect.objectContaining({ name: "Mona", app_access: false, branch_ids: ["b1"] })),
    );
  });
});
