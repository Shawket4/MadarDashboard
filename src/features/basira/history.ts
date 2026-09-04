/**
 * Rebuilding a turn's charts from what was stored with it.
 *
 * A stored query keeps two things: the `spec` that answered, and a `snapshot`
 * of what it returned. This maps the snapshot back onto the same `ResultBlock`
 * shape a live turn produces, so history renders through exactly the same
 * components as a fresh answer.
 *
 * That sameness is the point. A separate "historical" renderer would be a
 * second place for formatting rules to live, and the first time it drifted, a
 * stored chart would disagree with the live one it was copied from — which is
 * indistinguishable, to the person reading it, from the data having changed.
 */
import type { ResultBlock, StoredQuery, StoredTurn } from "./types";

/** Everything renderable in a stored turn, oldest query first. */
export function blocksFromStoredTurn(turn: StoredTurn): ResultBlock[] {
  return turn.specs.map(blockFromStoredQuery).filter((b): b is ResultBlock => b !== null);
}

/**
 * `null` for a query with no snapshot.
 *
 * Turns written before snapshots existed have only a spec. Rendering an empty
 * chart for those would look like a query that returned nothing, which is a
 * different and much worse claim than "this was not kept" — so they are omitted
 * and the prose stands alone, exactly as it did before.
 */
function blockFromStoredQuery(stored: StoredQuery): ResultBlock | null {
  const snap = stored.snapshot;
  if (!snap) return null;

  return {
    title: stored.title ?? undefined,
    preset_id: stored.preset_id ?? undefined,
    spec: stored.spec,
    columns: snap.columns ?? [],
    rows: snap.rows ?? [],
    row_count: snap.row_count ?? snap.rows?.length ?? 0,
    truncated: Boolean(snap.truncated),
    grain: snap.grain,
    viz: snap.viz,
    facet_by: snap.facet_by ?? undefined,
    scope: snap.scope,
    period_from: snap.period_from ?? undefined,
    period_to: snap.period_to ?? undefined,
  };
}
