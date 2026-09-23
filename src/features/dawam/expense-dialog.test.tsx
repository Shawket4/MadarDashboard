/**
 * The expense-advance form offers exactly the sources the server accepts
 * (`safe` · `bank` · `till`, AV-7/AV-8). It once offered "cash", which the
 * server refuses — a mocked test can't see that, so this pins the contract.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/api/generated/api", () => ({
  useListEmployees: () => ({ data: [], isLoading: false }),
  logExpenseAdvance: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ExpenseAdvanceDialog } = await import("./money-dialogs");

describe("ExpenseAdvanceDialog", () => {
  it("offers only the server's sources, from the safe by default", () => {
    render(<QueryClientProvider client={new QueryClient()}><ExpenseAdvanceDialog open onOpenChange={() => {}} /></QueryClientProvider>);
    const radios = screen.getAllByRole("radio").map((r) => r.textContent);
    expect(radios).toEqual(["From the safe", "Bank transfer", "Till pay-out"]);
    expect(screen.getByRole("radio", { name: "From the safe" })).toHaveAttribute("aria-checked", "true");
  });
});
