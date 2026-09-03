/**
 * The Basira wire contract.
 *
 * Hand-written rather than taken from the Orval output, deliberately: the
 * streaming endpoint is `text/event-stream` and has no generated client, and
 * the two would drift if half the contract came from one place and half from
 * another. These mirror `src/ai/handlers.rs`, `src/ai/stream.rs` and
 * `src/analytics/types.rs` — when the backend changes, this file is the one to
 * change with it.
 */

/** How a result column should be formatted. Mirrors `analytics::types::ColumnKind`. */
export type ColumnKind = "money" | "count" | "label" | "date" | "number" | "minutes";

/** The shape of a result, derived from its grouping. Mirrors `Grain`. */
export type Grain = "scalar" | "series" | "categorical" | "table";

/** How to draw it. Mirrors `Viz`, minus `auto` — the server always resolves it. */
export type Viz =
  | "kpi"
  | "line"
  | "area"
  | "bar"
  | "row"
  | "pie"
  | "donut"
  | "table"
  | "heatmap";

export interface Column {
  key: string;
  label: string;
  kind: ColumnKind;
}

/** Which branches an answer covers. Mirrors `analytics::scope::ScopeInfo`. */
export interface ScopeInfo {
  all_branches: boolean;
  branches: string[];
  label: string;
  /** Set when a branch was named but not matched — the answer fell back. */
  unmatched_branch?: string;
}

/** One dataset the assistant pulled. Mirrors `ai::handlers::ResultBlock`. */
export interface ResultBlock {
  title?: string;
  preset_id?: string;
  /** The exact query that produced this — a valid widget definition as-is. */
  spec: QuerySpec;
  columns: Column[];
  rows: Record<string, string | number | null>[];
  row_count: number;
  truncated: boolean;
  grain: Grain;
  viz: Viz;
  facet_by?: string;
  scope: ScopeInfo;
  period_from?: string;
  period_to?: string;
}

/** Mirrors `analytics::spec::QuerySpec`. Only the fields the UI reads. */
export interface QuerySpec {
  dataset: string;
  dimensions?: string[];
  measures?: string[];
  filters?: Record<string, string>;
  period?: { preset?: string; from?: string; to?: string };
  sort?: { measure: string; dir: "asc" | "desc" };
  limit?: number;
  compare?: "none" | "previous_period" | "previous_year";
  viz?: string;
  branch?: string;
}

/** How a turn ended. Mirrors the tagged union on `AiChatResponse`. */
export type TurnKind =
  | { kind: "answer"; text: string; results: ResultBlock[] }
  | { kind: "clarify"; question: string }
  | { kind: "incomplete"; text: string; results: ResultBlock[] };

export type ChatResponse = TurnKind & {
  conversation_id?: string;
  provider: string;
  timezone: string;
};

/** A frame from `POST /ai/chat/stream`. Mirrors `ai::stream::ChatFrame`. */
export type ChatFrame =
  | { event: "started"; conversation_id: string | null }
  | { event: "thinking"; step: number }
  | { event: "querying"; title?: string; dataset: string }
  | { event: "result"; block: ResultBlock }
  | { event: "answer"; response: ChatResponse }
  | { event: "error"; message: string };

/** A stored conversation in the list. Mirrors `ai::store::ConversationSummary`. */
export interface ConversationSummary {
  id: string;
  title: string;
  turn_count: number;
  last_turn_at?: string;
  created_at: string;
  /** True once older turns have been folded into a summary. */
  compacted: boolean;
}

/** One stored exchange. Mirrors `ai::store::StoredTurn`. */
export interface StoredTurn {
  id: string;
  seq: number;
  question: string;
  answer?: string;
  kind: "answer" | "clarify" | "incomplete";
  /** `[{title, preset_id, spec}]` — the queries, never the rows. */
  specs: { title?: string | null; preset_id?: string | null; spec: QuerySpec }[];
  provider?: string;
  created_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  /** The running summary of everything before the verbatim window. */
  condensed?: string;
  turns: StoredTurn[];
}

/**
 * What the page renders: a question and whatever came back for it.
 *
 * Deliberately not the same type as `StoredTurn`. A turn being streamed has
 * partial state a stored one never has — results arriving before the text,
 * a step counter, an error — and collapsing the two would mean every render
 * path checking for fields that only exist mid-flight.
 */
export interface Exchange {
  id: string;
  question: string;
  /** Present once the turn finished. */
  answer?: string;
  kind?: StoredTurn["kind"];
  results: ResultBlock[];
  /** Set while streaming: which step the loop is on. */
  step?: number;
  /** Set while streaming: what it is querying right now. */
  querying?: string;
  error?: string;
  /** True until a terminal frame arrives. */
  pending: boolean;
  /** Restored from history rather than streamed — no results to render. */
  fromHistory?: boolean;
}
