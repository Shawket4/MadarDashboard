/**
 * The stamp tracks form: its values, the body `PUT /loyalty/tracks` takes, and
 * the checks. The rules are madar-card's (`tracks_validate` in the `card`
 * package, the server's own crate); the form only adds the empty-field shapes.
 */
import type { TFunction } from "i18next";
import { z } from "zod";

import type { StampShape, Track } from "@/data/api/generated/models";
import type { CardRules, Mode, Problem } from "@/lib/rules/card";

export const SHAPES: StampShape[] = ["circle", "square", "star", "heart", "cup", "gift", "check"];
export const MAX_TRACKS = 4;

const trackValues = z.object({
  position: z.number().int(),
  name_en: z.string(),
  name_ar: z.string(),
  /** NaN = empty (track 1 has none of its own). */
  size: z.number().or(z.nan()),
  /** "" = the design's stamp. */
  shape: z.enum(["", ...SHAPES]),
  /** "" = the pass's foreground. */
  colour: z.string(),
  per_item: z.boolean(),
  /** NaN = no ceiling. */
  cap: z.number().or(z.nan()),
  items: z.array(z.string()),
});

export type TrackValues = z.infer<typeof trackValues>;
export type TracksValues = { tracks: TrackValues[] };

/** The form's schema: the crate's checks over the body it would send. */
export const tracksSchema = (rules: CardRules | undefined, mode: Mode) =>
  z.object({ tracks: z.array(trackValues) }).superRefine((v, ctx) => {
    if (rules && rules.tracks_validate(toWire(v), mode).some((p) => p.severity === "error")) {
      ctx.addIssue({ code: "custom", path: ["tracks"], message: "rewards.tracks.fix" });
    }
  });

const num = (n: number): number | null => (Number.isFinite(n) ? n : null);

export const fromWire = (tracks: Track[]): TracksValues => ({
  tracks: tracks.map((tr) => ({
    position: tr.position,
    name_en: tr.name_en ?? "",
    name_ar: tr.name_ar ?? "",
    size: tr.size ?? Number.NaN,
    shape: tr.shape ?? "",
    colour: tr.colour ?? "",
    per_item: tr.per_item ?? true,
    cap: tr.cap ?? Number.NaN,
    items: tr.items ?? [],
  })),
});

/** Track 1 carries only its look (its size, items and ceiling are the programme's). */
export const toWire = (v: TracksValues): Track[] =>
  v.tracks.map((tr, i) => {
    const look = {
      position: i + 1,
      name_en: tr.name_en.trim(),
      name_ar: tr.name_ar.trim(),
      shape: tr.shape === "" ? null : tr.shape,
      colour: tr.colour === "" ? null : tr.colour,
    };
    if (i === 0) return { ...look, size: null, cap: null, items: [], per_item: tr.per_item };
    return { ...look, size: num(tr.size), cap: num(tr.cap), items: tr.items, per_item: tr.per_item };
  });

export const newTrack = (position: number): TrackValues => ({
  position,
  name_en: "",
  name_ar: "",
  size: 8,
  shape: "",
  colour: "",
  per_item: true,
  cap: Number.NaN,
  items: [],
});

/** Problems of track `i` (`tracks[i]`), and those of the whole set (`tracks`). */
export const problemsAt = (problems: Problem[], i: number | null) =>
  problems.filter((p) => p.path === (i === null ? "tracks" : `tracks[${i}]`));

export function trackProblemText(code: string, t: TFunction): string {
  switch (code) {
    case "tracks_count":
      return t("rewards.tracks.pTracksCount", "A card has one to four tracks.");
    case "tracks_points_single":
      return t("rewards.tracks.pPointsSingle", "A points programme has one track.");
    case "track_position":
      return t("rewards.tracks.pPosition", "The tracks are out of order. Reload and try again.");
    case "track_one_size":
    case "track_one_items":
      return t("rewards.tracks.pTrackOne", "The main card's size, items and ceiling are set in Programme.");
    case "track_items_many":
      return t("rewards.tracks.pItemsMany", "A track can hold at most 200 menu items.");
    case "track_items_duplicate":
      return t("rewards.tracks.pItemsDuplicate", "An item is listed twice.");
    case "track_cap":
      return t("rewards.tracks.pCap", "The ceiling must be at least the card's size.");
    case "track_size":
      return t("rewards.tracks.pSize", "A card fills with 1 to 50 stamps.");
    case "track_name_missing":
      return t("rewards.tracks.pNameMissing", "Give the track a name, in English or Arabic.");
    case "track_name_long":
      return t("rewards.tracks.pNameLong", "Keep the name to 24 characters.");
    case "track_colour":
      return t("rewards.tracks.pColour", "Pick a colour as #RRGGBB.");
    default:
      return t("rewards.tracks.pOther", "This track isn't valid.");
  }
}
