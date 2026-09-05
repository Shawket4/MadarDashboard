/**
 * The dashboard's ONE realtime connection.
 *
 * Every live surface used to open its own stream (the floor board had one; the
 * bookings page would have needed another) and tear it down on navigation, so
 * a manager flipping between pages reconnected each time and nothing was live
 * on the page they were not looking at. This mounts once in the app shell for
 * the selected branch, subscribes to every topic the dashboard reads, and
 * turns events into query invalidations — TanStack refetches, the page shows
 * the truth. Events are nudges, never state.
 *
 * Resume: the last `id:` is sent back as `Last-Event-ID` so a blip replays the
 * gap; a `resync` frame (the server could not cover the gap) invalidates
 * everything. `EventSource` cannot carry an Authorization header, so this
 * reads the framing off a `fetch` body (see `sse.ts`).
 */
import { useEffect } from "react";

import { env } from "@/data/config/env";
import { queryClient } from "@/data/api/query";
import { authHeaders } from "@/data/api/stream-auth";

import { parseSseFrames } from "./sse";

/** Backoff between reconnects: quick at first, then out of the way. */
const RETRY_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;

/** Topics the dashboard consumes; the server intersects with permissions. */
const TOPICS = "floor,tickets,bookings,delivery";

type Listener = (event: string, data: string) => void;
const listeners = new Set<Listener>();

/** Subscribe a page to raw events (rarely needed — prefer query invalidation). */
export function onRealtimeEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const invalidatePrefix = (...prefixes: string[]) =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      prefixes.some((p) => (q.queryKey[0] as string).startsWith(p)),
  });

/** Which queries an event makes stale. Exported for the unit test. */
export function invalidationsFor(event: string): string[] {
  if (event === "resync") return ["/"];
  if (event.startsWith("booking.")) return ["/bookings", "/floor"];
  if (event.startsWith("floor.") || event.startsWith("table.") || event.startsWith("transfer.")) {
    return ["/floor"];
  }
  if (event === "ticket.table_changed") return ["/floor", "/open-tickets"];
  if (event.startsWith("ticket.")) return ["/open-tickets", "/floor"];
  if (event.startsWith("delivery.")) return ["/delivery-orders"];
  if (event.startsWith("kitchen.")) return ["/kitchen"];
  return [];
}

export function useBranchRealtime(branchId: string | null | undefined) {
  useEffect(() => {
    if (!branchId) return;

    const controller = new AbortController();
    let attempt = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastId: string | null = null;

    const dispatch = (event: string, data: string) => {
      const targets = invalidationsFor(event);
      if (targets.length) void invalidatePrefix(...targets);
      for (const fn of listeners) fn(event, data);
    };

    const connect = async () => {
      try {
        const url = `${env.VITE_API_URL}/realtime/stream?branch_id=${encodeURIComponent(branchId)}&topics=${TOPICS}`;
        const headers = authHeaders({ Accept: "text/event-stream" });
        if (lastId) headers["Last-Event-ID"] = lastId;
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
        // A permission or auth failure is terminal until the session changes;
        // hammering the server every second would not fix it.
        attempt = 0;

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const { frames, rest } = parseSseFrames(buffer);
          buffer = rest;
          for (const frame of frames) {
            if (frame.id) lastId = frame.id;
            dispatch(frame.event, frame.data);
          }
        }
      } catch {
        /* Fall through to the retry below; an aborted stream is not an error. */
      }

      if (stopped || controller.signal.aborted) return;
      const wait = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
      attempt += 1;
      timer = setTimeout(() => void connect(), wait);
    };

    void connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [branchId]);
}
