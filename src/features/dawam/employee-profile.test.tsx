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
vi.mock("@/data/api/generated/api", () => ({
  useListDepartments: () => ({ data: [], isLoading: false }),
  putEmployee: (...a: unknown[]) => putEmployee(...(a as [])),
  revokeDevice: (...a: unknown[]) => revokeDevice(...(a as [])),
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
  user_id: "e1", name: "Sara Ahmed", employment_status: "active", pay_method: "bank", pay_account: "EG38 0019",
  gender: "f", base_salary_piastres: 900_000, is_active: true, role: "teller", org_id: "o", created_at: "", updated_at: "",
} as unknown as Employee;

const open = (e: Employee) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider><EmployeeDialog employee={e} open onOpenChange={() => {}} /></ConfirmProvider>
    </QueryClientProvider>,
  );

describe("EmployeeDialog · Dawam", () => {
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
});
