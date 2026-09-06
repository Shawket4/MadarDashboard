import { useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Sparkles } from "lucide-react";

import { env } from "@/data/config/env";
import { cn } from "@/lib/utils";

/**
 * One step animation, drawn only while it is on screen.
 *
 * The gallery shows sixteen of these at once and each is a running Lottie, so
 * left to itself the picker would keep sixteen render loops alive behind a
 * dialog nobody is looking at. An IntersectionObserver mounts the player when
 * the card scrolls into view and unmounts it when it leaves, and `autoplay`
 * follows the same signal, so the work tracks what is actually visible.
 *
 * The address the API gives is relative, so it is joined with the API base
 * here rather than in every caller.
 */
export function StepPreview({
  url,
  size = 56,
  className,
  play = true,
}: {
  /** Relative animation address from the API, or null for a custom step. */
  url: string | null | undefined;
  size?: number;
  className?: string;
  /** False pauses it — a still first frame is enough in a dense list. */
  play?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el || !url) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [url]);

  return (
    <div
      ref={holder}
      style={{ width: size, height: size }}
      className={cn("shrink-0 overflow-hidden rounded-lg bg-muted", className)}
    >
      {url && visible ? (
        <DotLottieReact
          src={`${env.VITE_API_URL}${url}`}
          loop
          autoplay={play}
          style={{ width: size, height: size }}
        />
      ) : (
        // A custom step has no animation, and an off-screen one draws nothing.
        <div className="grid size-full place-items-center text-muted-foreground/50">
          {!url ? <Sparkles className="size-4" /> : null}
        </div>
      )}
    </div>
  );
}
