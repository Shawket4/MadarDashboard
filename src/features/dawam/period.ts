/**
 * The business's pay-period start day (1–28, `period_start_day`): with 26, a
 * pay period runs 26th → 25th. The quick ranges ("this pay period") read it,
 * so a report or the attendance list opens on the month payroll will pay.
 */
import { useGetAttendanceSettings } from "@/data/api/generated/api";

export function usePeriodStartDay(enabled = true): number {
  const q = useGetAttendanceSettings({}, { query: { enabled, staleTime: 60_000 } });
  const day = q.data?.period_start_day;
  // madar_dawam::pay::period_window (quickRange's wasm call) clamps it to 1–28; it takes a whole number.
  return typeof day === "number" ? Math.trunc(day) : 1;
}
