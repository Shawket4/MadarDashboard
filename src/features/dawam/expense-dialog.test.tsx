/**
 * The expense-advance form offers exactly the sources the server accepts by
 * hand (`safe` · `bank`, AV-7): a till pay-out is tagged on the POS, never
 * typed here (AV-10). It once offered "cash", which the server refuses — a
 * mocked test can't see that, so this pins the contract — and it says when
 * and where the cash was handed over (AV-7).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/api/generated/api", () => ({
  useListEmployees: () => ({ data: [], isLoading: false }),
  useListBranches: () => ({ data: [{ id: "b1", name: "Zamalek" }], isLoading: false }),
  logExpenseAdvance: vi.fn(),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ExpenseAdvanceDialog } = await import("./money-dialogs");

describe("ExpenseAdvanceDialog", () => {
  it("offers only the server's sources, from the safe by default", () => {
    render(<QueryClientProvider client={new QueryClient()}><ExpenseAdvanceDialog open onOpenChange={() => {}} /></QueryClientProvider>);
    const radios = screen.getAllByRole("radio").map((r) => r.textContent);
    expect(radios).toEqual(["From the safe", "Bank transfer"]);
    expect(screen.getByRole("radio", { name: "From the safe" })).toHaveAttribute("aria-checked", "true");
  });

  it("asks when and where the cash was handed over, today by default (AV-7)", () => {
    render(<QueryClientProvider client={new QueryClient()}><ExpenseAdvanceDialog open onOpenChange={() => {}} /></QueryClientProvider>);
    expect((screen.getByLabelText("Handed over on") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByRole("combobox", { name: "Handed over at" })).toBeInTheDocument();
  });
});
