/**
 * Rewards › Overview, Programme and Automations: each renders in English and
 * Arabic, follows its capability (the restricted page, and no request,
 * without it), and Settings › Loyalty's old links land where they went.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { isRedirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RewardsStats } from "@/data/api/generated/models";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...(await import("@/test/url-search-mock")).routerMock(),
}));
vi.mock("@/components/app/link", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

let held: string[] = [];
let standalone = false;
const enabledSeen: Record<string, boolean[]> = {};
const hook = (name: string, data: () => unknown) => (...args: unknown[]) => {
  const opts = args.find((a) => typeof a === "object" && a !== null && "query" in (a as object)) as { query?: { enabled?: boolean } } | undefined;
  (enabledSeen[name] ??= []).push(opts?.query?.enabled ?? true);
  return { data: data(), isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() };
};

const stats: RewardsStats = {
  from: "2026-09-01",
  to: "2026-09-30",
  mode: "visits",
  stamp_unit: "stamp",
  members_total: 42,
  new_members: 7,
  active_members: 19,
  earned: 230,
  redemptions: 21,
  members_with_card: 30,
  messages_sent: 12,
  messages_seen: 8,
  per_track: [
    { position: 1, earned: 200, redemptions: 18 },
    { position: 2, earned: 30, redemptions: 3 },
  ],
  daily: [{ date: "2026-09-01", new_members: 2, active: 5, earned: 9, redemptions: 1 }],
};

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const make = () =>
    real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} });
  return { ...real, useAuthz: make, useCan: (c: string) => held.includes(c) };
});
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/hooks/use-plan", () => ({ useIsStandaloneLoyalty: () => standalone }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({ branchId: null, from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z", preset: "30d" }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useGetLoyaltyStats: hook("stats", () => stats),
  useGetLoyaltyCampaignEffectiveness: hook("campaigns", () => ({ campaigns: [{ campaign: "winback", sent: 10, returned_within_30d: 4, return_rate: 0.4 }] })),
  useListLoyaltyBroadcasts: hook("broadcasts", () => ({
    items: [{ id: "b1", line_en: "Double stamps Friday", line_ar: "", status: "sent", scheduled_for: "2026-09-10T10:00:00Z", started_at: "2026-09-10T10:00:00Z", sent: 30, seen: 12 }],
    total: 1,
    sent_last_24h: 0,
    limits: { daily_limit: 3 },
  })),
  useGetLoyaltyTracks: hook("tracks", () => ({
    mode: "visits",
    track_one_size: 8,
    tracks: [
      { position: 1, name_en: "Coffee", name_ar: "قهوة" },
      { position: 2, name_en: "Sandwich", name_ar: "ساندويتش", size: 6 },
    ],
  })),
  useListBranches: hook("branches", () => []),
}));
vi.mock("@/features/loyalty/admin/overview/overview-pane", () => ({ OverviewPane: () => <div data-testid="value-pane" /> }));
vi.mock("@/features/loyalty/admin/program/program-pane", () => ({
  ProgramPane: ({ cards }: { cards: string[] }) => <div data-testid="program-pane" data-cards={cards.join(",")} />,
}));
vi.mock("@/features/loyalty/admin/rewards/rewards-pane", () => ({ RewardsPane: () => <div data-testid="rewards-pane" /> }));
vi.mock("@/features/loyalty/admin/sign-up-code", () => ({ SignUpCode: () => <div data-testid="sign-up-code" /> }));
vi.mock("./programme/tracks-editor", () => ({ TracksEditor: () => <div data-testid="tracks-editor" /> }));

const i18n = (await import("@/i18n")).default;
const { RewardsOverviewPage } = await import("./overview/overview-page");
const { RewardsProgrammePage } = await import("./programme/programme-page");
const { AutomationsPage } = await import("./automations/automations-page");
const { urlSearch } = await import("@/test/url-search-mock");

const mount = (ui: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

afterEach(async () => {
  await i18n.changeLanguage("en");
  urlSearch.reset();
  standalone = false;
  for (const k of Object.keys(enabledSeen)) delete enabledSeen[k];
});

describe("Rewards › Overview", () => {
  it("shows the period's figures, each track and the latest message", async () => {
    held = ["loyalty.members.list", "loyalty.read"];
    await i18n.changeLanguage("en");
    mount(<RewardsOverviewPage />);
    expect(screen.getByRole("heading", { name: "Rewards" })).toBeInTheDocument();
    expect(screen.getAllByText("Stamps given").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("track-row")).toHaveLength(2);
    expect(screen.getByText("Sandwich")).toBeInTheDocument();
    expect(screen.getByText("Double stamps Friday")).toBeInTheDocument();
    expect(screen.getByText("4 of 10 came back within 30 days")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the loyalty report" })).toHaveAttribute("href", "/reports/loyalty");
  });

  it("reads in Arabic", async () => {
    held = ["loyalty.members.list", "loyalty.read"];
    await i18n.changeLanguage("ar");
    mount(<RewardsOverviewPage />);
    expect(screen.getByRole("heading", { name: "المكافآت" })).toBeInTheDocument();
    expect(screen.getAllByText("الأختام الممنوحة").length).toBeGreaterThan(0);
    expect(screen.getByText("ساندويتش")).toBeInTheDocument();
  });

  it("is restricted without loyalty.members.list, and asks for no figures", () => {
    held = ["loyalty.read"];
    mount(<RewardsOverviewPage />);
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
    expect(enabledSeen.stats?.every((e) => e === false)).toBe(true);
  });
});

describe("Rewards › Programme", () => {
  it("opens on the programme's rules, with tracks, rewards and join codes as tabs", () => {
    held = ["loyalty.read", "loyalty.use"];
    mount(<RewardsProgrammePage />);
    expect(screen.getByTestId("program-pane")).toHaveAttribute("data-cards", "basics,collecting");
    for (const name of ["Programme", "Stamp tracks", "Rewards", "Join codes"]) expect(screen.getByRole("tab", { name })).toBeInTheDocument();
  });

  it("shows the tab in the URL, and no reward catalogue for a stamp card sold on its own", () => {
    held = ["loyalty.read"];
    standalone = true;
    urlSearch.reset({ tab: "rewards" });
    mount(<RewardsProgrammePage />);
    expect(screen.queryByRole("tab", { name: "Rewards" })).not.toBeInTheDocument();
    expect(screen.getByTestId("program-pane")).toBeInTheDocument();
  });

  it("reads in Arabic", async () => {
    held = ["loyalty.read"];
    await i18n.changeLanguage("ar");
    urlSearch.reset({ tab: "tracks" });
    mount(<RewardsProgrammePage />);
    expect(screen.getByRole("tab", { name: "مسارات الأختام" })).toBeInTheDocument();
    expect(screen.getByTestId("tracks-editor")).toBeInTheDocument();
  });

  it("is restricted without loyalty.read or loyalty.use", () => {
    held = ["loyalty.members.list"];
    mount(<RewardsProgrammePage />);
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
    expect(screen.queryByTestId("program-pane")).not.toBeInTheDocument();
  });
});

describe("Rewards › Automations", () => {
  it("shows the programme form's sign-up and pass cards only", async () => {
    held = ["loyalty.read", "loyalty.use"];
    mount(<AutomationsPage />);
    expect(screen.getByTestId("program-pane")).toHaveAttribute("data-cards", "signup,passes");
    await i18n.changeLanguage("ar");
    expect(await screen.findByRole("heading", { name: "الرسائل التلقائية" })).toBeInTheDocument();
  });

  it("is restricted without loyalty.read or loyalty.use", () => {
    held = [];
    mount(<AutomationsPage />);
    expect(screen.queryByTestId("program-pane")).not.toBeInTheDocument();
  });
});

describe("Settings › Loyalty moved into Rewards", () => {
  it.each([
    [undefined, "/rewards/programme", undefined],
    ["program", "/rewards/programme", undefined],
    ["rewards", "/rewards/programme", { tab: "rewards" }],
    ["members", "/rewards/members", undefined],
    ["overview", "/rewards", undefined],
  ])("?tab=%s lands on %s", async (tab, to, search) => {
    const { Route } = await vi.importActual<typeof import("@/routes/_app/settings/loyalty")>("@/routes/_app/settings/loyalty");
    const beforeLoad = Route.options.beforeLoad as unknown as (ctx: { search: { tab?: string } }) => void;
    let thrown: unknown;
    try {
      beforeLoad({ search: { tab } });
    } catch (e) {
      thrown = e;
    }
    expect(isRedirect(thrown) ? thrown.options.to : (thrown as { to?: string })?.to).toBe(to);
    const s = isRedirect(thrown) ? thrown.options.search : (thrown as { search?: unknown })?.search;
    expect(s).toEqual(search);
  });
});
