import { useRef, type ReactNode } from "react";

import { useChangeSignal, usePop } from "@/lib/motion";

/**
 * Settles its child into place when `value` changes on something already on
 * screen (a request approved, a transfer received), never on first render.
 * Wrap a status pill: <PopOnChange value={status}><StatusPill …/></PopOnChange>
 */
export function PopOnChange({ value, children }: { value: unknown; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  usePop(ref, useChangeSignal(value));
  return (
    <span ref={ref} className="inline-flex">
      {children}
    </span>
  );
}
