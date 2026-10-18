import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkeletonSwap, Stagger } from "./components";
import { getGsap } from "./gsap";
import { ARRIVE_OPACITY } from "./tokens";

vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
  top: 0, left: 0, bottom: 20, right: 100, width: 100, height: 20, x: 0, y: 0, toJSON: () => ({}),
} as DOMRect);

const card = (loading: boolean) => (
  <Stagger when={!loading}>
    <SkeletonSwap loading={loading} skeleton={<p>skeleton</p>}>
      <p>EGP 166,000</p>
    </SkeletonSwap>
  </Stagger>
);

// A browser has the Web Animations API; jsdom does not. Stand one in so the
// "before GSAP" path runs as it does in a browser.
Element.prototype.animate ??= function () {
  const a = { onfinish: null as null | (() => void), cancel() {} };
  setTimeout(() => a.onfinish?.(), 10);
  return a as unknown as Animation;
};

describe("data landing on a skeleton", () => {
  it("before GSAP has loaded: the new card is legible on its first frame, then it settles in", async () => {
    expect(getGsap()).toBeNull();
    const { rerender } = render(card(true));
    rerender(card(false));
    const content = screen.getByText("EGP 166,000").parentElement!;
    // Legible at once (never held back), and still in motion: a pre-state, not the rest state.
    expect(Number(content.style.opacity)).toBe(ARRIVE_OPACITY);
    expect(Number(content.style.opacity)).toBeGreaterThanOrEqual(0.5);
    expect(content.style.transform).toMatch(/translate/);
    // (jsdom has no Web Animations, so the skeleton's fade-out ends at once here.)
    // GSAP arrives (fetched at once) and the card settles at rest.
    await waitFor(() => expect(getGsap()).not.toBeNull());
    await waitFor(() => expect(content.style.opacity).toBe(""), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull(), { timeout: 3000 });
  });

  it("with GSAP: arrives legible in the same commit that swaps the skeleton out, and plays", () => {
    const { rerender } = render(card(true));
    rerender(card(false));
    const content = screen.getByText("EGP 166,000").parentElement!;
    expect(Number(content.style.opacity)).toBe(ARRIVE_OPACITY);
    expect(content.style.transform).toMatch(/translate/);
  });

  it("the skeleton fades out beneath the content, not over it", () => {
    const { rerender, container } = render(card(true));
    rerender(card(false));
    const ghost = container.querySelector("[aria-hidden]");
    // (jsdom cannot animate, so the ghost may already be gone; when it is there it sits under.)
    if (ghost) expect(ghost.className).toMatch(/-z-10/);
    expect(container.querySelector("[data-arrive]")!.parentElement!.className).toMatch(/\bisolate\b/);
  });

  it("content there from the start is not hidden by the swap", () => {
    render(card(false));
    expect(screen.getByText("EGP 166,000").parentElement!.style.opacity).toBe("");
  });
});
