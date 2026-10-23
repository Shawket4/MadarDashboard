/**
 * The wait before a code may be sent again: seconds left, ticking, and how
 * they read. Sign-up's and the loyalty sign-up's "Send the code again".
 */
import { useEffect, useState } from "react";

/** Seconds left until `until` (epoch ms), ticking once a second; 0 when null or past. */
export function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
}

/** `m:ss`, the resend countdown. */
export const clock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
