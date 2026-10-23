// The designed card draws the shop's design with the member's figures, in
// both languages, and the lazy switch keeps the classic card when there is
// no design (and loads nothing for it).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CardDesign, PublicCard } from "@/data/api/generated/models";
import { cardRulesNow } from "@/lib/rules/card";

import { DesignedCard } from "./designed-card";
import { LazyDesignedCard } from "./lazy-designed-card";

await import("@/i18n");
const w = cardRulesNow()!;
const colours = { background: "#0D6273", foreground: "#EFF3F4", label: "#B9DCE3" };
const tracks = [
  { position: 1, name_en: "Coffee", name_ar: "قهوة", size: null, shape: "cup", colour: null, items: [], per_item: true, cap: null },
  { position: 2, name_en: "Sandwich", name_ar: "ساندوتش", size: 6, shape: "heart", colour: "#F2B33D", items: [], per_item: true, cap: null },
] as PublicCard["tracks"];
const ctx = { mode: "visits" as const, tracks: [{ position: 1, size: 8 }, { position: 2, size: 6 }], has_photo: false };
const card: PublicCard = {
  revision: 3,
  design: w.card_default(colours, ctx, tracks as never) as CardDesign,
  tracks,
  track_one_size: 8,
  stamp_unit: "stamp",
};

describe("DesignedCard", () => {
  it("draws the strip and the fields with the member's figures", () => {
    const { container } = render(
      <DesignedCard rules={w} card={card} name="Drops" arabic={false} balances={[{ position: 1, balance: 3 }, { position: 2, balance: 7 }]} />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("750");
    expect(svg.textContent).toContain("Coffee");
    // Header: track 1's balance under its name; 7 of 6 on track 2 = a reward ready.
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText(/Sandwich · Reward ready/)).toBeTruthy();
  });

  it("mirrors and speaks Arabic on the Arabic card", () => {
    const { container } = render(<DesignedCard rules={w} card={card} name="دروبس" arabic balances={[]} />);
    expect(container.firstElementChild!.getAttribute("dir")).toBe("rtl");
    expect(container.querySelector("svg")!.textContent).toContain("قهوة");
  });

  it("keeps the classic card when the shop has no design", () => {
    render(<LazyDesignedCard card={null} name="Drops" classic={<p>classic card</p>} />);
    expect(screen.getByText("classic card")).toBeTruthy();
  });
});
