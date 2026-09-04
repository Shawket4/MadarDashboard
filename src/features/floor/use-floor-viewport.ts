/**
 * The camera over the floor: pan, zoom, and the gestures that drive them.
 *
 * Separated from the canvas because viewport state changes on every frame of a
 * drag, and mixing it with selection and geometry is how the old 899-line
 * editor became hard to reason about.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { distanceBetween, midpointOf, pinchFactor, wheelIntent } from "./gestures";
import {
  EMPTY_VIEW, ZOOM_STEP, boundsOf, clampZoom, fitView, viewRect,
  type GeoItem, type Rect, type Viewport,
} from "./util";

export interface FloorViewport {
  view: Viewport;
  size: { w: number; h: number };
  /** Attach to the scrolling/zooming element (a callback ref). */
  attach: (el: HTMLElement | null) => void;
  /** The world rectangle currently visible — feed straight to `viewBox`. */
  rect: Rect;
  /** Screen (client) point → world point. */
  toWorld: (clientX: number, clientY: number) => { x: number; y: number };
  /** World distance for a screen-pixel delta at the current zoom. */
  screenToWorldDelta: (dx: number, dy: number) => { x: number; y: number };
  zoomBy: (factor: number, anchor?: { x: number; y: number }) => void;
  panBy: (dxScreen: number, dyScreen: number) => void;
  fitTo: (items: GeoItem[]) => void;
  /** True while two fingers are down, so the canvas suppresses drag/marquee. */
  pinching: boolean;
  /**
   * Touch-pinch tracking. Returned rather than wired internally so the canvas
   * can order them against its own drag handling; each `*Down`/`*Move` returns
   * true when the pinch consumed the event and the canvas should stand down.
   */
  trackPointerDown: (e: React.PointerEvent) => boolean;
  trackPointerMove: (e: React.PointerEvent) => boolean;
  trackPointerUp: (e: React.PointerEvent) => void;
}

export function useFloorViewport(): FloorViewport {
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [size, setSize] = useState({ w: 900, h: 600 });
  const [pinching, setPinching] = useState(false);

  const elRef = useRef<HTMLElement | null>(null);
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  /** Live pointers, for the two-finger pinch. */
  const pointers = useRef(new Map<number, { clientX: number; clientY: number }>());
  const pinchRef = useRef<{ dist: number } | null>(null);

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const box = elRef.current?.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: v.x + ((clientX - (box?.left ?? 0)) / v.zoom),
      y: v.y + ((clientY - (box?.top ?? 0)) / v.zoom),
    };
  }, []);

  const screenToWorldDelta = useCallback(
    (dx: number, dy: number) => ({ x: dx / viewRef.current.zoom, y: dy / viewRef.current.zoom }),
    [],
  );

  const zoomBy = useCallback((factor: number, anchor?: { x: number; y: number }) => {
    setView((v) => {
      const zoom = clampZoom(v.zoom * factor);
      if (zoom === v.zoom) return v;
      // Default anchor is the middle of the viewport, so keyboard and button
      // zoom hold the centre while a pinch holds the fingers.
      const a = anchor ?? {
        x: v.x + sizeRef.current.w / (2 * v.zoom),
        y: v.y + sizeRef.current.h / (2 * v.zoom),
      };
      return {
        zoom,
        x: a.x - (a.x - v.x) * (v.zoom / zoom),
        y: a.y - (a.y - v.y) * (v.zoom / zoom),
      };
    });
  }, []);

  const panBy = useCallback((dxScreen: number, dyScreen: number) => {
    setView((v) => ({ ...v, x: v.x + dxScreen / v.zoom, y: v.y + dyScreen / v.zoom }));
  }, []);

  const fitTo = useCallback((items: GeoItem[]) => {
    setView(fitView(boundsOf(items, EMPTY_VIEW), sizeRef.current));
  }, []);

  // ── Element wiring ────────────────────────────────────────────────────────
  //
  // The wheel listener is attached imperatively and NOT passive. React's
  // `onWheel` is registered passively, so `preventDefault()` there is ignored
  // and a trackpad pinch zooms the whole browser page instead of the canvas.
  const attach = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const intent = wheelIntent(e);
      if (intent.kind === "zoom") {
        const box = el.getBoundingClientRect();
        const v = viewRef.current;
        zoomBy(intent.factor, {
          x: v.x + (e.clientX - box.left) / v.zoom,
          y: v.y + (e.clientY - box.top) / v.zoom,
        });
      } else {
        // Two-finger scroll pans, which is what the gesture means everywhere
        // else. The old editor zoomed on it, a notch at a time.
        panBy(intent.dx, intent.dy);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);

    // Stored on the element so the cleanup below can find them again.
    (el as unknown as { __floorCleanup?: () => void }).__floorCleanup = () => {
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [panBy, zoomBy]);

  useEffect(
    () => () => {
      const el = elRef.current as unknown as { __floorCleanup?: () => void } | null;
      el?.__floorCleanup?.();
    },
    [],
  );

  // ── Touch pinch ───────────────────────────────────────────────────────────
  //
  // There is no pinch event for touch; two pointers and their distance ratio
  // are the whole gesture. Exposed as handlers rather than wired internally so
  // the canvas can order them against its own drag handling.
  const trackPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return false;
    pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { dist: distanceBetween(a, b) };
      setPinching(true);
      return true;
    }
    return false;
  }, []);

  const trackPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch" || !pointers.current.has(e.pointerId)) return false;
      pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      if (pointers.current.size !== 2 || !pinchRef.current) return false;

      const [a, b] = [...pointers.current.values()];
      const dist = distanceBetween(a, b);
      const mid = midpointOf(a, b);
      zoomBy(pinchFactor(pinchRef.current.dist, dist), toWorld(mid.clientX, mid.clientY));
      pinchRef.current = { dist };
      return true;
    },
    [toWorld, zoomBy],
  );

  const trackPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      pinchRef.current = null;
      setPinching(false);
    }
  }, []);

  return {
    view,
    size,
    attach,
    rect: viewRect(view, size),
    toWorld,
    screenToWorldDelta,
    zoomBy,
    panBy,
    fitTo,
    pinching,
    trackPointerDown,
    trackPointerMove,
    trackPointerUp,
  };
}

export { ZOOM_STEP };
