import { describe, expect, it } from "vitest";
import { runBulk } from "../bulk-runner";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("runBulk", () => {
  it("runs every row and reports successes", async () => {
    const seen: number[] = [];
    const result = await runBulk([1, 2, 3], async (n) => {
      seen.push(n);
    });
    expect(seen.sort()).toEqual([1, 2, 3]);
    expect(result.ok).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
  });

  it("does not abort on failures and separates them in the summary", async () => {
    const result = await runBulk([1, 2, 3, 4], async (n) => {
      if (n % 2 === 0) throw new Error(`boom ${n}`);
    });
    expect(result.ok).toEqual([1, 3]);
    expect(result.failed.map((f) => f.row)).toEqual([2, 4]);
    expect((result.failed[0].error as Error).message).toBe("boom 2");
  });

  it("bounds concurrency", async () => {
    let inFlight = 0;
    let peak = 0;
    await runBulk(
      Array.from({ length: 12 }, (_, i) => i),
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await tick();
        await tick();
        inFlight -= 1;
      },
      { concurrency: 4 },
    );
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });

  it("reports progress including the last error", async () => {
    const progress: Array<{ done: number; total: number; err: boolean }> = [];
    await runBulk(
      [1, 2],
      async (n) => {
        if (n === 2) throw new Error("x");
      },
      {
        concurrency: 1,
        onProgress: (done, total, lastError) => progress.push({ done, total, err: !!lastError }),
      },
    );
    expect(progress).toEqual([
      { done: 1, total: 2, err: false },
      { done: 2, total: 2, err: true },
    ]);
  });

  it("handles an empty row list", async () => {
    const result = await runBulk([], async () => {});
    expect(result.ok).toEqual([]);
    expect(result.failed).toEqual([]);
  });
});
