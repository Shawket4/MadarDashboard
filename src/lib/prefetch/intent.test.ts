import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEDUPE_MS, HOVER_BUDGET_PER_S, HOVER_DELAY_MS, connectionAllowsPrefetch, intent, resetIntent } from "./intent";

const pe = (pointerType: string) => ({ pointerType }) as never;
const setConnection = (c: object | undefined) => Object.defineProperty(navigator, "connection", { value: c, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  resetIntent();
  setConnection(undefined);
});
afterEach(() => vi.useRealTimers());

describe("intent", () => {
  it("a mouse hover warms after the pause, and a pass-over warms nothing", () => {
    const fire = vi.fn();
    const h = intent("a", fire);
    h.onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(HOVER_DELAY_MS - 10);
    h.onPointerLeave(pe("mouse"));
    vi.advanceTimersByTime(100);
    expect(fire).not.toHaveBeenCalled();

    h.onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("moving on to another target drops the first one's pending hover", () => {
    const a = vi.fn();
    const b = vi.fn();
    intent("a", a).onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(20);
    intent("b", b).onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("touch warms at once on pointerdown (its pointerenter is ignored)", () => {
    const fire = vi.fn();
    const h = intent("t", fire);
    h.onPointerEnter(pe("touch"));
    vi.advanceTimersByTime(HOVER_DELAY_MS * 2);
    expect(fire).not.toHaveBeenCalled();
    h.onPointerDown(pe("touch"));
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("dedupes one target: hover, press and focus of one click warm once", () => {
    const fire = vi.fn();
    const h = intent("d", fire);
    h.onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    h.onPointerDown(pe("mouse"));
    h.onFocus({} as never);
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(DEDUPE_MS);
    h.onPointerDown(pe("mouse"));
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it("keyboard focus waits the pause too, and leaving cancels it", () => {
    const fire = vi.fn();
    const h = intent("k", fire);
    h.onFocus({} as never);
    h.onBlur({} as never);
    vi.advanceTimersByTime(HOVER_DELAY_MS * 2);
    expect(fire).not.toHaveBeenCalled();
  });

  it("throttles hovers to a budget a second; a press is never throttled", () => {
    const fire = vi.fn();
    for (let i = 0; i < HOVER_BUDGET_PER_S + 4; i++) {
      intent(`h${i}`, fire).onPointerEnter(pe("mouse"));
      vi.advanceTimersByTime(HOVER_DELAY_MS);
    }
    expect(fire).toHaveBeenCalledTimes(HOVER_BUDGET_PER_S);
    intent("press", fire).onPointerDown(pe("mouse"));
    expect(fire).toHaveBeenCalledTimes(HOVER_BUDGET_PER_S + 1);
    vi.advanceTimersByTime(1_000);
    intent("later", fire).onPointerEnter(pe("mouse"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(fire).toHaveBeenCalledTimes(HOVER_BUDGET_PER_S + 2);
  });

  it("warms nothing on Save-Data or 2G", () => {
    setConnection({ saveData: true });
    expect(connectionAllowsPrefetch()).toBe(false);
    setConnection({ effectiveType: "slow-2g" });
    expect(connectionAllowsPrefetch()).toBe(false);
    setConnection({ effectiveType: "2g" });
    const fire = vi.fn();
    intent("s", fire).onPointerDown(pe("touch"));
    expect(fire).not.toHaveBeenCalled();
    setConnection({ effectiveType: "4g", saveData: false });
    expect(connectionAllowsPrefetch()).toBe(true);
  });

  it("a keyless intent leaves the dedupe to its target (a route dedupes on its href)", () => {
    const fire = vi.fn();
    const h = intent(null, fire);
    h.onPointerDown(pe("mouse"));
    h.onPointerDown(pe("mouse"));
    expect(fire).toHaveBeenCalledTimes(2);
  });
});
