/**
 * Toasts: the ONE place the app raises them (CLAUDE.md, "Toasts").
 *
 * This file is the always-present facade, small enough for every bundle's first
 * paint. The toast library (Sileo, with `motion`) lives in `./sileo.tsx` and is
 * loaded on the first toast, or at idle with `<Toaster preload />`. Calls made
 * before it arrives are queued and replayed in order, so nothing is lost and no
 * bundle pays for the library before it needs it. ESLint refuses `sonner` and
 * `sileo` everywhere else.
 *
 * Messages arrive already translated. The API mirrors sonner's call sites:
 * `toast.success(msg)`, `toast.error(msg, { description, action, id, duration })`.
 */
import { lazy, Suspense, useEffect, useSyncExternalStore, type ComponentType, type ReactNode } from "react";

import i18n from "@/i18n";

export type ToastKind = "success" | "error" | "warning" | "info" | "loading";
export type ToastId = string | number;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** A toast with the id of one on screen replaces it in place (dedupe, loading → done). */
  id?: ToastId;
  description?: ReactNode;
  /** Milliseconds; `Infinity` keeps it until dismissed. Defaults per severity (`DURATIONS`). */
  duration?: number;
  /** One button, e.g. Undo. A toast with an action stays at least `ACTION_MIN_MS`. */
  action?: ToastAction;
}

/** What the implementation is handed: everything resolved, nothing optional that matters. */
export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  description?: ReactNode;
  /** `null` = until dismissed. */
  duration: number | null;
  action?: ToastAction;
}

/** Standard durations per severity, ms. Errors linger: they usually need reading. */
export const DURATIONS: Record<ToastKind, number | null> = {
  success: 4_000,
  info: 5_000,
  warning: 6_000,
  error: 8_000,
  loading: null,
};
export const ACTION_MIN_MS = 10_000;

export interface ToastImpl {
  show: (item: ToastItem) => void;
  dismiss: (id?: string) => void;
  Toaster: ComponentType;
}

/* ------------------------------ the lazy implementation ------------------------------ */

let impl: ToastImpl | null = null;
let loading: Promise<void> | null = null;
let queue: { id?: string; run: (i: ToastImpl) => void }[] = [];
const loadedListeners = new Set<() => void>();

/** Load the implementation (once) and replay what was queued. */
export function loadToasts(): Promise<void> {
  loading ??= import("./sileo").then(
    (m) => {
      impl = m.impl;
      const pending = queue;
      queue = [];
      for (const q of pending) q.run(m.impl);
      for (const l of loadedListeners) l();
    },
    (e: unknown) => {
      loading = null; // a failed chunk load (deploy in between, offline) retries on the next toast
      throw e;
    },
  );
  return loading;
}

function run(id: string | undefined, f: (i: ToastImpl) => void): void {
  if (impl) return f(impl);
  queue.push({ id, run: f });
  void loadToasts().catch(() => {});
}

/* ------------------------------ screen readers ------------------------------ */

// The live regions belong to the facade, so they exist before the first toast
// (a region inserted with its text is often not read) and errors are assertive.
let said = { polite: "", assertive: "", n: 0 };
const saidListeners = new Set<() => void>();
function announce(kind: ToastKind, text: string): void {
  const n = said.n + 1;
  said = kind === "error" || kind === "warning" ? { ...said, assertive: text, n } : { ...said, polite: text, n };
  for (const l of saidListeners) l();
}
const textOf = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number" ? String(node) : "";

/* ------------------------------ the API ------------------------------ */

let seq = 0;
const newId = () => `t${++seq}`;

/** Resolve the caller's options into the item the implementation shows. Pure. */
export function resolveToast(kind: ToastKind, message: string, o: ToastOptions = {}): ToastItem {
  let duration = o.duration === undefined ? DURATIONS[kind] : o.duration;
  if (duration === Infinity || (duration !== null && duration <= 0)) duration = null;
  if (o.action && duration !== null) duration = Math.max(duration, ACTION_MIN_MS);
  return {
    id: o.id === undefined ? newId() : String(o.id),
    kind,
    message,
    description: o.description,
    duration,
    action: o.action,
  };
}

function show(kind: ToastKind, message: string, o?: ToastOptions): string {
  const item = resolveToast(kind, message, o);
  if (impl === null) queue = queue.filter((q) => q.id !== item.id); // dedupe while still queued
  announce(kind, [message, textOf(item.description)].filter(Boolean).join(". "));
  run(item.id, (i) => i.show(item));
  return item.id;
}

