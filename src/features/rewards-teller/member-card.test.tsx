import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MemberCard } from "./member-card";
import { cardColors, type Track } from "./util";

const colors = cardColors(null);
const track = (o: Partial<Track>): Track => ({ id: "card", name: null, filled: 3, size: 8, extra: 0, canRedeem: false, ...o });

describe("MemberCard", () => {
  it("draws the shop's published design, with Complete under it and no second strip", async () => {
    const { cardRulesNow } = await import("@/lib/rules/card");
    const w = cardRulesNow()!;
    const tracks = [{ position: 1, name_en: "Coffee", name_ar: "قهوة", size: null, shape: "cup", colour: null, items: [], per_item: true, cap: null }];
    const design = w.card_default(
      { background: "#0D6273", foreground: "#EFF3F4", label: "#B9DCE3" },
      { mode: "visits", tracks: [{ position: 1, size: 8 }], has_photo: false },
      tracks as never,
    );
    const onRedeem = vi.fn();
    render(
      <MemberCard
        shopName="Drops"
        name="Mariam"
        phone="201001234567"
        tracks={[track({ filled: 8, canRedeem: true })]}
        colors={colors}
        onRedeem={onRedeem}
        design={{ revision: 1, design, tracks, track_one_size: 8, stamp_unit: "stamp" } as never}
        balances={[{ position: 1, balance: 8 }]}
      />,
    );
    const card = await screen.findByRole("group", { name: "Drops card" });
    expect(card.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("img", { name: "8 of 8 stamps" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Complete card" }));
    expect(onRedeem).toHaveBeenCalled();
  });

  it("shows one track as the wallet strip, with no Complete button until it is full", () => {
    render(<MemberCard shopName="Drops" name="Mariam" phone="201001234567" tracks={[track({})]} colors={colors} onRedeem={() => {}} />);
    expect(screen.getByRole("img", { name: "3 of 8 stamps" })).toBeTruthy();
    expect(screen.getByText("5 more stamps to a reward")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /complete/i })).toBeNull();
  });

  it("completes a full card and says what carries over", () => {
    const onRedeem = vi.fn();
    render(
      <MemberCard
        shopName="Drops"
        name="Mariam"
        phone="201001234567"
        tracks={[track({ filled: 8, extra: 2, canRedeem: true })]}
        colors={colors}
        onRedeem={onRedeem}
      />,
    );
    expect(screen.getByText(/\+2 on the next card/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete card" }));
    expect(onRedeem).toHaveBeenCalledWith(expect.objectContaining({ id: "card" }));
  });

  it("gives each of several tracks its own name, count and Complete button", () => {
    const onRedeem = vi.fn();
    render(
      <MemberCard
        shopName="Drops"
        name="Mariam"
        phone="201001234567"
        tracks={[
          track({ id: "coffee", name: "Coffee", filled: 6, size: 6, canRedeem: true }),
          track({ id: "pastry", name: "Pastry", filled: 1, size: 4 }),
          track({ id: "beans", name: "Beans", filled: 20, size: 30 }),
        ]}
        colors={colors}
        onRedeem={onRedeem}
      />,
    );
    expect(screen.getByRole("img", { name: "\u2068Pastry\u2069: 1 of 4 stamps" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "\u2068Beans\u2069: 20 of 30 stamps" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete Coffee" }));
    expect(onRedeem).toHaveBeenCalledWith(expect.objectContaining({ id: "coffee" }));
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
