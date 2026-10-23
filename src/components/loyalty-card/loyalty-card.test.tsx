/**
 * The card says whose it is, where it stands and whose it will be, in
 * sentences and in the programme's unit, and carries nothing of Madar's.
 */
import { render as rtlRender, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { resolveBrand } from "./card-brand";

const i18n = (await import("@/i18n")).default;
const { LoyaltyCard } = await import("./loyalty-card");

const rawBrand = {
  org_name: "Bean & Brew", program_name: "Rewards", program_name_ar: "مكافآت", logo_url: null, logo_is_mark: false,
  card_image_url: null, background_color: "#0D6273", foreground_color: "#EFF3F4", label_color: "#2E94A6", social_links: [],
};
const brand = resolveBrand(rawBrand, "en");

/** The member's code is an `AssetImage`, which reads the query cache. */
const client = new QueryClient();
const wrap = (ui: ReactElement) => <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
const render = (ui: ReactElement) => {
  const r = rtlRender(wrap(ui));
  return { ...r, rerender: (next: ReactElement) => r.rerender(wrap(next)) };
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("LoyaltyCard", () => {
  it("puts the Rewards present where a shop has no logo, Paper on a dark card and Ink on a light one", () => {
    const { container, unmount } = render(<LoyaltyCard brand={brand} mode="visits" balance={0} target={6} />);
    // Small enough that the build inlines it: the kit's Paper (#EFF3F4) or Ink (#14181E) fill says which.
    expect(container.querySelector("header img")?.getAttribute("src")).toMatch(/EFF3F4/i);
    unmount();
    const light = resolveBrand({ ...rawBrand, background_color: "#F4C542", foreground_color: "#1C1814" }, "en");
    const again = render(<LoyaltyCard brand={light} mode="visits" balance={0} target={6} />);
    expect(again.container.querySelector("header img")?.getAttribute("src")).toMatch(/14181E/i);
  });

  it("leads with the shop, and its programme in plain words", () => {
    render(<LoyaltyCard brand={brand} mode="visits" balance={2} target={6} />);
    expect(screen.getByText("Bean & Brew")).toBeInTheDocument();
    expect(screen.getByText("Rewards")).not.toHaveClass("uppercase");
    // Madar signs the page's footer, not the shop's card.
    expect(screen.queryByText(/madar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Rewards by Madar/ })).not.toBeInTheDocument();
  });

  it("draws the stamps and says what is left, in what a stamp counts", () => {
    const { rerender } = render(<LoyaltyCard brand={brand} mode="visits" unit="order" balance={2} target={6} />);
    expect(screen.getByRole("img", { name: "2 of 6 orders" })).toBeInTheDocument();
    expect(screen.getByText("4 more orders to your next reward.")).toBeInTheDocument();
    rerender(<LoyaltyCard brand={brand} mode="visits" unit="item" balance={5} target={6} />);
    expect(screen.getByRole("img", { name: "5 of 6 items" })).toBeInTheDocument();
    expect(screen.getByText("1 more item to your next reward.")).toBeInTheDocument();
    rerender(<LoyaltyCard brand={brand} mode="visits" unit="stamp" balance={0} target={8} />);
    expect(screen.getByText("8 more stamps to your next reward.")).toBeInTheDocument();
  });

  it("prints a points balance over its bar", () => {
    render(<LoyaltyCard brand={brand} mode="points" balance={40} target={100} />);
    expect(screen.getByText("points")).toBeInTheDocument();
    expect(screen.getByText("60 more points to your next reward.")).toBeInTheDocument();
  });

  it("says nothing about a next reward the shop has not priced", () => {
    render(<LoyaltyCard brand={brand} mode="points" balance={40} target={0} />);
    expect(screen.queryByText(/next reward/)).not.toBeInTheDocument();
  });

  it("counts a full card as a reward and carries the rest over", () => {
    render(<LoyaltyCard brand={brand} mode="visits" balance={7} target={6} />);
    expect(screen.getByText("1 reward earned — ask at the counter.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1 of 6 orders" })).toBeInTheDocument();
  });

  it("puts the member's name along the foot, as typed, with no label over it", () => {
    const { rerender } = render(
      <LoyaltyCard brand={brand} mode="visits" balance={0} target={6} member={{ placeholder: "Your name", codePending: true }} />,
    );
    expect(screen.getByText("Your name")).toBeInTheDocument();
    expect(screen.queryByText(/member/i)).not.toBeInTheDocument();
    rerender(
      <LoyaltyCard
        brand={brand}
        mode="visits"
        balance={0}
        target={6}
        member={{ name: "Salma Adel", placeholder: "Your name", qrUrl: "/api/public/loyalty/card/tok/qr.png" }}
      />,
    );
    expect(screen.getByText("Salma Adel")).not.toHaveClass("uppercase");
    expect(screen.getByRole("img", { name: "Your membership code" })).toBeInTheDocument();
    // No caption under the code: a QR explains itself.
    expect(screen.queryByText(/scan/i)).not.toBeInTheDocument();
  });

  it("keeps a Latin name whole on an Arabic card (its full stop at its own end)", async () => {
    await i18n.changeLanguage("ar");
    const latin = { ...brand, orgName: "Madar Coffee Co." };
    render(<LoyaltyCard brand={latin} mode="visits" balance={0} target={6} member={{ name: "Salma A." }} />);
    expect(screen.getByText("Madar Coffee Co.").tagName).toBe("BDI");
    expect(screen.getByText("Salma A.").tagName).toBe("BDI");
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<LoyaltyCard brand={brand} mode="visits" unit="item" balance={3} target={8} />);
    expect(screen.getByRole("img", { name: "3 من 8 أصناف" })).toBeInTheDocument();
    expect(screen.getByText("بقيت 5 أصناف لمكافأتك التالية.")).toBeInTheDocument();
  });
});
