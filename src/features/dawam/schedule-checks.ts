/**
 * What the schedule can say BEFORE a day is saved (owner ask: "less prone to
 * user error"). The server stays the judge — it refuses an overlap and adds
 * the labour warnings — but a manager should see the clash while choosing,
 * not after a refusal toast.
 *
 * Times are the branch's wall clock, "HH:MM" or "HH:MM:SS". An end at or
 * before its start runs into the next day (the server's own rule).
 */

export interface TimedBlock {
  /** What the manager reads: the shift's name. */
  name: string;
  start: string;
  end: string;
  /** Where it is worked; a block at another branch clashes the same way. */
  branchId?: string;
}

/** "09:30" / "09:30:00" → 570. NaN for anything else. */
export const toMinutes = (hhmm: string): number => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
};

/** Ends the next day: the end is at or before the start. */
export const crossesMidnight = (start: string, end: string): boolean => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return Number.isFinite(s) && Number.isFinite(e) && e <= s;
};

/** [start, end) in minutes from the day's midnight; an overnight end goes past 1440. */
export const spanOf = (start: string, end: string): [number, number] | null => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
  return [s, e <= s ? e + 1440 : e];
};

/** How long a block runs, in minutes (overnight included). */
export const lengthOf = (start: string, end: string): number => {
  const span = spanOf(start, end);
  return span ? span[1] - span[0] : 0;
};

/** Every pair of blocks on one date whose times overlap, in the order given. */
export function overlapsOf(blocks: TimedBlock[]): [TimedBlock, TimedBlock][] {
  const out: [TimedBlock, TimedBlock][] = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = spanOf(blocks[i].start, blocks[i].end);
      const b = spanOf(blocks[j].start, blocks[j].end);
      if (a && b && a[0] < b[1] && b[0] < a[1]) out.push([blocks[i], blocks[j]]);
    }
  }
  return out;
}

/** The blocks that clash with `next` if it were added to `day`. */
export const clashesWith = (day: TimedBlock[], next: TimedBlock): TimedBlock[] =>
  overlapsOf([next, ...day]).filter(([a]) => a === next).map(([, b]) => b);
