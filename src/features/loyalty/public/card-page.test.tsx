/**
 * "Order now" on the member's card: there when the server sends a link (the
 * shop takes online orders), absent otherwise, and never an `href` that is not
 * a web link.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CardView } from "@/data/api/generated/models";

let card: Partial<CardView> = {};
vi.mock("@/data/api/generated/api", () => ({
  useLoyaltyCard: () => ({ data: card, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock("@/components/loyalty-card/card-brand", () => ({ resolveBrand: () => ({ programName: "Test Rewards", orgName: "Test Shop" }) }));
vi.mock("./page-shell", () => ({
  LoyaltyPage: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  PageNotice: () => null,
  PageSkeleton: () => null,
  usePageAccent: () => "#000",
}));
vi.mock("./card-press", () => ({
  PressStage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PressedCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PressRest: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
const drawn = vi.hoisted(() => ({ target: 0 }));
vi.mock("@/components/loyalty-card/loyalty-card", () => ({
  LoyaltyCard: (p: { target: number }) => {
    drawn.target = p.target;
    return null;
  },
}));
vi.mock("./card-orders", () => ({ CardOrders: () => null }));
vi.mock("./card-preferences", () => ({ CardPreferences: () => null }));
vi.mock("./rewards-list", () => ({ RewardsList: () => null }));
vi.mock("./social-links", () => ({ SocialLinks: () => null }));
vi.mock("./wallet-buttons", () => ({ WalletButtons: () => null }));
vi.mock("./use-pass-download", () => ({ usePassDownload: () => ({ phase: "idle" }) }));

const i18n = (await import("@/i18n")).default;
const { CardPage } = await import("./card-page");

const base = { name: "Sara", mode: "points", balance: 10, rewards: [], passes: { any: false }, brand: { social_links: [] } } as unknown as Partial<CardView>;

beforeEach(async () => {
  card = { ...base };
  await i18n.changeLanguage("en");
});

describe("CardPage", () => {
  it("says hello by first name over the card", async () => {
    card = { ...base, name: "Sara Adel" };
    render(<CardPage token="card-token" />);
    expect(screen.getByRole("heading", { level: 1, name: "Hi Sara" })).toBeVisible();
  });

  it("still names the page for a screen reader when there is no name", () => {
    card = { ...base, name: "  " };
    render(<CardPage token="card-token" />);
    expect(screen.getByRole("heading", { level: 1, name: "Your Test Shop card" })).toHaveClass("sr-only");
  });

  it("greets in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<CardPage token="card-token" />);
    expect(screen.getByRole("heading", { level: 1, name: "أهلاً Sara" })).toBeInTheDocument();
  });

  it("sizes the card by card_size when the server sends it", () => {
    card = { ...base, mode: "visits", next_reward_cost: 10, card_size: 8 } as Partial<CardView>;
    render(<CardPage token="card-token" />);
    expect(drawn.target).toBe(8);
    card = { ...base, mode: "visits", next_reward_cost: 10 };
    render(<CardPage token="card-token" />);
    expect(drawn.target).toBe(10);
  });
});

describe("CardPage — Order now", () => {
  it("is the primary link when the server sends one", () => {
    card = { ...base, order_now_url: "https://order.example.test/now/card-token" };
    render(<CardPage token="card-token" />);
    expect(screen.getByRole("link", { name: "Order now" })).toHaveAttribute("href", "https://order.example.test/now/card-token");
  });

  it("is absent when the shop does not take online orders", () => {
    render(<CardPage token="card-token" />);
    expect(screen.queryByRole("link", { name: "Order now" })).not.toBeInTheDocument();
  });

  it("is never a link that is not a web link", () => {
    card = { ...base, order_now_url: "javascript:alert(1)" };
    render(<CardPage token="card-token" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    card = { ...base, order_now_url: "https://order.example.test/now/card-token" };
    render(<CardPage token="card-token" />);
    expect(screen.getByRole("link", { name: "اطلب الآن" })).toBeInTheDocument();
  });
});
