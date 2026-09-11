import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { StampRow, stampable } from "./stamp-row";

const row = (earned: number, target: number) =>
  render(
    <StampRow
      earned={earned}
      target={target}
      accent="#C8607F"
      onAccent="#7B1E3A"
      muted="rgba(255,255,255,0.72)"
    />,
  );

/** The steps, in order. */
const steps = (c: ReturnType<typeof row>) =>
  Array.from(c.container.querySelectorAll("li")) as HTMLLIElement[];

describe("StampRow", () => {
  it("keeps every step circular", () => {
    // A step takes its height from the width it actually got. It used to be
    // given the SAME expression for both, and a percentage in `height` resolves
    // against the parent's height — which this row has none of — so the steps
    // came out squashed ovals at every size.
    for (const s of steps(row(2, 8))) {
      // The CSSOM serialises `1` as `1 / 1`; both spell a square.
      expect(["1", "1/1"]).toContain(s.style.aspectRatio.replace(/\s/g, ""));
      expect(s.style.height).toBe("");
      // Sized from the row's own step size, never a fixed pixel count — a
      // fixed one is what pushed twelve steps out past the card's corner.
      expect(s.style.width).toBe("var(--step)");
    }
  });

  it("spans the row end to end", () => {
    const c = row(0, 5);
    const list = c.container.querySelector("ol")!;
    // The step size is declared once, on the row, and shrinks to its share.
    expect(list.style.getPropertyValue("--step")).toContain("min(");
    expect(list.style.getPropertyValue("--step")).toContain("/ 5)");
    // `space-between` puts the first step on the left edge and the last on the
    // right, rather than bunching them at the start once they hit the cap.
    expect(list.className).toContain("justify-between");
  });

  it("draws the track between step centres, in units of the row", () => {
    const c = row(3, 5);
    const [track, done] = Array.from(
      c.container.querySelectorAll("div[aria-hidden]"),
    ) as HTMLDivElement[];
    // Half a step in from each end — the centres, not the edges. Inline
    // ends, not left and right: in Arabic the first step is on the right, and
    // a run pinned to the left grew from the last step towards the first.
    expect(track.style.insetInlineStart).toBe(track.style.insetInlineEnd);
    expect(track.style.insetInlineStart).toContain("var(--step)");
    expect(track.style.left).toBe("");
    expect(done.style.insetInlineStart).toBe(track.style.insetInlineStart);
    // The completed run reaches the centre of the last DONE step: two gaps of
    // the four between five centres.
    expect(done.style.width).toContain("0.5");
  });

  it("clamps rather than drawing a broken row", () => {
    // Redemption leaves a remainder and an adjustment can overshoot.
    expect(steps(row(99, 4)).filter((s) => s.textContent === "✓")).toHaveLength(4);
    expect(steps(row(-3, 4)).filter((s) => s.textContent === "✓")).toHaveLength(0);
  });

  it("drops numerals once a step is too small to hold one", () => {
    expect(steps(row(0, 6)).map((s) => s.textContent)).toEqual([
      "1", "2", "3", "4", "5", "6",
    ]);
    expect(steps(row(0, 12)).every((s) => s.textContent === "")).toBe(true);
  });

  it("hands a points programme back to the bar", () => {
    // Twelve is countable; a hundred is texture.
    expect(stampable(12)).toBe(true);
    expect(stampable(13)).toBe(false);
    expect(stampable(0)).toBe(false);
  });
});
