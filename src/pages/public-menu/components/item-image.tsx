import { memo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { getMonogram } from "../lib/menu-format";

interface Props {
  src?: string | null;
  name: string;
  className?: string;
  /** Whether to show an animated skeleton while loading */
  skeleton?: boolean;
}

/** Image with graceful fallback: skeleton on load, monogram avatar on error. */
export const ItemImage = memo(function ItemImage({ src, name, className, skeleton = true }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  if (!src || status === "error") {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-[#EEF2F7] to-[#DDE4ED]", className)}>
        <span className="text-[#0A2540]/30 font-bold select-none" style={{ fontSize: "clamp(1.5rem, 8cqw, 3rem)" }}>
          {getMonogram(name)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {skeleton && status === "loading" && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={name}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
});
