/**
 * The menu editor says what a price means: tax inside it, or tax on top.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useGetOrg = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: (id: string, opts?: unknown) => useGetOrg(id, opts),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));

const i18n = (await import("@/i18n")).default;
const { PriceTaxHint } = await import("./price-tax-hint");

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("PriceTaxHint", () => {
  it("says prices include tax in an inclusive shop", () => {
    useGetOrg.mockReturnValue({ data: { tax_rate: 0.14, tax_inclusive: true } });
    render(<PriceTaxHint />);
    expect(screen.getByTestId("price-tax-hint").textContent).toContain("Prices include tax (14%)");
  });

  it("says tax is added at checkout in an exclusive shop, in Arabic too", async () => {
    useGetOrg.mockReturnValue({ data: { tax_rate: 0.14, tax_inclusive: false } });
    const { unmount } = render(<PriceTaxHint />);
    expect(screen.getByTestId("price-tax-hint").textContent).toContain("Tax (14%) is added at checkout");
    unmount();
    await i18n.changeLanguage("ar");
    render(<PriceTaxHint />);
    expect(screen.getByTestId("price-tax-hint").textContent).toContain("تُضاف الضريبة (14%) عند الدفع");
  });

  it("says nothing where the shop charges no tax", () => {
    useGetOrg.mockReturnValue({ data: { tax_rate: 0, tax_inclusive: false } });
    render(<PriceTaxHint />);
    expect(screen.queryByTestId("price-tax-hint")).toBeNull();
  });
});
