/**
 * The toast implementation: the ONLY file that imports `sileo` (and, for it,
 * `motion`). Loaded lazily by `./index.tsx`; never import it directly.
 * Sileo 0.1.6 itself is patched (patches/sileo+0.1.6.patch, CLAUDE.md "Toasts"):
 * a plain container instead of a <button>, real buttons, Escape, focus, tempo.
 *
 * What this file adds (CLAUDE.md, "Toasts", lists the why):
 * - our tokens (CSS in `./toast.css`), our icons, the reader's direction;
 * - a short severity title in the pill when the message is too long for it
 *   (the pill is one 40 px line), the message then reads in the body;
 * - the body stays open for the toast's whole life (Sileo's default folds it
 *   2 s before the end, and never opens it for a toast with no timeout);
 * - at most `MAX_VISIBLE` toasts (`MAX_VISIBLE_PHONE` on a phone), below a
 *   phone page's sticky header;
 * - the Contact Madar action on refusals that point at Madar;
 * - reduced motion for its springs (Sileo's CSS already stops its transitions).
 */
import type { ReactNode } from "react";
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { MotionConfig } from "motion/react";
import { Toaster as SileoToaster, sileo, type SileoOptions, type SileoState } from "sileo";

import { madarActionFor } from "@/data/api/errors";
import i18n from "@/i18n";
import { Spinner } from "@/components/ui/spinner";

import type { ToastImpl, ToastItem, ToastKind } from "./index";
import "./toast.css";

export const MAX_VISIBLE = 3;
export const MAX_VISIBLE_PHONE = 2;
const PHONE = "(max-width: 639px)";
const isPhone = () => typeof window !== "undefined" && window.matchMedia?.(PHONE).matches === true;

/**
 * On a phone the toasts sit just below the page's sticky header (the shop's
 * name, back, language), never over it. The header's bottom already includes
 * the safe area it pads for. Desktop: the top edge, as the header is short
 * there and the toast lands over empty space beside the search.
 */
function placeBelowHeader(): void {
  if (!root) return;
  let bottom = 0;
  if (isPhone())
    for (const h of document.querySelectorAll("header")) {
      const cs = getComputedStyle(h);
      const r = h.getBoundingClientRect();
      if ((cs.position === "sticky" || cs.position === "fixed") && r.top <= 0.5 && r.height > 0) bottom = Math.max(bottom, r.bottom);
    }
  root.style.setProperty("--toast-header", `${Math.round(bottom)}px`);
}
/** Top centre on every screen: clear of the phone's thumb zone and of the dashboard's side panels. */
const POSITION = "top-center" as const;
/** Longest message that still fits the pill on one line (350 px, 13 px type). */
export const PILL_CHARS = 36;
const CONTACT_MS = 12_000;
/** "Until dismissed": Sileo only opens the body of a toast with a timeout. 24 h. */
const FOREVER_MS = 86_400_000;

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CircleCheckIcon aria-hidden className="size-4" />,
  error: <OctagonXIcon aria-hidden className="size-4" />,
  warning: <TriangleAlertIcon aria-hidden className="size-4" />,
  info: <InfoIcon aria-hidden className="size-4" />,
  loading: <Spinner />,
};

const TITLES: Record<ToastKind, () => string> = {
  success: () => i18n.t("toast.title.success", "Done"),
  error: () => i18n.t("toast.title.error", "Error"),
  warning: () => i18n.t("toast.title.warning", "Heads up"),
  info: () => i18n.t("toast.title.info", "Note"),
  loading: () => i18n.t("toast.title.loading", "Working…"),
};

/** Map one resolved item to Sileo's options. Pure; exported for the tests. */
export function toSileo(item: ToastItem): SileoOptions & { id: string } {
  let { action, duration } = item;
  if (item.kind === "error" && !action) {
    const href = madarActionFor(item.message);
    if (href) {
      action = {
        label: i18n.t("errors.contact", "Contact Madar"),
        onClick: () => void window.open(href, "_blank", "noopener,noreferrer"),
      };
      if (duration !== null) duration = Math.max(duration, CONTACT_MS);
    }
  }
  const fits = item.message.length <= PILL_CHARS;
  const description =
    fits ? item.description : (
      <>
        <span data-toast-message>{item.message}</span>
        {item.description ? <span data-toast-detail>{item.description}</span> : null}
      </>
    );
  const hasBody = Boolean(description) || Boolean(action);
  const life = duration ?? (hasBody ? FOREVER_MS : null);
  return {
    id: item.id,
    type: item.kind as SileoState,
    // Per toast: Sileo reads the Toaster's position only once it has mounted,
    // and the first toast (replayed from the queue) arrives before that.
    position: POSITION,
    title: fits ? item.message : TITLES[item.kind](),
    description: description || undefined,
    duration: life,
    icon: ICONS[item.kind],
    closeLabel: i18n.t("toast.close", "Dismiss"),
    // As sonner did: the action answers the toast, so it goes.
    button: action ? { title: action.label, onClick: () => (action.onClick(), sileo.dismiss(item.id)) } : undefined,
    // Open at once and stay open to the end (Sileo clamps collapse to the duration).
    autopilot: hasBody && life !== null ? { expand: 0, collapse: life } : false,
  };
}

// Newest last. Older ids may already be gone; dismissing one is then a no-op.
let order: string[] = [];

export const impl: ToastImpl = {
  show(item) {
    order = [...order.filter((id) => id !== item.id), item.id];
    const max = isPhone() ? MAX_VISIBLE_PHONE : MAX_VISIBLE;
    while (order.length > max) sileo.dismiss(order.shift()!);
    placeBelowHeader();
    sileo.show(toSileo(item));
  },
  dismiss(id) {
    if (id === undefined) {
      order = [];
      sileo.clear();
      return;
    }
    order = order.filter((x) => x !== id);
    sileo.dismiss(id);
  },
  Toaster,
};

let root: HTMLDivElement | null = null;

function Toaster() {
  return (
    <div
      ref={(el) => {
        root = el;
        placeBelowHeader(); // the first toast, replayed from the queue, renders in this very commit
      }}
      data-madar-toaster
    >
      <MotionConfig reducedMotion="user">
        <SileoToaster position={POSITION} />
      </MotionConfig>
    </div>
  );
}
