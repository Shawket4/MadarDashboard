/**
 * The counter page's decisions that are not the shared rules: when a captured
 * string is ready to look up, how a card's stamps are drawn, what a failed
 * request means for the person at the counter, and the scanner that types
 * with no field focused. What a string IS comes from madar-shared
 * (`classifyScan`); how many stamps a visit earns and what completing a card
 * deducts is the server's.
 */
import { AxiosError } from "axios";

import type { MemberView } from "@/data/api/generated/models";
import { isPlanRefusal } from "@/data/api/errors";
import { HEX, luminance } from "@/features/public-shell/brand-color";
import { classifyScan } from "@/lib/scan";

/** The counter's most items in one visit (the server's `counter::MAX_ITEMS`). */
export const MAX_ITEMS = 50;

export type LookupBy = { token: string } | { phone: string } | { customer_id: string };

/**
 * A whole card token looks itself up as soon as it is complete (a wedge
 * scanner types it and often sends no Enter). A phone waits for Enter or the
 * button: "0100123456" is already a plausible number one digit before the
 * person has finished typing.
 */
export function readyToLookUp(raw: string, submitted: boolean): LookupBy | null {
  const s = classifyScan(raw);
  if (s.kind === "token") return { token: s.value };
  if (s.kind === "phone" && submitted) return { phone: s.value };
  return null;
}

/** The dots a card shows: filled up to its size; stamps past it are the next card's. */
export function cardDots(balance: number, size: number): { filled: number; size: number; extra: number } {
  const n = Math.max(0, size);
  const b = Math.max(0, balance);
  return { filled: Math.min(b, n), size: n, extra: Math.max(0, b - n) };
}

export const clampItems = (n: number): number => Math.min(MAX_ITEMS, Math.max(1, Math.trunc(n) || 1));

/**
 * One stamp track on a card: what it is called, how far along it is, and
 * whether it can be completed now. Today a card has exactly one track (the
 * programme's); the card is drawn from a list so a card with 2-4 tracks
 * (each with its own name and its own Complete button) needs no new layout.
 */
export interface Track {
  id: string;
  /** The stamp track (1–4); the counter's redeem takes it for 2–4. */
  position: number;
  /** Null for the card's only track: the card's own name says it. */
  name: string | null;
  filled: number;
  size: number;
  /** Stamps already past a full card (they carry over to the next one). */
  extra: number;
  canRedeem: boolean;
}

/**
 * The member's tracks, as the server's view describes them: one (the card's
 * balance) unless `MemberView.tracks` names several, each with its own size.
 */
export function tracksOf(m: MemberView, arabic = false): Track[] {
  if (!m.tracks || m.tracks.length < 2) {
    return [{ id: "card", position: 1, name: null, ...cardDots(m.balance, m.next_reward_cost), canRedeem: m.can_redeem }];
  }
  return m.tracks.map((tr) => ({
    id: tr.position === 1 ? "card" : `track-${tr.position}`,
    position: tr.position,
    name: (arabic ? tr.name_ar || tr.name_en : tr.name_en || tr.name_ar) || null,
    ...cardDots(tr.balance, tr.size),
    canRedeem: tr.can_redeem,
  }));
}

/** Past this many steps a card is drawn as a bar (the wallet strip's own cap). */
export const MAX_SEGMENTS = 12;

/**
 * The card's colours: the shop's wallet colours when they are sound hex,
 * else the Rewards ink card. The present on it is paper on a dark ground and
 * ink on a light one, by the design system's 0.4 luminance rule.
 */
export function cardColors(brand?: { background_color?: string; foreground_color?: string; accent_color?: string } | null) {
  const ok = (c: string | undefined): c is string => !!c && HEX.test(c);
  const bg = ok(brand?.background_color) ? brand.background_color : "#14181E";
  const fg = ok(brand?.foreground_color) ? brand.foreground_color : "#EFF3F4";
  const accent = ok(brand?.accent_color) ? brand.accent_color : fg;
  return { bg, fg, accent, dark: luminance(bg) < 0.4 };
}

/** What a failed request means at the counter: each kind has its own screen state. */
export type Failure =
  | { kind: "expired" }
  | { kind: "offline" }
  | { kind: "notMember" }
  | { kind: "giftNone" }
  | { kind: "notAllowed"; plan: boolean }
  | { kind: "other" };

/** The codes that mean "this shop cannot stamp here", not "try again". */
const NOT_ALLOWED = new Set(["LOYALTY_PROGRAM_OFF", "LOYALTY_COUNTER_STAMPS_ONLY"]);

export function failureOf(e: unknown): Failure {
  if (!(e instanceof AxiosError)) return { kind: "other" };
  if (!e.response) return { kind: "offline" };
  const status = e.response.status;
  const code = (e.response.data as { code?: unknown } | undefined)?.code;
  if (status === 401) return { kind: "expired" };
  if (code === "LOYALTY_GIFT_NONE") return { kind: "giftNone" };
  if (isPlanRefusal(code)) return { kind: "notAllowed", plan: true };
  if (typeof code === "string" && NOT_ALLOWED.has(code)) return { kind: "notAllowed", plan: false };
  if (status === 404) return { kind: "notMember" };
  return { kind: "other" };
}

/**
 * A card reader ("wedge") types the code as keystrokes, fast, often with no
 * field focused. Keys that arrive further apart than a person could never
 * type (`WEDGE_GAP_MS`) start over, so stray typing never looks a member up;
 * a whole card token looks up at once, anything else on Enter.
 */
export const WEDGE_GAP_MS = 80;

export interface Wedge {
  buf: string;
  at: number;
}

export function feedWedge(w: Wedge, key: string, now: number): { wedge: Wedge; lookup: LookupBy | null } {
  const buf = now - w.at > WEDGE_GAP_MS ? "" : w.buf;
  if (key === "Enter") return { wedge: { buf: "", at: now }, lookup: buf ? readyToLookUp(buf, true) : null };
  if (key.length !== 1) return { wedge: { buf, at: w.at }, lookup: null };
  const next = buf + key;
  const lookup = readyToLookUp(next, false);
  return { wedge: { buf: lookup ? "" : next, at: now }, lookup };
}

/**
 * The birthday gift as the counter shows it. The server sends it while it is
 * open or was claimed this time, and drops it once it expires; a page left
 * open past `valid_until` (or a claim refused with LOYALTY_GIFT_NONE) reads
 * as expired.
 */
export type GiftState = { status: "open" | "claimed" | "expired"; lastDay: Date };

export function giftState(g: { status: string; valid_until: string } | null | undefined, now = Date.now()): GiftState | null {
  if (!g) return null;
  const until = Date.parse(g.valid_until);
  // `valid_until` is the instant it stops (midnight after the last day): the
  // last usable day is the moment before it.
  const lastDay = new Date(until - 1);
  if (g.status === "claimed") return { status: "claimed", lastDay };
  return { status: g.status === "open" && until > now ? "open" : "expired", lastDay };
}
