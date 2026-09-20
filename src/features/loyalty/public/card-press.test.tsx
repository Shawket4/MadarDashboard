import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ResolvedBrand } from "../shared/brand";
import { PressedCard, PressRest, PressStage } from "./card-press";

const brand = { foreground: "oklch(0.98 0 0)" } as ResolvedBrand;

function stage(phase: "idle" | "making" | "opening" | "failed") {
  return render(
    <PressStage phase={phase}>
      <PressedCard brand={brand}>
        <section data-testid="card">card</section>
      </PressedCard>
      <PressRest>
        <p data-testid="rest">rest</p>
      </PressRest>
    </PressStage>,
  );
}

describe("the press", () => {
  it("is one switch the whole page reads", () => {
    const { container, rerender } = stage("idle");
    const root = container.querySelector(".ly-press")!;
    expect(root).toHaveAttribute("data-pass", "idle");
    rerender(
      <PressStage phase="making">
        <span />
      </PressStage>,
    );
    expect(root).toHaveAttribute("data-pass", "making");
  });

  it("lays the sheen and the stamp over the card without adding to the flow", () => {
    // Both are absolutely positioned inside the wrapper the card fills, so the
    // page below does not move when the press starts or stops.
    const { container } = stage("making");
    const wrapper = container.querySelector(".ly-press__card")!;
    expect(wrapper.querySelector('[data-testid="card"]')).toBeInTheDocument();
    for (const cls of [".ly-press__sheen", ".ly-press__stamp"]) {
      const el = wrapper.querySelector(cls)!;
      expect(el).toBeInTheDocument();
      expect(el.closest(".absolute, [class*='absolute']")).not.toBeNull();
      expect(el.closest("[aria-hidden]")).not.toBeNull();
    }
  });

  it("draws in the card's own ink, never a colour of its own", () => {
    const { container } = stage("making");
    const wrapper = container.querySelector(".ly-press__card") as HTMLElement;
    expect(wrapper.style.getPropertyValue("--ly-ink")).toBe(brand.foreground);
  });
});
