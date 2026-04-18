import { useEffect, useState } from "react";

/**
 * Returns true after the first client render. Use to avoid hydration flicker
 * on components whose initial render depends on client-only state (theme,
 * localStorage values, media queries, etc.)
 */
export const useMounted = (): boolean => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};
