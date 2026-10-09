/**
 * Nobody adds a pay line for themselves (AD-4): the server refuses it (403
 * "You can't add pay lines for yourself."), so the person picker doesn't
 * offer the signed-in user's own employee record (AT-11; E2E, team: Karim
 * could pick himself on the Team page).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/api/generated/api", () => ({
  useCurrent: () => ({ data: undefined, isLoading: false }),
  useListEmployees: () => ({
    data: [
      { id: "e1", name: "Sara Ahmed", user_id: "u2" },
      { id: "e2", name: "Karim Mostafa", user_id: "u1" },
      { id: "e3", name: "Records Only", user_id: null },
    ],
    isLoading: false,
  }),
  useListBranches: () => ({ data: [], isLoading: false }),
  createAdjustment: vi.fn(),
  recordAdvance: vi.fn(),
  reviewAdvance: vi.fn(),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o" }));
vi.mock("@/data/authz/use-authz", () => ({ useAuthz: () => ({ can: () => false, canAny: () => false }) }));

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { AdjustmentDialog } = await import("./money-dialogs");

describe("AdjustmentDialog person picker", () => {
  it("never offers the signed-in person", async () => {
    useAuthStore.setState({ user: { id: "u1" } } as never);
    const user = userEvent.setup();
    render(<QueryClientProvider client={new QueryClient()}><AdjustmentDialog open onOpenChange={() => {}} /></QueryClientProvider>);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Employee" }));
    const names = (await screen.findAllByRole("option")).map((o) => o.textContent);
    expect(names).toEqual(["Sara Ahmed", "Records Only"]);
  });
});
