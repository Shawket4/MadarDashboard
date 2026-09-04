/**
 * Live floor updates over the branch event stream.
 *
 * The old board polled every 10 seconds. That is both too slow and too much: a
 * host watching for a table to free up sees it up to ten seconds late, while a
 * quiet room re-fetches five queries a minute forever.
 *
 * The backend has published these events since the floor module was written —
 * `floor.layout_changed`, `table.status_changed`, `held_order.changed`,
 * `transfer.changed` — on a permission-filtered per-branch stream. Nothing in
 * the dashboard consumed it.
 *
 * `EventSource` cannot carry an `Authorization` header and the stream is
 * header-authenticated, so this reads the SSE framing off a `fetch` body, the
 * same way Basira reads a streamed answer.
 *
 * What arrives is a nudge, not a payload: every event invalidates the relevant
 * queries and lets TanStack refetch. Trusting an event's body would mean two
 * paths into the same state, and the one used less often is the one that rots.
 */
import { useEffect, useRef } from "react";

import { env } from "@/data/config/env";
import { authHeaders } from "@/data/api/stream-auth";
import { invalidateFloor, invalidateOccupants } from "./util";

/** Backoff between reconnects: quick at first, then out of the way. */
const RETRY_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;

export interface FloorRealtime {
  /** Called when the layout itself changed under us (geometry moved). */
  onLayoutChanged?: () => void;
}

export function useFloorRealtime(branchId: string | null, opts: FloorRealtime = {}) {
  // Held in a ref so a changing callback never tears down the stream: a
  // reconnect on every render would be worse than no stream at all.
  const onLayout = useRef(opts.onLayoutChanged);
  useEffect(() => {
    onLayout.current = opts.onLayoutChanged;
  }, [opts.onLayoutChanged]);

  useEffect(() => {
    if (!branchId) return;

    const controller = new AbortController();
    let attempt = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handle = (event: string) => {
      if (event === "floor.layout_changed") {
        void invalidateFloor();
        onLayout.current?.();
      } else if (event === "table.status_changed") {
        void invalidateFloor();
      } else if (event === "held_order.changed" || event === "ticket.table_changed") {
        void invalidateOccupants();
      } else if (event === "transfer.changed") {
        void invalidateFloor();
      }
    };

    const connect = async () => {
      try {
        const url = `${env.VITE_API_URL}/realtime/stream?branch_id=${encodeURIComponent(branchId)}&topics=floor,tickets`;
        const res = await fetch(url, {
          headers: authHeaders({ Accept: "text/event-stream" }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

        // Connected: reset the backoff so a long-lived stream that eventually
        // drops reconnects promptly rather than at the last slow interval.
        attempt = 0;

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;

          // SSE frames are separated by a blank line. Keep the trailing partial
          // frame in the buffer — a chunk boundary lands mid-frame routinely.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const name = frame
              .split("\n")
              .find((line) => line.startsWith("event:"))
              ?.slice(6)
              .trim();
            if (name) handle(name);
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
