/**
 * The counter's flow: find by phone, stamp N items (asking first when N > 1),
 * and the refusals it shows in place.
 */
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

const lookupCall = vi.fn();
const stampCall = vi.fn();
const redeemCall = vi.fn();
const giftCall = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  useLoyaltyLookup: () => useMutation({ mutationFn: (v: { data: unknown }) => lookupCall(v.data) }),
  useLoyaltyCounterStamp: () => useMutation({ mutationFn: (v: { data: unknown }) => stampCall(v.data) }),
  useLoyaltyCounterRedeem: () => useMutation({ mutationFn: (v: { data: unknown }) => redeemCall(v.data) }),
  useLoyaltyCounterBirthdayGift: () => useMutation({ mutationFn: (v: { data: unknown }) => giftCall(v.data) }),
  usePublicOrgBrand: () => ({ data: undefined }),
}));

const { CounterScreen } = await import("./counter-screen");

const member = (balance: number) => ({
  id: "m1", org_id: "o", name: "Mariam", phone: "201001234567", locale: "en", mode: "visits",
  enrolled_at: "2026-01-01T00:00:00Z", balance, visits_balance: balance, points_balance: 0, lifetime_points: 0,
  lifetime_visits: balance, next_reward_cost: 8, can_redeem: balance >= 8, rewards_ready: Math.floor(balance / 8),
  progress_to_next: balance % 8, points_to_next_reward: 8 - (balance % 8),
});

const setup = { orgId: "o", branchId: "b", branchName: "Zamalek" };
const renderCounter = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <CounterScreen setup={setup} onExpired={() => {}} />
    </QueryClientProvider>,
  );

async function findMariam() {
  fireEvent.change(screen.getByLabelText("Or type the phone number"), { target: { value: "01001234567" } });
  fireEvent.click(screen.getByRole("button", { name: "Find" }));
  await screen.findByRole("heading", { name: "Mariam" });
}

