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
let caps: string[] = ["hr.payroll.edit"];
vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ can: (c: string) => caps.includes(c) }) }));
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: () => ({ data: [{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }] }),
  useLinkableUsers: () => ({ data: [{ user_id: "u9", name: "Karim", role: "teller", phone: "201009998887" }] }),
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

beforeEach(() => {
  createEmployee.mockReset().mockResolvedValue({});
  caps = ["hr.payroll.edit"];
});

describe("Add employee", () => {
  it("a staff-app person: name, canonical WhatsApp number, branches and salary in piastres", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    wrap(<AddEmployeeDialog onOpenChange={close} />);
    const add = screen.getByRole("button", { name: "Add employee" });
    await user.type(screen.getByLabelText("Name"), "Sara Ahmed");
    await user.type(screen.getByLabelText("WhatsApp number"), "0100 123 4567");
    await waitFor(() => expect(add).toBeDisabled()); // no branch yet
    await user.click(screen.getByRole("checkbox", { name: "Maadi" }));
    await user.type(screen.getByLabelText("Monthly salary (EGP)"), "9000.5");
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    await waitFor(() =>
      expect(createEmployee).toHaveBeenCalledWith({
        name: "Sara Ahmed", phone: "201001234567", app_access: true, branch_ids: ["b2"],
        base_salary_piastres: 900_050, job_title: null, hire_date: null, gender: null,
      }),
    );
    expect(close).toHaveBeenCalledWith(false);
  });

  it("won't send a number that isn't one", async () => {
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Name"), "Omar");
    await user.type(screen.getByLabelText("WhatsApp number"), "12");
    expect(await screen.findByText(/isn't a phone number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add employee" })).toBeDisabled();
  });

  it("a records-only person needs no number and gets no app access", async () => {
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Records only" }));
    await user.type(screen.getByLabelText("Name"), "Hassan");
    await user.click(screen.getByRole("checkbox", { name: "Zamalek" }));
    await user.click(screen.getByRole("checkbox", { name: "Maadi" }));
    await user.type(screen.getByLabelText("Hire date"), "2026-09-01");
    const add = screen.getByRole("button", { name: "Add employee" });
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    await waitFor(() =>
      expect(createEmployee).toHaveBeenCalledWith({
        name: "Hassan", phone: null, app_access: false, branch_ids: ["b1", "b2"],
        job_title: null, hire_date: "2026-09-01", gender: null,
      }),
    );
  });

  it("a staff-app person without a number is refused", async () => {
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Name"), "Omar");
    await user.click(screen.getByRole("checkbox", { name: "Zamalek" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Add employee" })).toBeDisabled());
  });

  it("no salary field without hr.payroll.edit, and none sent", async () => {
    caps = [];
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog onOpenChange={vi.fn()} />);
    expect(screen.queryByLabelText("Monthly salary (EGP)")).toBeNull();
    await user.type(screen.getByLabelText("Name"), "Sara");
    await user.type(screen.getByLabelText("WhatsApp number"), "01001234567");
    await user.click(screen.getByRole("checkbox", { name: "Zamalek" }));
    await user.click(screen.getByRole("button", { name: "Add employee" }));
    await waitFor(() => expect(createEmployee).toHaveBeenCalled());
    expect(createEmployee.mock.calls[0][0]).not.toHaveProperty("base_salary_piastres");
  });

  it("makes an existing user an employee (linked): sends user_id, not a name", async () => {
    const user = userEvent.setup();
    wrap(<AddEmployeeDialog userId="u9" onOpenChange={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Make employee" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).toBeNull();
    // Their account's number is the default.
    await waitFor(() => expect(screen.getByLabelText("WhatsApp number")).toHaveValue("201009998887"));
    await user.click(screen.getByRole("checkbox", { name: "May sign in to the staff app" }));
    await user.click(screen.getByRole("checkbox", { name: "Maadi" }));
    const make = screen.getByRole("button", { name: "Make employee" });
    await waitFor(() => expect(make).toBeEnabled());
    await user.click(make);
    await waitFor(() =>
      expect(createEmployee).toHaveBeenCalledWith({
        user_id: "u9", phone: "201009998887", app_access: true, branch_ids: ["b2"],
        job_title: null, hire_date: null, gender: null,
      }),
    );
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
    expect(createEmployee).toHaveBeenCalledWith({ name: "Sara Ahmed", phone: "201001234567", app_access: true, branch_ids: ["b1"], base_salary_piastres: 900_000 });
    expect(await within(screen.getByTestId("import-row-2")).findByText("Added")).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-3")).getByText(/already has the number/)).toBeInTheDocument();
    expect(within(screen.getByTestId("import-row-4")).getByText("Skipped")).toBeInTheDocument();

    // Running again retries only the one that failed.
    createEmployee.mockReset().mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: "Add 1" }));
    await waitFor(() => expect(createEmployee).toHaveBeenCalledTimes(1));
    expect(createEmployee).toHaveBeenCalledWith(expect.objectContaining({ name: "Omar" }));
  });

  it("without hr.payroll.edit: says the salaries won't be saved, shows none and sends none (DSH-7)", async () => {
    caps = [];
    const user = userEvent.setup();
    wrap(<ImportPeopleDialog onOpenChange={vi.fn()} />);
    const csv = "Name,WhatsApp,Branch,Salary\nSara Ahmed,0100 123 4567,Zamalek,9000\n";
    await user.upload(screen.getByLabelText("Spreadsheet"), new File([csv], "people.csv", { type: "text/csv" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/salaries in this sheet won't be saved/);
    expect(within(screen.getByTestId("import-row-2")).queryByText(/9,000/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add 1" }));
    await waitFor(() => expect(createEmployee).toHaveBeenCalledTimes(1));
    expect(createEmployee.mock.calls[0][0]).not.toHaveProperty("base_salary_piastres");
  });

  it("with it, no notice", async () => {
    const user = userEvent.setup();
    wrap(<ImportPeopleDialog onOpenChange={vi.fn()} />);
    const csv = "Name,WhatsApp,Branch,Salary\nSara Ahmed,0100 123 4567,Zamalek,9000\n";
    await user.upload(screen.getByLabelText("Spreadsheet"), new File([csv], "people.csv", { type: "text/csv" }));
    await screen.findByText("Sara Ahmed");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
