import { act, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Reveal, Stagger } from "./components";
import { loadGsap } from "./gsap";

const frames = (n = 2) =>
  act(async () => {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  });

describe("entrances never hide what is already on screen", () => {
  beforeAll(async () => {
    await loadGsap();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0, left: 0, bottom: 20, right: 100, width: 100, height: 20, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
  });

  it("a Reveal whose content was painted at rest does not vanish when `when` turns true", async () => {
    const { rerender } = render(<Reveal when={false}><p>skeleton card</p></Reveal>);
    await frames();
    rerender(<Reveal when><p>figures</p></Reveal>);
    expect(screen.getByText("figures").parentElement!.style.opacity).toBe("");
  });

  it("a Reveal mounting with its content plays from the clean pre-state", () => {
    render(<Reveal><p>new</p></Reveal>);
    expect(screen.getByText("new").parentElement!.style.opacity).toBe("0");
  });

  it("a replayKey change is new content, so it plays again", async () => {
    const { rerender } = render(<Reveal replayKey="a"><p>step a</p></Reveal>);
    await frames(30);
    rerender(<Reveal replayKey="b"><p>step b</p></Reveal>);
    expect(screen.getByText("step b").parentElement!.style.opacity).toBe("0");
  });

  it("a Stagger moves only the items that were not on screen yet", async () => {
    const { rerender } = render(
      <Stagger when={false}>
        <div>old</div>
      </Stagger>,
    );
    await frames();
    rerender(
      <Stagger when>
        <div>old</div>
        <div>new</div>
      </Stagger>,
    );
    expect(screen.getByText("old").style.opacity).toBe("");
    expect(screen.getByText("new").style.opacity).toBe("0");
  });
});
