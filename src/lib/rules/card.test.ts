// madar-card's vectors through the vendored `card` package: the designer, the
// tracks, audiences and messages answer exactly as the server's crate.
import { describe, expect, it } from "vitest";

import design from "../card_design_vectors.json";
import rules from "../card_rules_vectors.json";
import { cardRulesNow } from "./card";

describe("card package", () => {
  const w = cardRulesNow()!;
  it("is loaded", () => {
    expect(w.card_rules().cols).toBe(12);
  });
  const pairs = (ps: { code: string; path: string }[]): unknown[] => ps.map((p) => [p.code, p.path]);
  it("validates designs as the crate does", () => {
    for (const c of design.validate) expect(pairs(w.card_validate(c.design, c.ctx)), c.name).toEqual(c.expected);
  });
  it("tracks, audiences, messages, stepper", () => {
    for (const c of rules.tracks) expect(pairs(w.tracks_validate(c.tracks, c.mode)), c.name).toEqual(c.expected);
    for (const c of rules.audience) expect(pairs(w.audience_validate(c.audience, c.track_count)), c.name).toEqual(c.expected);
    for (const c of rules.message) expect(pairs(w.message_validate(c.message)), c.name).toEqual(c.expected);
    for (const c of rules.stepper) expect(w.card_stepper(c.balance, c.size), c.name).toEqual(c.expected);
  });
});