describe("CounterScreen", () => {
  it("asks before stamping more than one item, then sends the count with one key", async () => {
    lookupCall.mockResolvedValueOnce({ member: member(5), recent: [], rewards: [], any_item: true, any_item_cost: 8 });
    stampCall.mockResolvedValueOnce({ already: false, stamps: 3, member: member(8) });
    renderCounter();
    await findMariam();
    expect(lookupCall).toHaveBeenCalledWith({ branch_id: "b", phone: "201001234567" });

    fireEvent.click(screen.getByRole("button", { name: "One more" }));
    fireEvent.click(screen.getByRole("button", { name: "One more" }));
    fireEvent.click(screen.getByRole("button", { name: "Stamp 3 items" }));
    expect((await screen.findByRole("alertdialog")).querySelector("bdi")?.textContent).toBe("Mariam");
    expect(stampCall).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, stamp 3" }));

    expect(await screen.findByText("3 stamps added")).toBeTruthy();
    expect(stampCall).toHaveBeenCalledWith(expect.objectContaining({ branch_id: "b", customer_id: "m1", items: 3 }));
    // The card is now full: it offers to complete it, and the stepper is back to one.
    expect(screen.getByRole("button", { name: "Complete card" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stamp 1 item" })).toBeTruthy();
  });

  it("stamps a single item without asking", async () => {
    lookupCall.mockResolvedValueOnce({ member: member(1), recent: [], rewards: [], any_item: true, any_item_cost: 8 });
    stampCall.mockResolvedValueOnce({ already: false, stamps: 1, member: member(2) });
    renderCounter();
    await findMariam();
    fireEvent.click(screen.getByRole("button", { name: "Stamp 1 item" }));
    expect(await screen.findByText("1 stamp added")).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("says when nobody has that number", async () => {
    const e = new AxiosError("x");
    e.response = { status: 404, data: { error: "Not found: No member for that card" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
    lookupCall.mockRejectedValueOnce(e);
    renderCounter();
    fireEvent.change(screen.getByLabelText("Or type the phone number"), { target: { value: "01009998887" } });
    fireEvent.click(screen.getByRole("button", { name: "Find" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Not a member yet"));
  });

  it("tells the teller who to ask when the shop's plan has no Rewards", async () => {
    const e = new AxiosError("x");
    e.response = { status: 403, data: { code: "plan_feature", feature: "loyalty", error: "Forbidden: not on this plan" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
    lookupCall.mockRejectedValueOnce(e);
    renderCounter();
    fireEvent.change(screen.getByLabelText("Or type the phone number"), { target: { value: "01001234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Find" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Ask the shop owner."));
    expect(screen.getByRole("alert").textContent).not.toContain("paid plan");
  });

  describe("the birthday gift", () => {
    const until = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const scan = (gift: unknown) => ({ member: member(3), recent: [], rewards: [], any_item: true, any_item_cost: 8, birthday_gift: gift });
    const conflict = (code: string) => {
      const e = new AxiosError("x");
      e.response = { status: 409, data: { code, error: "Conflict: x" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
      return e;
    };

    it("gives an open gift after a confirm, with its own key, and keeps the stamps", async () => {
      lookupCall.mockResolvedValueOnce(scan({ status: "open", valid_until: until }));
      giftCall.mockResolvedValueOnce({ already: false, member: member(3), birthday_gift: { status: "claimed", valid_until: until } });
      renderCounter();
      await findMariam();
      expect(screen.getByRole("heading", { name: "Birthday gift: one free item" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Give the gift" }));
      expect(await screen.findByRole("alertdialog")).toBeTruthy();
      expect(giftCall).not.toHaveBeenCalled();
      fireEvent.click(screen.getAllByRole("button", { name: "Give the gift" }).at(-1)!);
      expect(await screen.findByText("Gift given")).toBeTruthy();
      expect(document.querySelector("[role=status] bdi")?.textContent).toBe("Mariam");
      expect(giftCall).toHaveBeenCalledWith(expect.objectContaining({ branch_id: "b", customer_id: "m1", idempotency_key: expect.any(String) }));
      expect(screen.getByRole("heading", { name: "Birthday gift given" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Give the gift" })).toBeNull();
      expect(screen.getByRole("img", { name: "3 of 8 stamps" })).toBeTruthy();
    });

    it("says 'already given' when the key had claimed it", async () => {
      lookupCall.mockResolvedValueOnce(scan({ status: "open", valid_until: until }));
      giftCall.mockResolvedValueOnce({ already: true, member: member(3), birthday_gift: { status: "claimed", valid_until: until } });
      renderCounter();
      await findMariam();
      fireEvent.click(screen.getByRole("button", { name: "Give the gift" }));
      fireEvent.click((await screen.findAllByRole("button", { name: "Give the gift" })).at(-1)!);
      expect(await screen.findByText("Already given")).toBeTruthy();
    });

    it("shows a gift gone since the lookup as expired, with no button", async () => {
      lookupCall.mockResolvedValueOnce(scan({ status: "open", valid_until: until }));
      giftCall.mockRejectedValueOnce(conflict("LOYALTY_GIFT_NONE"));
      renderCounter();
      await findMariam();
      fireEvent.click(screen.getByRole("button", { name: "Give the gift" }));
      fireEvent.click((await screen.findAllByRole("button", { name: "Give the gift" })).at(-1)!);
      await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No birthday gift to give"));
      expect(screen.getByRole("heading", { name: "Birthday gift expired" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Give the gift" })).toBeNull();
    });

    it("keeps the same key for a retry after a dropped connection", async () => {
      lookupCall.mockResolvedValueOnce(scan({ status: "open", valid_until: until }));
      giftCall
        .mockRejectedValueOnce(new AxiosError("Network Error"))
        .mockResolvedValueOnce({ already: false, member: member(3), birthday_gift: { status: "claimed", valid_until: until } });
      renderCounter();
      await findMariam();
      fireEvent.click(screen.getByRole("button", { name: "Give the gift" }));
      fireEvent.click((await screen.findAllByRole("button", { name: "Give the gift" })).at(-1)!);
      await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No connection"));
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("Gift given")).toBeTruthy();
      expect(giftCall.mock.calls.at(-2)![0].idempotency_key).toBe(giftCall.mock.calls.at(-1)![0].idempotency_key);
    });

    it("shows no gift panel when the member has none", async () => {
      lookupCall.mockResolvedValueOnce(scan(undefined));
      renderCounter();
      await findMariam();
      expect(screen.queryByRole("heading", { name: /birthday/i })).toBeNull();
    });
  });
});
