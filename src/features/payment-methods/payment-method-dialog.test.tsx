import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ createPaymentMethod: vi.fn(), updatePaymentMethod: vi.fn() }));
vi.mock("@/data/api/generated/api", () => api);
vi.mock("./util", async (orig) => ({ ...(await orig<object>()), invalidatePaymentMethods: vi.fn() }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { PaymentMethodDialog } = await import("./payment-method-dialog");

const method = {
  id: "pm1", name: "instapay", label_translations: { en: "InstaPay", ar: "" }, color: "#10B981", icon: "money",
  is_cash: false, is_active: true, visible_in_integrations: true,
} as never;

beforeEach(() => {
  api.createPaymentMethod.mockReset().mockResolvedValue({});
  api.updatePaymentMethod.mockReset().mockResolvedValue({});
});

describe("PaymentMethodDialog partner sharing", () => {
  it("is not offered on Free, and the field is never sent", async () => {
    useAuthStore.setState({ plan: "free" });
    render(<PaymentMethodDialog method={method} open onOpenChange={() => {}} />);
    expect(screen.queryByText("Share with partners")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.updatePaymentMethod).toHaveBeenCalled());
    expect(api.updatePaymentMethod.mock.calls[0][1]).not.toHaveProperty("visible_in_integrations");
  });

  it("is offered and sent on Paid", async () => {
    useAuthStore.setState({ plan: "paid" });
    render(<PaymentMethodDialog method={method} open onOpenChange={() => {}} />);
    expect(screen.getByText("Share with partners")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.updatePaymentMethod).toHaveBeenCalled());
    expect(api.updatePaymentMethod.mock.calls[0][1]).toHaveProperty("visible_in_integrations", true);
  });
});
