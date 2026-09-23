/**
 * Adding people (DSH-7): one typed in, or a spreadsheet — previewed with
 * each row's problem, created only when asked, and reported row by row (a
 * number already in use comes back 409 and says so).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
// Radix Select asks for pointer capture and scrolls its options; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const createEmployee = vi.fn(async (_b: unknown) => ({}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn() };
});
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: () => ({ data: [{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }] }),
  createEmployee: (b: unknown) => createEmployee(b),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AddEmployeeDialog, ImportPeopleDialog } = await import("./add-employees");

const wrap = (node: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);
const conflict = (msg: string) =>
  new AxiosError("409", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 409, statusText: "Conflict", headers: {}, config: { headers: new AxiosHeaders() }, data: { error: msg },
  });

beforeEach(() => createEmployee.mockReset().mockResolvedValue({}));

describe("Add employee", () => {
  it("sends name, canonical WhatsApp number, branch and salary in piastres", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    wrap(<AddEmployeeDialog onOpenChange={close} />);
    const add = screen.getByRole("button", { name: "Add employee" });
    await user.type(screen.getByLabelText("Name"), "Sara Ahmed");
    await user.type(screen.getByLabelText("WhatsApp number"), "0100 123 4567");
    expect(add).toBeDisabled(); // no branch yet
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Maadi" }));
    await user.type(screen.getByLabelText("Monthly salary (EGP)"), "9000.5");
    await user.click(add);
    await waitFor(() =>
      expect(createEmployee).toHaveBeenCalledWith({
        name: "Sara Ahmed", phone: "201001234567", branch_id: "b2", base_salary_piastres: 900_050, job_title: null, gender: null,
      }),
    );
    expect(close).toHaveBeenCalledWith(false);
  });

  it("won't send a number that isn't one", async () => {
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Name"), "Omar");
    await user.type(screen.getByLabelText("WhatsApp number"), "12");
    expect(screen.getByText(/isn't a phone number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add employee" })).toBeDisabled();
  });
});

describe("Import from a spreadsheet", () => {
  it("previews every row with its problem, creates the good ones, and reports each", async () => {
    const user = userEvent.setup();
    createEmployee.mockImplementation(async (b: unknown) => {
      if ((b as { phone: string }).phone === "201012345678") throw conflict("Someone here already has the number +201012345678.");
      return {};
    });
    wrap(<ImportPeopleDialog onOpenChange={vi.fn()} />);
    const csv = "Name,WhatsApp,Branch,Salary\nSara Ahmed,0100 123 4567,Zamalek,\"9,000\"\nOmar,01012345678,Maadi,\nNo Phone,,Zamalek,\nMona,01112345678,Heliopolis,\n";
    await user.upload(screen.getByLabelText("Spreadsheet"), new File([csv], "people.csv", { type: "text/csv" }));

    expect(await screen.findByText("Sara Ahmed")).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-4")).getByText(/isn't a phone number/)).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-5")).getByText(/No branch called "Heliopolis"/)).toBeInTheDocument();
    expect(createEmployee).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add 2" }));
    await waitFor(() => expect(createEmployee).toHaveBeenCalledTimes(2));
    expect(createEmployee).toHaveBeenCalledWith({ name: "Sara Ahmed", phone: "201001234567", branch_id: "b1", base_salary_piastres: 900_000 });
    expect(await within(screen.getByTestId("import-row-2")).findByText("Added")).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-3")).getByText(/already has the number/)).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-4")).getByText("Skipped")).toBeInTheDocument();

    // Running again retries only the one that failed.
    createEmployee.mockReset().mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: "Add 1" }));
    await waitFor(() => expect(createEmployee).toHaveBeenCalledTimes(1));
    expect(createEmployee).toHaveBeenCalledWith(expect.objectContaining({ name: "Omar" }));
  });
});
