/**
 * The business's pay-period start day (1–28, `period_start_day`): with 26, a
 * pay period runs 26th → 25th. The quick ranges ("this pay period") read it,
 * so a report or the attendance list opens on the month payroll will pay.
 */
import { useGetAttendanceSettings } from "@/data/api/generated/api";

export function usePeriodStartDay(enabled = true): number {
  const q = useGetAttendanceSettings({}, { query: { enabled, staleTime: 60_000 } });
  const day = q.data?.period_start_day;
  // As the server (madar_dawam::pay::period_window): a start day past 28 is the 28th.
  return typeof day === "number" && day >= 1 ? Math.min(Math.trunc(day), 28) : 1;
}