type Msg<T> = string | ((value: T) => string);
export interface PromiseMessages<T> {
  loading: string;
  success: Msg<T>;
  error: Msg<unknown>;
}

export const toast = {
  success: (message: string, o?: ToastOptions) => show("success", message, o),
  error: (message: string, o?: ToastOptions) => show("error", message, o),
  warning: (message: string, o?: ToastOptions) => show("warning", message, o),
  info: (message: string, o?: ToastOptions) => show("info", message, o),
  /** sonner's neutral toast; shown as info. */
  message: (message: string, o?: ToastOptions) => show("info", message, o),
  /** Stays until replaced (`{ id }`) or dismissed. */
  loading: (message: string, o?: ToastOptions) => show("loading", message, o),
  /** A failed request, in the words `getErrorMessage` gives it (loaded with the library). */
  apiError: (error: unknown, o?: ToastOptions): string => {
    const id = o?.id === undefined ? newId() : String(o.id);
    void import("@/data/api/errors").then(({ getErrorMessage }) => show("error", getErrorMessage(error), { ...o, id }));
    return id;
  },
  /** Loading, then success or error in the same toast. Returns the promise itself. */
  promise: <T,>(p: Promise<T> | (() => Promise<T>), m: PromiseMessages<T>, o?: ToastOptions): Promise<T> => {
    const id = show("loading", m.loading, o);
    const promise = typeof p === "function" ? p() : p;
    const pick = <V,>(msg: Msg<V>, v: V) => (typeof msg === "function" ? msg(v) : msg);
    promise.then(
      (v) => show("success", pick(m.success, v), { ...o, id }),
      (e: unknown) => show("error", pick(m.error, e), { ...o, id }),
    );
    return promise;
  },
  /** One toast by id, or all of them. */
  dismiss: (id?: ToastId) => {
    const key = id === undefined ? undefined : String(id);
    if (impl === null) queue = key === undefined ? [] : queue.filter((q) => q.id !== key);
    else impl.dismiss(key);
  },
};

/* ------------------------------ the mount point ------------------------------ */

// Rendered only once loaded, so it never suspends in practice.
const LazyToaster = lazy(() => loadToasts().then(() => ({ default: impl!.Toaster })));
const subscribeLoaded = (l: () => void) => (loadedListeners.add(l), () => void loadedListeners.delete(l));
const subscribeSaid = (l: () => void) => (saidListeners.add(l), () => void saidListeners.delete(l));

/**
 * Mount once per entry. Renders the screen-reader regions at once and the
 * toasts once the library has loaded: on the first toast, or at idle with
 * `preload` (the dashboard, where a toast follows most clicks).
 */
export function Toaster({ preload = false }: { preload?: boolean }) {
  const loaded = useSyncExternalStore(subscribeLoaded, () => impl !== null, () => false);
  const s = useSyncExternalStore(subscribeSaid, () => said, () => said);
  useEffect(() => {
    if (!preload) return;
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1_500));
    idle(() => void loadToasts().catch(() => {}));
  }, [preload]);
  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        <span key={s.n}>{s.polite}</span>
      </div>
      <div role="alert" aria-live="assertive" className="sr-only">
        <span key={s.n}>{s.assertive}</span>
      </div>
      {loaded ? (
        <Suspense fallback={null}>
          <LazyToaster />
        </Suspense>
      ) : null}
    </>
  );
}

/* ------------------------------ guest forms (public bundles) ------------------------------ */

/**
 * One toast for the form's error at a time: a new one REPLACES the last, so a
 * customer who taps Submit three times sees one message, not a stack.
 */
export const FORM_ERROR_ID = "public-form-error";

/**
 * Say why a form did not go through where the customer is looking. Every guest
 * form keeps its message in place too (under the field, above the button); on
 * a phone that place is usually off-screen, so the toast carries the same words.
 */
export function toastFormError(message: string, more = false): void {
  toast.error(message, {
    id: FORM_ERROR_ID,
    // Read at call time: raised outside React, in the reader's current language.
    description: more ? i18n.t("publicShell.formErrors.more", "Other fields need attention too.") : undefined,
  });
}

/**
 * Toast an error held in state, each time it is raised. Pages clear their error
 * before a retry, so a second failure with the same words is a new value.
 */
export function useErrorToast(message: string | null | undefined): void {
  useEffect(() => {
    if (message) toastFormError(message);
  }, [message]);
}

/** Test seam: forget the loaded implementation and the queue. */
export function __resetToastsForTests(): void {
  impl = null;
  loading = null;
  queue = [];
  said = { polite: "", assertive: "", n: 0 };
}
