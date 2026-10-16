import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useChangeSignal } from "./hooks";

describe("useChangeSignal", () => {
  it("counts only changes in place, not arrival or departure", () => {
    const { result, rerender } = renderHook(({ v }: { v: string | null }) => useChangeSignal(v), {
      initialProps: { v: null as string | null },
    });
    expect(result.current).toBe(0);
    rerender({ v: "completed" }); // arrived
    expect(result.current).toBe(0);
    rerender({ v: "completed" }); // a refetch, same value
    expect(result.current).toBe(0);
    rerender({ v: "voided" }); // changed in place
    expect(result.current).toBe(1);
    rerender({ v: null }); // gone
    rerender({ v: "completed" }); // back: another arrival
    expect(result.current).toBe(1);
  });
});
