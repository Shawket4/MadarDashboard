/**
 * Adding a customer: a phone another customer has comes back as a 409 and
 * lands on the phone field, in the reader's language.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

const conflict = () =>
  new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code: "CUSTOMER_PHONE_EXISTS", error: "phone exists" },
  });
const createAsync = vi.fn();
const toastError = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  useCreateCustomer: () => ({ mutateAsync: createAsync, isPending: false }),
  useUpdateCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: toastError } }));

const i18n = (await import("@/i18n")).default;
const { CustomerDialog } = await import("./customer-dialog");
const { isPhoneTaken } = await import("./util");

const renderDialog = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CustomerDialog open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );

describe("CustomerDialog", () => {
  it("requires a name", async () => {
    await i18n.changeLanguage("en");
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Add customer/ }));
    expect(await screen.findByText(/Enter the customer's name/)).toBeInTheDocument();
    expect(createAsync).not.toHaveBeenCalled();
  });

  it.each([
    ["en", /Another customer already has this phone number/],
    ["ar", /رقم الهاتف هذا مسجّل لعميل آخر/],
  ])("maps CUSTOMER_PHONE_EXISTS onto the phone field (%s)", async (lang, message) => {
    await i18n.changeLanguage(lang);
    createAsync.mockReset().mockRejectedValue(conflict());
    toastError.mockReset();
    renderDialog();
    await userEvent.type(screen.getByLabelText(/Name|الاسم/), "Sara");
    await userEvent.type(screen.getByLabelText(/Phone|الهاتف/), "01000000001");
    await userEvent.click(screen.getByRole("button", { name: /Add customer|إضافة عميل/ }));
    await waitFor(() =>
      expect(createAsync).toHaveBeenCalledWith({ data: { name: "Sara", phone: "01000000001", notes: null } }),
    );
    const alert = await screen.findByText(message);
    expect(alert).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText(/Phone|الهاتف/)).toHaveAttribute("aria-invalid", "true");
    expect(toastError).not.toHaveBeenCalled();
    await i18n.changeLanguage("en");
  });

  it("only treats the phone code as a phone clash", () => {
    expect(isPhoneTaken(conflict())).toBe(true);
    expect(isPhoneTaken(new Error("x"))).toBe(false);
  });
});
