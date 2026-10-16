import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { getGsap, loadGsap } from "./gsap";
import { useCountUp } from "./hooks";
import { Presence, SwapPresence } from "./presence";
import { fade } from "./recipes";

describe("motion before GSAP has loaded", () => {
  it("shows and hides at once, never waiting on the library", () => {
    expect(getGsap()).toBeNull();
    const { rerender } = render(
      <Presence show>
        <p>hello</p>
      </Presence>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    rerender(
      <Presence show={false}>
        <p>hello</p>
      </Presence>,
    );
    expect(screen.queryByText("hello")).toBeNull();
  });
});

describe("motion with GSAP", () => {
  beforeAll(async () => {
    await loadGsap();
    // jsdom lays nothing out; count everything as on screen.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0, left: 0, bottom: 20, right: 100, width: 100, height: 20, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
  });

  it("keeps the element mounted until its exit finishes", async () => {
    const quick = fade(40);
    const { rerender } = render(
      <StrictMode>
        <Presence show recipe={quick}>
          <p>sheet</p>
        </Presence>
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Presence show={false} recipe={quick}>
          <p>sheet</p>
        </Presence>
      </StrictMode>,
    );
    expect(screen.getByText("sheet")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("sheet")).toBeNull());
  });

  it("keeps showing its last content while it leaves", async () => {
    const quick = fade(40);
    const { rerender } = render(
      <Presence show recipe={quick}>
        <p>3 bookings</p>
      </Presence>,
    );
    rerender(
      <Presence show={false} recipe={quick}>
        <p>0 bookings</p>
      </Presence>,
    );
    expect(screen.getByText("3 bookings")).toBeInTheDocument();
    expect(screen.queryByText("0 bookings")).toBeNull();
    await waitFor(() => expect(screen.queryByText("3 bookings")).toBeNull());
  });

  it("reopening mid-exit keeps it and settles fully visible", async () => {
    const slow = fade(400);
    const { rerender } = render(
      <Presence show recipe={slow}>
        <p>menu</p>
      </Presence>,
    );
    rerender(
      <Presence show={false} recipe={slow}>
        <p>menu</p>
      </Presence>,
    );
    rerender(
      <Presence show recipe={slow}>
        <p>menu</p>
      </Presence>,
    );
    const el = screen.getByText("menu");
    await waitFor(() => expect(el.style.opacity).toBe(""), { timeout: 2000 });
    expect(el.style.pointerEvents).toBe("");
  });

  it("swaps keyed content, the old leaving before the new arrives", async () => {
    const quick = fade(40);
    const { rerender } = render(
      <SwapPresence swapKey="a" recipe={quick}>
        <p>step a</p>
      </SwapPresence>,
    );
    rerender(
      <SwapPresence swapKey="b" recipe={quick}>
        <p>step b</p>
      </SwapPresence>,
    );
    expect(screen.getByText("step a")).toBeInTheDocument();
    expect(screen.queryByText("step b")).toBeNull();
    await screen.findByText("step b");
    expect(screen.queryByText("step a")).toBeNull();
  });

  it("counts up and lands on the exact formatted figure, also under StrictMode", async () => {
    function Figure({ value }: { value: number }) {
      const ref = useRef<HTMLSpanElement>(null);
      useCountUp(ref, value, (n) => `EGP ${n.toFixed(2)}`, { duration: 60 });
      return <span ref={ref}>{`EGP ${value.toFixed(2)}`}</span>;
    }
    const { container, rerender } = render(
      <StrictMode>
        <Figure value={1234.5} />
      </StrictMode>,
    );
    const span = container.querySelector("span")!;
    await waitFor(() => expect(span.textContent).toBe("EGP 1234.50"));
    // A later change snaps to the truth, through React's own text node.
    act(() =>
      rerender(
        <StrictMode>
          <Figure value={99} />
        </StrictMode>,
      ),
    );
    expect(span.textContent).toBe("EGP 99.00");
    expect(span.childNodes).toHaveLength(1);
  });
});
