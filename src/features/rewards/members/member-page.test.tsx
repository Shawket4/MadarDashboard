/**
 * One member: a card per stamp track, the ledger with each row's track, the
 * adjust action only for who may adjust, and a refusal without `loyalty.read`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MemberDetail } from "@/data/api/generated/models";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...(await import("@/test/url-search-mock")).routerMock(),
  getRouteApi: () => ({ useParams: () => ({ memberId: "m-1" }) }),
}));
vi.mock("@/components/app/link", () => ({ Link: ({ children }: { children: ReactNode }) => <a href="#customer">{children}</a> }));
vi.mock("@/features/orders/order-detail-sheet", () => ({ OrderDetailSheet: () => null }));
vi.mock("@/features/loyalty/admin/members/adjust-dialog", () => ({ AdjustDialog: () => null }));
vi.mock("@/features/loyalty/admin/members/leave-programme-dialog", () => ({
  LeaveProgrammeButton: () => <button type="button">Remove from loyalty programme</button>,
}));

let held: string[] = ["loyalty.read"];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} });
  return { ...real, useAuthz: authz, useCan: (c: string) => authz().can(c as never) };
});

const track = (position: number, name_en: string, balance: number, size: number) => ({
  position, name_en, name_ar: "", size, balance, rewards_ready: Math.floor(balance / size), progress_to_next: balance % size,
  points_to_next_reward: size - (balance % size), can_redeem: balance >= size,
});
const detail = {
  member: {
    id: "m-1", org_id: "o", name: "Sara Ali", phone: "201000000001", mode: "visits", balance: 3, visits_balance: 3, points_balance: 0,
    lifetime_points: 0, lifetime_visits: 9, locale: "en", enrolled_at: "2026-09-01T10:00:00Z", next_reward_cost: 8,
    points_to_next_reward: 5, progress_to_next: 3, rewards_ready: 0, can_redeem: false,
    tracks: [track(1, "Coffee", 3, 8), track(2, "Croissants", 5, 4)],
  },
  ledger: [
    { id: "l-1", branch_id: "b", branch_name: "Maadi", created_at: "2026-10-20T10:00:00Z", currency: "visits", kind: "earn", points: 2, source: "sale", track: 2 },
  ],
} as unknown as MemberDetail;

vi.mock("@/data/api/generated/api", () => ({
  useGetLoyaltyMember: () => ({ data: detail, isError: false, isFetching: false }),
  useGetLoyaltyMemberWallet: () => ({ data: undefined, isLoading: true }),
  useListBranches: () => ({ data: [] }),
  useGetLoyaltyTracks: () => ({ data: { mode: "visits", track_one_size: 8, stamp_unit: "stamp", tracks: [] }, isLoading: false }),
}));

const i18n = (await import("@/i18n")).default;
const { RewardsMemberPage } = await import("./member-page");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RewardsMemberPage />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  held = ["loyalty.read"];
  await i18n.changeLanguage("en");
});

describe("RewardsMemberPage", () => {
  it("shows each track and labels the ledger row's track", () => {
    mount();
    expect(screen.getAllByTestId("member-track")).toHaveLength(2);
    expect(screen.getByText("3 of 8")).toBeInTheDocument();
    // "Croissants" is the card's title and the ledger row's track chip.
    expect(screen.getAllByText("Croissants")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Adjust balance/ })).not.toBeInTheDocument();
  });

  it("offers adjust only with loyalty.points.adjust", () => {
    held = ["loyalty.read", "loyalty.points.adjust"];
    mount();
    expect(screen.getByRole("button", { name: /Adjust balance/ })).toBeInTheDocument();
  });

  it("renders in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByText("السجل")).toBeInTheDocument();
    expect(screen.getByText("سجل العميل")).toBeInTheDocument();
  });

  it("is restricted without loyalty.read", () => {
    held = ["loyalty.members.list"];
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
  });
});
