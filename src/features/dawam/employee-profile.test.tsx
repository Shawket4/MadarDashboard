/**
 * The employee profile's Dawam fields: gender and how they're paid reach the
 * server, a cash-paid person sends no account, and signing a phone out asks
 * first (RO-4, RO-10).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Employee } from "@/data/api/generated/models";

const putEmployee = vi.fn(async () => ({}));
const revokeDevice = vi.fn(async () => ({}));
let held = ["hr.staff.edit", "hr.payroll.edit"];
vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ can: (c: string) => held.includes(c), canEverywhere: (c: string) => held.includes(c) }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/data/api/generated/api", () => ({
  useListDepartments: () => ({ data: [], isLoading: false }),
  useListBranches: () => ({ data: [{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }] }),
  putEmployee: (...a: unknown[]) => putEmployee(...(a as [])),
  revokeDevice: (...a: unknown[]) => revokeDevice(...(a as [])),
  useGetAttendanceSettings: () => ({ data: { working_days_per_month: 26, limit_day_hours: 8, period_start_day: 1 }, isLoading: false }),
}));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateEmployees: vi.fn() };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { EmployeeDialog } = await import("@/features/staff/employee-dialog");

const sara = {
  id: "e1", name: "Sara Ahmed", employment_status: "active", pay_method: "bank", pay_account: "EG38 0019",
  gender: "f", base_salary_piastres: 900_000, role: "teller", org_id: "o", created_at: "", updated_at: "",
  kind: "app", phone: "201001234567", app_access: true, branch_ids: ["b1"], device_model: "Galaxy A54", device_since: "2026-09-01T08:00:00Z",
} as unknown as Employee;

const open = (e: Employee) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider><EmployeeDialog employee={e} open onOpenChange={() => {}} /></ConfirmProvider>
    </QueryClientProvider>,
  );

describe("EmployeeDialog · Dawam", () => {
  it("keeps numbers left-to-right in Arabic: emergency phone, national ID, account", async () => {
    // E2E (AR): "+201100000010" showed as "201100000010+" in an RTL input.
    open(sara);
    for (const label of ["Emergency phone", "National ID", "Account (IBAN)"]) {
      expect(await screen.findByLabelText(label)).toHaveAttribute("dir", "ltr");
    }
    expect(screen.getByLabelText("Emergency phone")).toHaveAttribute("type", "tel");
  });

  it("saves gender, pay method and account", async () => {
    const user = userEvent.setup();
    open(sara);
    const iban = await screen.findByLabelText("Account (IBAN)");
    await user.clear(iban);
    await user.type(iban, "EG99 1234");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(putEmployee).toHaveBeenCalledWith("e1", expect.objectContaining({ gender: "f", pay_method: "bank", pay_account: "EG99 1234" })),
    );
  });

  it("sends no account for someone paid in cash", async () => {
    const user = userEvent.setup();
    putEmployee.mockClear();
    open({ ...sara, pay_method: "cash", pay_account: "stale" } as Employee);
    expect(screen.queryByLabelText("Account (IBAN)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(putEmployee).toHaveBeenCalledWith("e1", expect.objectContaining({ pay_method: "cash", pay_account: null })));
  });

  it("signs the phone out only after confirming", async () => {
    const user = userEvent.setup();
    open(sara);
    await user.click(screen.getByRole("button", { name: "Sign the phone out" }));
    expect(revokeDevice).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Sign the phone out" }));
    await waitFor(() => expect(revokeDevice).toHaveBeenCalledWith("e1"));
  });

  it("offers no sign-out without hr.staff.edit, or with no phone signed in", () => {
    held = ["hr.payroll.edit"];
    const { unmount } = open(sara);
    expect(screen.queryByRole("button", { name: "Sign the phone out" })).toBeNull();
    unmount();
    held = ["hr.staff.edit", "hr.payroll.edit"];
    open({ ...sara, device_model: null } as Employee);
    expect(screen.queryByRole("button", { name: "Sign the phone out" })).toBeNull();
  });

  it("edits name, number, app access and branches (PUT)", async () => {
    const user = userEvent.setup();
    putEmployee.mockClear();
    open(sara);
    await user.clear(screen.getByLabelText("WhatsApp number"));
    await user.type(screen.getByLabelText("WhatsApp number"), "0111 222 3333");
    await user.click(screen.getByRole("checkbox", { name: "Maadi" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(putEmployee).toHaveBeenCalledWith("e1", expect.objectContaining({
        name: "Sara Ahmed", phone: "201112223333", app_access: true, branch_ids: ["b1", "b2"],
      })),
    );
  });

  it("flips 'paid through Dawam' only for someone with hr.payroll.edit (owner decision, PAY-3)", async () => {
    const user = userEvent.setup();
    putEmployee.mockClear();
    held = ["hr.staff.edit", "hr.payroll.edit"];
    const { unmount } = open({ ...sara, on_payroll: true } as Employee);
    const box = screen.getByRole("checkbox", { name: "Paid through Dawam" });
    expect(box).toBeChecked();
    await user.click(box);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(putEmployee).toHaveBeenCalledWith("e1", expect.objectContaining({ on_payroll: false })));
    unmount();

    // A branch manager never sees the box, and the field is not sent.
    putEmployee.mockClear();
    held = ["hr.staff.edit"];
    open({ ...sara, on_payroll: true } as Employee);
    expect(screen.queryByRole("checkbox", { name: "Paid through Dawam" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(putEmployee).toHaveBeenCalled());
    expect((putEmployee.mock.calls[0] as unknown[])[1]).not.toHaveProperty("on_payroll");
  });

  it("app access needs a number", async () => {
    const user = userEvent.setup();
    putEmployee.mockClear();
    open(sara);
    await user.clear(screen.getByLabelText("WhatsApp number"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("The staff app needs their WhatsApp number")).toBeInTheDocument();
    expect(putEmployee).not.toHaveBeenCalled();
  });
});

describe("D9: a salary nobody set (owner decision 9)", () => {
  it("the owner reads 'Not set', and saving without typing one keeps it unset", async () => {
    held = ["hr.staff.edit", "hr.payroll.edit"];
    putEmployee.mockClear();
    const user = userEvent.setup();
    open({ ...sara, base_salary_piastres: null, salary_set: false } as unknown as Employee);
    const field = await screen.findByLabelText("Base salary (monthly)");
    expect(field).toHaveValue(null);
    expect(field).toHaveAttribute("placeholder", "Not set");
    expect(screen.getByText(/No salary yet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(putEmployee).toHaveBeenCalled());
    expect((putEmployee.mock.calls[0] as unknown[])[1]).not.toHaveProperty("base_salary_piastres");
  });

  it("the owner sets it from a day rate with the calculator", async () => {
    held = ["hr.staff.edit", "hr.payroll.edit"];
    putEmployee.mockClear();
    const user = userEvent.setup();
    open({ ...sara, base_salary_piastres: null, salary_set: false } as unknown as Employee);
    await user.type(await screen.findByLabelText("Daily rate (EGP)"), "250");
    expect(screen.getByLabelText("Base salary (monthly)")).toHaveValue(6500);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(putEmployee).toHaveBeenCalledWith("e1", expect.objectContaining({ base_salary_piastres: 650_000 })));
  });

  it("someone the salary is hidden from gets no field", () => {
    held = ["hr.staff.edit"];
    open({ ...sara, base_salary_piastres: null, salary_set: true } as unknown as Employee);
    expect(screen.queryByLabelText("Base salary (monthly)")).toBeNull();
  });
});

