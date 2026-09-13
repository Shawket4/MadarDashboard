/**
 * The adjustment dialog refuses an unexplained or overdrawing change before it
 * reaches the server, and sends a signed, reasoned body when it is right.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AxiosError, AxiosHeaders } from "axios";
import { toast } from "sonner";

import type { MemberView } from "@/data/api/generated/models";

const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock("@/data/api/generated/api", () => ({
  useLoyaltyAdjust: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AdjustDialog } = await import("./adjust-dialog");

const member = { id: "m-1", name: "Sara", balance: 4, mode: "points" } as MemberView;

function wrap(node: ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("AdjustDialog", () => {
  const open = () =>
    wrap(
      <AdjustDialog
        member={member}
        branches={[{ id: "b-1", name: "Maadi" }]}
        defaultBranchId="b-1"
        open
        onOpenChange={() => {}}
      />,
    );

  it("requires a reason", async () => {
    open();
    await userEvent.type(screen.getByLabelText(/Amount/), "2");
    await userEvent.click(screen.getByRole("button", { name: /Save adjustment/ }));
    expect(await screen.findByText(/Say why/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("refuses a deduction larger than the balance", async () => {
    open();
    await userEvent.click(screen.getByRole("radio", { name: /Deduct/ }));
    await userEvent.type(screen.getByLabelText(/Amount/), "5");
    await userEvent.type(screen.getByLabelText(/Reason/), "Duplicate earn");
    await userEvent.click(screen.getByRole("button", { name: /Save adjustment/ }));
    expect(await screen.findByText(/only have 4 points/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("sends a signed body with the reason as the note", async () => {
    open();
    await userEvent.click(screen.getByRole("radio", { name: /Deduct/ }));
    await userEvent.type(screen.getByLabelText(/Amount/), "3");
    await userEvent.type(screen.getByLabelText(/Reason/), "Duplicate earn");
    await userEvent.click(screen.getByRole("button", { name: /Save adjustment/ }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        data: { branch_id: "b-1", customer_id: "m-1", points: -3, note: "Duplicate earn" },
      }),
    );
  });

  it("puts the server's 'note required' refusal on the reason field", async () => {
    mutateAsync.mockRejectedValueOnce(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        data: { error: "Say why the points are being adjusted (note)" },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    );
    open();
    await userEvent.type(screen.getByLabelText(/Amount/), "2");
    await userEvent.type(screen.getByLabelText(/Reason/), "abc");
    await userEvent.click(screen.getByRole("button", { name: /Save adjustment/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/reason is required/);
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/reason is required/));
  });
});
