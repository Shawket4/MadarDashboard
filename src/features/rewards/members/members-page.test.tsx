/**
 * The members table: rows from `POST /loyalty/members/query`, a segment chip
 * puts its rules into the request body, and the page is refused without
 * `loyalty.members.list`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CrmMembersPage } from "@/data/api/generated/models";
import { urlSearch } from "@/test/url-search-mock";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...(await import("@/test/url-search-mock")).routerMock(),
}));

let held: string[] = ["loyalty.members.list"];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} });
  return { ...real, useAuthz: authz, useCan: (c: string) => authz().can(c as never) };
});

const page: CrmMembersPage = {
  total: 1,
  rows: [
    {
      id: "m-1", name: "Sara Ali", phone: "201000000001", balance: 3, lifetime: 9, rewards_ready: 1, locale: "en",
      enrolled_at: "2026-09-01T10:00:00Z", last_visit_at: "2026-10-20T10:00:00Z", apple_devices: 2, google_card: true,
      marketing_opt_out: true, birth_month: null, tracks: null,
    },
  ],
};
const query = vi.fn().mockResolvedValue(page);
vi.mock("@/data/api/generated/api", () => ({
  queryLoyaltyMembers: (body: unknown) => query(body),
  getGetLoyaltyMemberQueryOptions: (id: string) => ({ queryKey: ["/loyalty/members", id], queryFn: () => null }),
  useGetLoyaltyTracks: () => ({ data: undefined, isLoading: false }),
}));

const i18n = (await import("@/i18n")).default;
const { RewardsMembersPage } = await import("./members-page");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RewardsMembersPage />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  held = ["loyalty.members.list"];
  urlSearch.reset();
  query.mockClear();
  await i18n.changeLanguage("en");
});

describe("RewardsMembersPage", () => {
  it("lists members with their wallet and opt-out", async () => {
    mount();
    expect(await screen.findByText("Sara Ali")).toBeInTheDocument();
    expect(screen.getByText("Apple ×2")).toBeInTheDocument();
    expect(screen.getByText("No offers")).toBeInTheDocument();
    expect(query.mock.calls[0][0]).toMatchObject({ audience: { rules: [] }, sort: "joined", desc: true, offset: 0 });
  });

  it("renders in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(await screen.findByText("Sara Ali")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الأعضاء" })).toBeInTheDocument();
  });

  it("a segment chip sends its rules in the query body", async () => {
    mount();
    await screen.findByText("Sara Ali");
    await userEvent.click(screen.getByRole("button", { name: "Lapsed 30 days" }));
    await waitFor(() =>
      expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ audience: { rules: [{ type: "not_visited_for", days: 30 }] } })),
    );
  });

  it("is restricted without loyalty.members.list", () => {
    held = ["loyalty.read"];
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
    expect(query).not.toHaveBeenCalled();
  });
});
