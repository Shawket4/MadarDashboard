/**
 * Deleting a member asks first, names what goes and what stays, then forgets.
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
await i18n.changeLanguage("en");
const { DeleteMemberButton } = await import("./delete-member-dialog");

describe("DeleteMemberButton", () => {
  it("confirms with what is scrubbed and kept, then deletes", async () => {
    const onDeleted = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DeleteMemberButton member={{ id: "m-1", name: "Sara" }} onDeleted={onDeleted} />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: /Delete member/ }));
    expect(screen.getByText(/Delete Sara\?/)).toBeInTheDocument();
    expect(screen.getByText(/Removed:.*phone number/)).toBeInTheDocument();
    expect(screen.getByText(/Kept:.*ledger/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    const buttons = screen.getAllByRole("button", { name: /Delete member/ });
    await userEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: "m-1" }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });
});
