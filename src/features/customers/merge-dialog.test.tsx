/**
 * A loyalty card decides which way a merge goes: the member stays. The dialog
 * turns the merge round when it can see that, offers the same when the server
 * refuses, and says what happens to the points when both hold a card.
 */
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Customer } from "@/data/api/generated/models";

const person = (id: string, name: string, over: Partial<Customer> = {}): Customer => ({
  id,
  name,
  phone: null,
  orders_count: 0,
  total_spent: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

let options: Customer[] = [];
const mutateAsync = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListCustomers: () => ({ data: options, isLoading: false }),
  useMergeCustomer: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The picker is cmdk in a popover; what matters here is what picking leads to.
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandInput: () => null,
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: () => null,
  CommandGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandItem: ({ children, onSelect }: { children: ReactNode; onSelect: () => void }) => (
    <button type="button" data-testid="option" onClick={onSelect}>
      {children}
    </button>
  ),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { toast } = await import("sonner");
const { MergeDialog } = await import("./merge-dialog");

const refusal = (code: string) =>
  new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 409,
    data: { code, error: "refused" },
  } as AxiosResponse);

function mount(duplicate: Customer) {
  const onMerged = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MergeDialog duplicate={duplicate} open onOpenChange={() => {}} onMerged={onMerged} />
    </QueryClientProvider>,
  );
  return { onMerged };
}

const pick = async () => userEvent.click(screen.getByTestId("option"));

beforeEach(() => {
  mutateAsync.mockReset();
  vi.mocked(toast.error).mockClear();
});

describe("MergeDialog", () => {
  it("neither is a member: the opened customer is merged into the one picked", async () => {
    options = [person("c-2", "Sara Ali")];
    mutateAsync.mockResolvedValue({ customer: options[0] });
    const { onMerged } = mount(person("c-1", "Sara A."));
    await pick();
    expect(screen.queryByTestId("merge-reversed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("merge-both-members")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Merge" }));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "c-1", data: { into: "c-2" } });
    await waitFor(() => expect(onMerged).toHaveBeenCalled());
  });

  it("only the opened customer is a member: the merge is turned round, with the reason, before anything is sent", async () => {
    options = [person("c-2", "Sara Ali")];
    mutateAsync.mockResolvedValue({ customer: person("c-1", "Sara A.") });
    mount(person("c-1", "Sara A.", { is_member: true }));
    await pick();
    expect(screen.getByTestId("merge-reversed")).toHaveTextContent(/Sara A\. is a loyalty member: their card and points live on that record/);
    await userEvent.click(screen.getByRole("button", { name: "Merge into Sara A." }));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({ id: "c-2", data: { into: "c-1" } });
  });

  it("the server refuses with CUSTOMER_MERGE_MEMBER_SURVIVES: no error toast — an offer to merge the other way, which then does", async () => {
    // The picked row looked like a non-member merge; the server knows better.
    options = [person("c-2", "Sara Ali")];
    mutateAsync.mockRejectedValueOnce(refusal("CUSTOMER_MERGE_MEMBER_SURVIVES")).mockResolvedValueOnce({ customer: person("c-1", "Sara A.") });
    const { onMerged } = mount(person("c-1", "Sara A."));
    await pick();
    await userEvent.click(screen.getByRole("button", { name: "Merge" }));
    expect(mutateAsync).toHaveBeenLastCalledWith({ id: "c-1", data: { into: "c-2" } });

    expect(await screen.findByTestId("merge-reversed")).toHaveTextContent(/so it is the one that stays\. Sara Ali will be merged into Sara A\./);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onMerged).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Merge into Sara A." }));
    expect(mutateAsync).toHaveBeenLastCalledWith({ id: "c-2", data: { into: "c-1" } });
    await waitFor(() => expect(onMerged).toHaveBeenCalled());
  });

  it("any other refusal is an error, not an offer", async () => {
    options = [person("c-2", "Sara Ali")];
    mutateAsync.mockRejectedValueOnce(refusal("SOMETHING_ELSE"));
    mount(person("c-1", "Sara A."));
    await pick();
    await userEvent.click(screen.getByRole("button", { name: "Merge" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByTestId("merge-reversed")).not.toBeInTheDocument();
  });

  it("both are members: says, before confirming, that points combine and the other card stops after 90 days", async () => {
    options = [person("c-2", "Sara Ali", { is_member: true })];
    mutateAsync.mockResolvedValue({ customer: options[0] });
    mount(person("c-1", "Sara A.", { is_member: true }));
    await pick();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId("merge-both-members")).toHaveTextContent(
      "Both are loyalty members. Sara A.'s points are added to Sara Ali's, and Sara A.'s card stops working after 90 days.",
    );
    expect(screen.queryByTestId("merge-reversed")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Merge" }));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "c-1", data: { into: "c-2" } });
  });
});
