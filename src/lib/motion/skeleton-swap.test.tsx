import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SkeletonSwap, Stagger } from "./components";
import { getGsap } from "./gsap";

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

describe("data landing on a skeleton", () => {
  it("before GSAP has loaded: the new card is hidden before paint, then it rises in", async () => {
    expect(getGsap()).toBeNull();
    const { rerender } = render(card(true));
    rerender(card(false));
    const content = screen.getByText("EGP 166,000").parentElement!;
    expect(content.style.opacity).toBe("0");
    expect(content.style.transform).toMatch(/translate/);
    // (jsdom has no Web Animations, so the skeleton's fade-out ends at once here.)
    // GSAP arrives (fetched at once) and the card settles at rest.
    await waitFor(() => expect(getGsap()).not.toBeNull());
    await waitFor(() => expect(content.style.opacity).toBe(""), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull(), { timeout: 3000 });
  });

  it("with GSAP: hidden in the same commit that swaps the skeleton out", () => {
    const { rerender } = render(card(true));
    rerender(card(false));
    expect(screen.getByText("EGP 166,000").parentElement!.style.opacity).toBe("0");
  });

  it("content there from the start is not hidden by the swap", () => {
    render(card(false));
    expect(screen.getByText("EGP 166,000").parentElement!.style.opacity).toBe("");
  });
});
