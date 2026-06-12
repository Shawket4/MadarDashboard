import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import { haptic } from "../lib/menu-format";

/**
 * Mobile-first modal: full-width sheet anchored to the bottom with
 * drag-to-dismiss; on desktop it becomes a centred, rounded card. Portals to
 * <body>, locks scroll, and closes on ESC / backdrop / downward drag.
 */
export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [animate, setAnimate] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; offset: number } | null>(null);

  // Mount/unmount around the enter/exit transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      setAnimate(false);
      const t = window.setTimeout(() => setMounted(false), 300);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (mounted && open) {
      const id = window.setTimeout(() => setAnimate(true), 16);
      return () => window.clearTimeout(id);
    }
  }, [mounted, open]);

  // Lock body scroll + compensate the scrollbar while mounted.
  useEffect(() => {
    if (!mounted) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mounted]);

  // ESC to close.
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mounted, onClose]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!sheetRef.current) return;
    dragRef.current = { startY: e.clientY, offset: 0 };
    sheetRef.current.style.transition = "none";
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !sheetRef.current) return;
    const delta = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.offset = delta;
    const eased = delta < 40 ? delta : 40 + (delta - 40) * 0.85;
    sheetRef.current.style.transform = `translate3d(0, ${eased}px, 0)`;
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !sheetRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const height = sheetRef.current.getBoundingClientRect().height;
    const shouldClose = dragRef.current.offset > height * 0.22;
    sheetRef.current.style.transition = "";
    sheetRef.current.style.transform = "";
    dragRef.current = null;
    if (shouldClose) {
      haptic("light");
      onClose();
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50 light-theme", !animate && "pointer-events-none")}>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out",
          animate ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "fixed inset-x-0 bottom-0",
          "sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 sm:w-full sm:max-w-2xl",
          "bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col",
          "max-h-[86vh] sm:max-h-[80vh]",
          "transform-gpu will-change-transform",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          animate
            ? "translate-y-0"
            : "translate-y-full sm:translate-y-[calc(100%+1.5rem)] pointer-events-none",
        )}
      >
        {/* Drag handle (mobile only) */}
        <div
          className="absolute top-0 inset-x-0 z-30 sm:hidden flex justify-center pt-3 pb-3 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-1.5 w-11 rounded-full bg-white/70 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
