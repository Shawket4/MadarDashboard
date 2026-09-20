import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLoadMore } from "./use-load-more";

describe("useLoadMore", () => {
  it("widens a page at a time, up to the ceiling", () => {
    const { result } = renderHook(() => useLoadMore({ resetKey: "", pageSize: 50, max: 120 }));
    expect(result.current.limit).toBe(50);
    expect(result.current.props(50, false).hasMore).toBe(true);
    expect(result.current.props(49, false).hasMore).toBe(false);
    act(() => result.current.props(50, false).onLoadMore());
    expect(result.current.limit).toBe(100);
    act(() => result.current.props(100, false).onLoadMore());
    expect(result.current.limit).toBe(120);
    expect(result.current.props(120, true)).toMatchObject({ hasMore: false, loading: true });
  });

  it("starts over when the search changes", () => {
    const { result, rerender } = renderHook(({ q }) => useLoadMore({ resetKey: q, pageSize: 50, max: 500 }), {
      initialProps: { q: "" },
    });
    act(() => result.current.props(50, false).onLoadMore());
    expect(result.current.limit).toBe(100);
    rerender({ q: "sara" });
    expect(result.current.limit).toBe(50);
  });
});
