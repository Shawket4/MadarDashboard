import { memo, useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { getCatStyle, hexAlpha } from "../lib/category-style";
import { getMonogram } from "../lib/menu-format";
import type { ThumbVariant } from "../lib/types";

/**
 * Typographic fallback used when an item/category has no image (or it fails to
 * load): an accent-tinted gradient with a monogram and the category icon.
 */
export const MissingItemThumb = memo(function MissingItemThumb({
  name,
  className,
  variant = "card",
}: {
  name: string;
  className?: string;
  variant?: ThumbVariant;
}) {
  const style = useMemo(() => getCatStyle(name), [name]);
  const monogram = useMemo(() => getMonogram(name), [name]);
  const Icon = style.icon;

  const monoSize =
    variant === "hero"
      ? "text-6xl sm:text-8xl"
      : variant === "card"
        ? "text-4xl sm:text-5xl"
        : "text-lg";

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${style.bgTop} 0%, ${style.bgBottom} 100%)` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.6) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />

      {variant !== "thumb" && (
        <div
          className={cn(
            "absolute rounded-full pointer-events-none",
            variant === "hero"
              ? "-right-16 -bottom-16 w-64 h-64 border-[4px]"
              : "-right-9 -bottom-9 w-32 h-32 border-[3px]",
          )}
          style={{ borderColor: hexAlpha(style.accent, 0.16) }}
        />
      )}

      {variant === "hero" && (
        <>
          <div
            className="absolute -left-24 -top-24 w-72 h-72 rounded-full border-2 pointer-events-none"
            style={{ borderColor: hexAlpha(style.accent, 0.1) }}
          />
          <div
            className="absolute bottom-6 left-6 right-6 h-px pointer-events-none"
            style={{ background: `linear-gradient(to right, ${hexAlpha(style.accent, 0.25)}, transparent)` }}
          />
        </>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "font-extralight leading-none select-none",
            monoSize,
            variant === "thumb" ? "tracking-wider" : "tracking-[0.15em]",
          )}
          style={{ color: hexAlpha(style.accent, 0.6) }}
        >
          {monogram}
        </span>
      </div>

      {variant !== "thumb" && (
        <div
          className={cn(
            "absolute rounded-full bg-white/85 flex items-center justify-center backdrop-blur-sm shadow-sm",
            variant === "hero" ? "top-4 left-4 h-10 w-10" : "top-2 left-2 h-6 w-6",
          )}
        >
          <Icon
            size={variant === "hero" ? 18 : 11}
            strokeWidth={1.8}
            style={{ color: hexAlpha(style.accent, 0.8) }}
          />
        </div>
      )}
    </div>
  );
});
