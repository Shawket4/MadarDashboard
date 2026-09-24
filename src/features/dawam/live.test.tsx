/**
 * Dawam screens stay current: a Dawam read refetches when the tab comes back,
 * once its data is past the app's 30 s staleTime, while every other page keeps
 * the app-wide default of no focus refetch.
 */
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queryClient as appQueryClient } from "@/data/api/query";
import { dawamFilters, dawamQuery, keyUnder } from "./live";

describe("dawamQuery", () => {
  it("turns the focus refetch on and keeps the caller's own options", () => {
    expect(dawamQuery()).toEqual({ refetchOnWindowFocus: true });
    expect(dawamQuery({ enabled: false, refetchInterval: 60_000 })).toEqual({
      refetchOnWindowFocus: true,
      enabled: false,
      refetchInterval: 60_000,
    });
  });

  it("lets a caller turn it back off (the Rules form, for someone who edits it)", () => {
    expect(dawamQuery({ enabled: true, refetchOnWindowFocus: false })).toEqual({
      enabled: true,
      refetchOnWindowFocus: false,
    });
  });
});

describe("keyUnder / dawamFilters", () => {
  it("matches Dawam keys on a path-segment boundary, never the POS staff drinks", () => {
    expect(keyUnder(["/staff/team/presence", { branch_id: "b1" }], ["/staff"])).toBe(true);
    expect(keyUnder(["/staff"], ["/staff"])).toBe(true);
    expect(keyUnder(["/staff-pool/today"], ["/staff"])).toBe(false);
    expect(keyUnder(["/orders"], ["/staff"])).toBe(false);
    expect(keyUnder([42], ["/staff"])).toBe(false);
    expect(keyUnder(["/branches", { org_id: "o" }], ["/staff", "/branches"])).toBe(true);
  });

  it("only takes what is on screen", () => {
    expect(dawamFilters()).toMatchObject({ type: "active" });
  });
});

describe("focus refetch", () => {
  const realNow = Date.now;
  // The app's own defaults (staleTime 30 s, refetchOnWindowFocus false), so a
  // change to them shows up here.
  const client = () => new QueryClient({ defaultOptions: appQueryClient.getDefaultOptions() });

  function Reader({ path, fn, dawam }: { path: string; fn: () => Promise<unknown>; dawam: boolean }) {
    useQuery({ queryKey: [path], queryFn: fn, ...(dawam ? dawamQuery() : {}) });
    return null;
  }

  let visibility: DocumentVisibilityState = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  /** The tab goes to the background, then comes back — TanStack's "focus". */
  const leaveAndComeBack = () =>
    act(() => {
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
      visibility = "visible";
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    });
  const later = (ms: number) => vi.spyOn(Date, "now").mockImplementation(() => realNow() + ms);

  afterEach(() => {
    vi.restoreAllMocks();
    visibility = "visible";
  });

  it("refetches a Dawam read when the tab comes back after 30 s; a page on the app defaults does not", async () => {
    const presence = vi.fn(async () => ({ present: 3 }));
    const orders = vi.fn(async () => []);
    const { unmount } = render(
      <QueryClientProvider client={client()}>
        <Reader path="/staff/team/presence" fn={presence} dawam />
        <Reader path="/orders" fn={orders} dawam={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(presence).toHaveBeenCalledTimes(1);
      expect(orders).toHaveBeenCalledTimes(1);
    });

    later(31_000);
    leaveAndComeBack();

    await waitFor(() => expect(presence).toHaveBeenCalledTimes(2));
    expect(orders).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("leaves data under 30 s old alone (`true`, not `always`)", async () => {
    const flags = vi.fn(async () => []);
    const { unmount } = render(
      <QueryClientProvider client={client()}>
        <Reader path="/staff/flags" fn={flags} dawam />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(flags).toHaveBeenCalledTimes(1));

    later(10_000);
    leaveAndComeBack();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(flags).toHaveBeenCalledTimes(1);
    unmount();
  });
});
