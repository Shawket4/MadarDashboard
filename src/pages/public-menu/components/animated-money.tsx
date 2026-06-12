import { fmtMoney } from "@/shared/lib/format";
import { useAnimatedValue } from "../hooks/use-animated-value";

/** fmtMoney wrapped in a rAF roll (honours reduced motion via the hook). */
export function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  const display = useAnimatedValue(value);
  return <span className={className}>{fmtMoney(display)}</span>;
}
