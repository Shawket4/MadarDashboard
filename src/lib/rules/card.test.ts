// madar-card's vectors through the vendored `card` package: the designer, the
// tracks, audiences and messages answer exactly as the server's crate.
import { describe, expect, it } from "vitest";

import designJson from "../card_design_vectors.json";
import rulesJson from "../card_rules_vectors.json";
import { cardRulesNow, type Audience, type CardDesign, type Ctx, type Message, type Mode, type Track } from "./card";

// JSON imports widen enums to string; the vectors are the crate's own types.
type Case<T> = T & { name: string; expected: unknown };
const design = designJson as unknown as { validate: Case<{ design: CardDesign; ctx: Ctx }>[] };
const rules = rulesJson as unknown as {
  tracks: Case<{ tracks: Track[]; mode: Mode }>[];
  audience: Case<{ audience: Audience; track_count: number }>[];
  message: Case<{ message: Message }>[];
  stepper: Case<{ balance: number; size: number }>[];
};

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
