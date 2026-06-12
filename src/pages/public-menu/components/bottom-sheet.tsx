import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
  maxHeightClass?: string;
}

export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  children,
  maxHeightClass = "max-h-[92dvh]",
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ startY: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = window.setTimeout(() => setMounted(false), 350);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { startY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !panelRef.current) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    panelRef.current.style.transition = "none";
    panelRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!drag.current || !panelRef.current) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    drag.current = null;
    panelRef.current.style.transition = "";
    panelRef.current.style.transform = "";
    if (dy > 88) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={cn(
          "relative w-full sm:max-w-md bg-white rounded-t-[28px] shadow-2xl flex flex-col",
          maxHeightClass,
          "transition-transform duration-[340ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ willChange: "transform" }}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex justify-center pt-[10px] pb-2 cursor-grab touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="w-10 h-[5px] rounded-full bg-neutral-200" />
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}
