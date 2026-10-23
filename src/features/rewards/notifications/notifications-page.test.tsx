/**
 * Rewards › Notifications: the composer counts characters, refuses links
 * (madar-card's own check, from the wasm package), shows who can be reached,
 * confirms with that count and sends the right body; the daily quota stops it;
 * the capabilities decide what shows; a scheduled message can be cancelled.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Broadcast, BroadcastsPage } from "@/data/api/generated/models";

let held: string[] = ["loyalty.members.list", "loyalty.read", "loyalty.broadcast"];
const confirm = vi.fn().mockResolvedValue(true);
const create = vi.fn().mockResolvedValue({});
const cancel = vi.fn().mockResolvedValue({});
const count = vi.fn();
const countData = { members: 12, opted_out: 2, apple: 5, google: 3, no_card: 2 };

const limits = { line_max: 100, daily_limit: 3, member_gap_hours: 20, schedule_min_minutes: 5, schedule_max_days: 30 };
const scheduled: Broadcast = {
  id: "b1", line_en: "Double stamps Friday", line_ar: "", audience: { rules: [] }, whatsapp_fallback: false,
  status: "scheduled", scheduled_for: "2026-10-30T10:00:00Z", created_at: "2026-10-23T10:00:00Z", created_by_name: "Sara",
  recipients: 0, pending: 0, sent: 0, apple: 0, google: 0, whatsapp: 0, seen: 0, skipped_recent: 0, skipped_opted_out: 0, unreachable: 0, failed: 0,
};
let page: BroadcastsPage = { items: [scheduled], total: 1, sent_last_24h: 1, limits };

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => confirm }));
vi.mock("@/components/app/page", () => ({
  Page: ({ children }: { children: unknown }) => <div>{children as never}</div>,
  PageHeader: ({ title, actions }: { title: string; actions?: unknown }) => (
    <header>
      <h1>{title}</h1>
      {actions as never}
    </header>
  ),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} });
  return { ...real, useAuthz: authz, useCan: (c: string) => held.includes(c) };
});
vi.mock("@/data/api/generated/api", () => ({
  useListLoyaltyBroadcasts: () => ({ data: page, isLoading: false, error: null, refetch: vi.fn() }),
  getListLoyaltyBroadcastsQueryKey: () => ["/loyalty/broadcasts"],
  useGetLoyaltyTracks: () => ({ data: undefined, isLoading: false }),
  useCountLoyaltyBroadcastAudience: () => ({ mutate: count, data: countData, isPending: false }),
  useCreateLoyaltyBroadcast: () => ({ mutateAsync: create, isPending: false }),
  useCancelLoyaltyBroadcast: () => ({ mutateAsync: cancel, isPending: false }),
}));

const i18n = (await import("@/i18n")).default;
const { NotificationsPage } = await import("./notifications-page");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>,
  );
const enInput = () => screen.getByLabelText("Message in English");
const sendButton = () => screen.getByRole("button", { name: /Send message/ });

beforeEach(async () => {
  await i18n.changeLanguage("en");
  held = ["loyalty.members.list", "loyalty.read", "loyalty.broadcast"];
  page = { items: [scheduled], total: 1, sent_last_24h: 1, limits };
  for (const f of [confirm, create, cancel, count]) f.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("NotificationsPage", () => {
  it("renders in English with the quota and the honest delivery note", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByTestId("quota")).toHaveTextContent("1 of 3 sent today");
    expect(screen.getByText(/Google gives no delivery signal/)).toBeInTheDocument();
    expect(screen.getByText("Double stamps Friday")).toBeInTheDocument();
  });

  it("renders in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByRole("heading", { name: "الإشعارات" })).toBeInTheDocument();
    expect(screen.getByTestId("quota")).toHaveTextContent("أُرسلت 1 من 3 اليوم");
  });

  it("counts characters as they are typed", () => {
    mount();
    fireEvent.change(enInput(), { target: { value: "Hello" } });
    expect(screen.getAllByTestId("char-count")[0]).toHaveTextContent("5/100");
  });

  it("refuses a link: the problem shows and Send is off", () => {
    mount();
    fireEvent.change(enInput(), { target: { value: "Order at drops.com now" } });
    expect(screen.getByText(/Links aren't allowed/)).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it("counts the audience once it settles, and shows who is reached", async () => {
    vi.useFakeTimers();
    mount();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(count).toHaveBeenCalledWith({ data: { audience: { rules: [] } } });
    expect(screen.getByTestId("audience-count")).toHaveTextContent("8 members will get it");
  });

  it("confirms with the count and sends the message now", async () => {
    mount();
    fireEvent.change(enInput(), { target: { value: "Double stamps on Friday" } });
    fireEvent.click(sendButton());
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(confirm.mock.calls[0][0].title).toBe("Send this message to 8 members?");
    expect(create.mock.calls[0][0]).toEqual({
      data: { message: { en: "Double stamps on Friday", ar: "" }, audience: { rules: [] }, whatsapp_fallback: false },
    });
  });

  it("stops at the daily limit", () => {
    page = { ...page, sent_last_24h: 3 };
    mount();
    fireEvent.change(enInput(), { target: { value: "Hi" } });
    expect(sendButton()).toBeDisabled();
    expect(screen.getByText(/the most allowed/)).toBeInTheDocument();
  });

  it("has no composer and no cancel without loyalty.broadcast", () => {
    held = ["loyalty.members.list"];
    mount();
    expect(screen.queryByLabelText("Message in English")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByText(/sending one needs the owner's permission/)).toBeInTheDocument();
  });

  it("is restricted without loyalty.members.list", () => {
    held = ["loyalty.read"];
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
  });

  it("cancels a scheduled message after a confirm", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith({ id: "b1" }));
  });
});
