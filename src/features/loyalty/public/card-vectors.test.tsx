/**
 * The member's card against madar-loyalty's vectors (src/lib, pinned to their
 * tag): the join page's figures (`loyalty_card`) and the stamp row, whether a
 * target is drawn as stamps and how many it fills (`loyalty_stamps`).
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import vectors from "@/lib/loyalty_card_vectors.json";
import { rules } from "@/lib/rules";

import { StampRow, stampable } from "./stamp-row";

describe("the join page's card is madar-loyalty's", () => {
  it.each(vectors.cards)("$name", (c) => {
    expect(rules.loyalty_card(c.balance, c.next_reward_cost)).toEqual(c.expected);
  });
});

describe("the stamp row fills what madar-loyalty's stamps says", () => {
  it.each(vectors.stamps)("$name", (c) => {
    expect(stampable(c.cost)).toBe(c.expected !== null);
    if (c.expected === null) return;
    const { container } = render(<StampRow earned={c.earned} target={c.cost} accent="#000" onAccent="#fff" muted="#888" />);
    expect(container.querySelector("ol")).toHaveAttribute("aria-label", `${c.expected} of ${c.cost} collected`);
  });
});
