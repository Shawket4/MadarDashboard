import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useListSearch } from "./use-list-search";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useListSearch", () => {
  it("hands the server the typed text trimmed, once it settles", () => {
    const { result } = renderHook(() => useListSearch(300));
    act(() => result.current.setSearch(" sa"));
    act(() => result.current.setSearch(" sara "));
    expect(result.current.search).toBe(" sara ");
    expect(result.current.q).toBe("");
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.q).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.q).toBe("sara");
  });
});
