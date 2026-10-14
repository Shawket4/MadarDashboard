import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/data/api/query";
import { useAuthStore } from "@/data/stores/auth.store";

import { invalidationsFor, plansStream, POLL_INTERVAL_MS, POLL_PREFIXES, useBranchRealtime } from "./use-branch-realtime";

describe("realtime gating by plan", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let invalidate: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    invalidate.mockRestore();
    useAuthStore.setState({ plan: null });
  });

  it("only Free lacks the stream; an unknown plan reads as Paid", () => {
    expect(plansStream("free")).toBe(false);
    expect(plansStream("paid")).toBe(true);
    expect(plansStream(null)).toBe(true);
  });

  it("Free never opens the stream and polls every 60 s instead", () => {
    useAuthStore.setState({ plan: "free" });
    renderHook(() => useBranchRealtime("b1"));
    expect(fetchMock).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(POLL_INTERVAL_MS - 1));
    expect(invalidate).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(invalidate).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(POLL_INTERVAL_MS));
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it("Paid opens the stream and does not poll", () => {
    useAuthStore.setState({ plan: "paid" });
    renderHook(() => useBranchRealtime("b1"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/realtime/stream?branch_id=b1");
    act(() => void vi.advanceTimersByTime(POLL_INTERVAL_MS * 3));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("stops polling on unmount", () => {
    useAuthStore.setState({ plan: "free" });
    const { unmount } = renderHook(() => useBranchRealtime("b1"));
    unmount();
    act(() => void vi.advanceTimersByTime(POLL_INTERVAL_MS * 2));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("the poll covers everything an event invalidates", () => {
    const events = ["booking.created", "floor.x", "table.x", "transfer.x", "ticket.table_changed", "ticket.fired", "delivery.new", "kitchen.x", "till.opened", "payment_methods.availability_changed", "branch.settings_changed", "branch.plan_changed"];
    for (const e of events) for (const p of invalidationsFor(e)) expect(POLL_PREFIXES).toContain(p);
  });
});

describe("invalidationsFor", () => {
  it("maps booking events to the bookings list AND the floor (next_booking)", () => {
    expect(invalidationsFor("booking.created")).toEqual(["/bookings", "/floor"]);
    expect(invalidationsFor("booking.arriving")).toEqual(["/bookings", "/floor"]);
  });
  it("keeps floor events on the floor and tickets on both", () => {
    expect(invalidationsFor("table.status_changed")).toEqual(["/floor"]);
    expect(invalidationsFor("ticket.fired")).toEqual(["/open-tickets", "/floor"]);
  });
  it("treats a resync as everything stale and ignores the unknown", () => {
    expect(invalidationsFor("resync")).toEqual(["/"]);
    expect(invalidationsFor("something.else")).toEqual([]);
  });
});
