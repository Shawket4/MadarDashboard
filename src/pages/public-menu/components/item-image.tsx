import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { MissingItemThumb } from "./missing-item-thumb";
import type { ThumbVariant } from "../lib/types";

/**
 * Lazy image with a typographic fallback. Fixed aspect via the caller's sizing
 * className (avoids CLS); fades in on load. `priority` opts a small number of
 * above-the-fold images (logo, hero) into eager/high-priority loading.
 */
export const ItemImage = memo(function ItemImage({
  src,
  alt,
  className,
  fallbackName,
  fallbackVariant = "card",
  disableFade = false,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackName?: string;
  fallbackVariant?: ThumbVariant;
  disableFade?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    // Already cached/complete → mark loaded so we don't flash the placeholder.
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  if (!src || failed) {
    if (fallbackName) {
      return <MissingItemThumb name={fallbackName} variant={fallbackVariant} className={className} />;
    }
    return <div className={cn("relative overflow-hidden bg-slate-100", className)} />;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "h-full w-full object-cover",
          disableFade
            ? "opacity-100"
            : cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0"),
        )}
      />
    </div>
  );
});
