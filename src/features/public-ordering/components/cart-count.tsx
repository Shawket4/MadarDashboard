import { useRef } from "react";

import { usePop } from "@/lib/motion";

import { useGrowSignal } from "@/features/public-shell/motion";

/** The basket's item count: it pops each time something is added. */
export function CartCount({ count, className }: { count: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  usePop(ref, useGrowSignal(count));
  return (
    <span ref={ref} className={className}>
      {count}
    </span>
  );
}
