/**
 * The toast implementation: the ONLY file that imports `sileo` (and, for it,
 * `motion`). Loaded lazily by `./index.tsx`; never import it directly.
 *
 * What it adds over Sileo 0.1.6 (CLAUDE.md, "Toasts", lists the why):
 * - our tokens (CSS in `./toast.css`), our icons, the reader's direction;
 * - a short severity title in the pill when the message is too long for it
 *   (the pill is one 40 px line), the message then reads in the body;
 * - the body stays open for the toast's whole life (Sileo's default folds it
 *   2 s before the end, and never opens it for a toast with no timeout);
 * - at most `MAX_VISIBLE` toasts; tapping or pressing a toast dismisses it;
 * - the Contact Madar action on refusals that point at Madar;
 * - reduced motion for its springs (Sileo's CSS already stops its transitions);
 * - screen readers: the facade owns the live regions, so Sileo's own region is
 *   silenced and its decorative SVG (titled "sileo notification") hidden.
 */
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { MotionConfig } from "motion/react";
import { Toaster as SileoToaster, sileo, type SileoOptions, type SileoState } from "sileo";

import { madarActionFor } from "@/data/api/errors";
import i18n from "@/i18n";
import { Spinner } from "@/components/ui/spinner";

import type { ToastImpl, ToastItem, ToastKind } from "./index";
import "./toast.css";

export const MAX_VISIBLE = 3;
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
    while (order.length > MAX_VISIBLE) sileo.dismiss(order.shift()!);
    // `id` is read by Sileo's store, though 0.1.6's types leave it out.
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

/** Sileo's toast id, from the id of its gooey filter (`sileo-gooey-<id>`). */
const idOf = (toastEl: Element): string | undefined =>
  toastEl.querySelector("filter[id^='sileo-gooey-']")?.id.slice("sileo-gooey-".length);

function Toaster() {
  const ref = useRef<HTMLDivElement>(null);

  // Sileo renders an aria-live region of its own and an SVG titled
  // "sileo notification"; the facade already announces each toast.
  // ponytail: patched in the DOM because Sileo 0.1.6 has no props for these; drop when upstream does.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const quiet = () => {
      for (const el of root.querySelectorAll("[data-sileo-viewport]:not([aria-live='off'])")) el.setAttribute("aria-live", "off");
      for (const el of root.querySelectorAll("[data-sileo-svg]:not([aria-hidden])")) el.setAttribute("aria-hidden", "true");
      // The action is an <a href="#"> that acts as a button: say so.
      for (const el of root.querySelectorAll("a[data-sileo-button]:not([role])")) el.setAttribute("role", "button");
    };
    quiet();
    const mo = new MutationObserver(quiet);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // A press on the toast (not its button) dismisses it, by mouse, touch or keyboard.
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element;
    if (t.closest("[data-sileo-button]")) return;
    const el = t.closest("[data-sileo-toast]");
    const id = el && idOf(el);
    if (id) impl.dismiss(id);
  };

  return (
    // Each toast is a <button>, so Enter and Space arrive here as clicks.
    <div ref={ref} data-madar-toaster onClick={onClick}>
      <MotionConfig reducedMotion="user">
        <SileoToaster position={POSITION} offset={{ top: "env(safe-area-inset-top, 0px)" }} />
      </MotionConfig>
    </div>
  );
}
