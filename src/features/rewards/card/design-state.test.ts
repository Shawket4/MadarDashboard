import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import type { CardDesign } from "@/data/api/generated/models";
import { cardRulesNow } from "@/lib/rules/card";

import { clampCell, contrast, footerIsPaper, initEditor, isDirty, keyAction, reducer, sourceFrom, sourceKey } from "./design-state";
import { PROBLEM_CODES, problemElement, problemText } from "./problems";

const w = cardRulesNow()!;
const ctx = { mode: "visits" as const, tracks: [{ position: 1, size: 8 }], has_photo: false };
const design = w.card_default({ background: "#1F2A44", foreground: "#FFFFFF", label: "#C9D1E0" }, ctx, []) as CardDesign;

describe("design state", () => {
  it("moves within the grid and never shrinks on a move", () => {
    let s = initEditor(design);
    expect(design.elements?.[0].cell).toEqual({ col: 0, row: 4, w: 12, h: 1 });
    s = reducer(s, { type: "move", index: 0, dc: 3, dr: -1 });
    expect(s.design.elements?.[0].cell).toEqual({ col: 0, row: 3, w: 12, h: 1 });
    expect(isDirty(s)).toBe(true);
    s = reducer(s, { type: "resize", index: 0, dw: -4, dh: 9 });
    expect(s.design.elements?.[0].cell).toEqual({ col: 0, row: 3, w: 8, h: 3 });
    expect(reducer(s, { type: "saved" }).saved).toBe(JSON.stringify(s.design));
  });

  it("clamps a dropped cell inside the grid", () => {
    expect(clampCell({ col: 11, row: 5, w: 4, h: 2 })).toEqual({ col: 8, row: 4, w: 4, h: 2 });
    expect(clampCell({ col: -2, row: -1, w: 0, h: 9 })).toEqual({ col: 0, row: 0, w: 1, h: 6 });
  });

  it("adds and selects, removes and deselects", () => {
    let s = reducer(initEditor(design), { type: "add", kind: { type: "logo" }, cell: { col: 10, row: 0, w: 2, h: 2 } });
    expect(s.selected).toBe(1);
    s = reducer(s, { type: "remove", index: 1 });
    expect(s.design.elements).toHaveLength(1);
    expect(s.selected).toBeNull();
  });

  it("arrow keys move, Shift resizes, and left/right swap on a mirrored card", () => {
    expect(keyAction("ArrowRight", false, 2, false)).toEqual({ type: "move", index: 2, dc: 1, dr: 0 });
    expect(keyAction("ArrowRight", false, 2, true)).toEqual({ type: "move", index: 2, dc: -1, dr: 0 });
    expect(keyAction("ArrowDown", true, 0, false)).toEqual({ type: "resize", index: 0, dw: 0, dh: 1 });
    expect(keyAction("a", false, 0, false)).toBeNull();
  });

  it("field sources round-trip", () => {
    for (const f of [{ type: "balance", track: 2 }, { type: "member" }] as const) expect(sourceFrom(sourceKey(f))).toEqual(f);
  });

  it("matches the crate's contrast, and the server's footer pick", () => {
    expect(contrast("#FFFFFF", "#000000")).toBeCloseTo(21);
    expect(footerIsPaper("#FFFFFF")).toBe(true);
    expect(footerIsPaper("#1F2A44")).toBe(false);
    expect(footerIsPaper("bad")).toBe(true);
  });
});

describe("problem words", () => {
  const t = i18n.getFixedT("en");
  const ar = i18n.getFixedT("ar");
  it.each(PROBLEM_CODES)("%s has its own sentence in English and Arabic", (code) => {
    expect(problemText(code, t)).not.toBe(problemText("unknown_code", t));
    expect(ar(`rewards.card.problem.${code}`, { defaultValue: "@@" })).not.toBe("@@");
  });
  it("points at the element", () => {
    expect(problemElement("elements[3]~elements[1]")).toBe(3);
    expect(problemElement("apple.header")).toBeNull();
  });
});
