/**
 * Leaving the programme asks first and says what it is: the card stops, the
 * customer and their history stay, and joining again restores the balance. It
 * must not read like deleting a person — that is Erase, elsewhere.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("@/data/api/generated/api", () => ({
  useDeleteLoyaltyMember: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const i18n = (await import("@/i18n")).default;
const { LeaveProgrammeButton } = await import("./leave-programme-dialog");

const mount = (onLeft = vi.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LeaveProgrammeButton member={{ id: "m-1", name: "Sara" }} onLeft={onLeft} />
    </QueryClientProvider>,
  );

describe("LeaveProgrammeButton", () => {
  it("says the card stops, the customer stays and rejoining restores the balance — then leaves", async () => {
    await i18n.changeLanguage("en");
    const onLeft = vi.fn();
    mount(onLeft);
    await userEvent.click(screen.getByRole("button", { name: "Remove from loyalty programme" }));
    expect(screen.getByText("Remove Sara from the loyalty programme?")).toBeInTheDocument();
    expect(screen.getByText(/card stops working/)).toBeInTheDocument();
    expect(screen.getByText(/stay a customer/)).toBeInTheDocument();
    expect(screen.getByText(/join again.*balance back/)).toBeInTheDocument();
    // Not a deletion, and not irreversible: neither word belongs here.
    expect(screen.queryByText(/delete|can't be undone/i)).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Remove from programme" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: "m-1" }));
    await waitFor(() => expect(onLeft).toHaveBeenCalled());
  });

  it("says the same in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    await userEvent.click(screen.getByRole("button", { name: "إخراج من برنامج الولاء" }));
    expect(screen.getByText(/يبقى عميلًا/)).toBeInTheDocument();
    expect(screen.getByText(/رصيده/)).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});
