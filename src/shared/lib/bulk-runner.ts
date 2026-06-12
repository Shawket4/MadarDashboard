export interface RunBulkOptions {
  /** Max operations in flight at once. */
  concurrency?: number;
  /** Called after every settled row — drives progress UI. */
  onProgress?: (done: number, total: number, lastError?: unknown) => void;
}

export interface RunBulkResult<T> {
  ok: T[];
  failed: { row: T; error: unknown }[];
}

/**
 * Fan a mutation out over many rows with bounded concurrency.
 * One failing row never aborts the rest — the summary separates
 * successes from failures so the caller can offer "retry failed".
 */
export async function runBulk<T>(
  rows: T[],
  op: (row: T) => Promise<unknown>,
  { concurrency = 4, onProgress }: RunBulkOptions = {},
): Promise<RunBulkResult<T>> {
  const ok: T[] = [];
  const failed: { row: T; error: unknown }[] = [];
  const total = rows.length;
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next];
      next += 1;
      try {
        await op(row);
        ok.push(row);
        done += 1;
        onProgress?.(done, total);
      } catch (error) {
        failed.push({ row, error });
        done += 1;
        onProgress?.(done, total, error);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, rows.length)) }, worker),
  );

  return { ok, failed };
}
