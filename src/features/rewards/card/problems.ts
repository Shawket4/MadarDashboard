/** madar-card's design problem codes, in the owner's words. */
import type { TFunction } from "i18next";

export const PROBLEM_CODES = [
  "design_version",
  "colour_invalid",
  "contrast_low",
  "label_contrast_low",
  "photo_missing",
  "pattern_missing",
  "too_many_elements",
  "strip_empty",
  "outside_grid",
  "covers_footer",
  "under_primary_field",
  "overlap",
  "track_unknown",
  "stamps_on_points",
  "too_many_stamps",
  "stamps_too_small",
  "bar_too_short",
  "count_too_small",
  "text_empty",
  "text_long",
  "text_does_not_fit",
  "text_control",
  "logo_too_small",
  "too_many_header_fields",
  "too_many_fields",
  "track_hidden",
] as const;

export function problemText(code: string, t: TFunction): string {
  switch (code) {
    case "design_version":
      return t("rewards.card.problem.design_version", "This design was made by a newer version. Reload the page.");
    case "colour_invalid":
      return t("rewards.card.problem.colour_invalid", "A colour isn't a valid #RRGGBB value.");
    case "contrast_low":
      return t("rewards.card.problem.contrast_low", "The text colour is too close to the background: the balance would be hard to read (needs 3:1).");
    case "label_contrast_low":
      return t("rewards.card.problem.label_contrast_low", "The label colour is faint on the background.");
    case "photo_missing":
      return t("rewards.card.problem.photo_missing", "There is no card photo yet. Upload one in Settings › Brand, or pick another ground.");
    case "pattern_missing":
      return t("rewards.card.problem.pattern_missing", "Pick a pattern for the ground.");
    case "too_many_elements":
      return t("rewards.card.problem.too_many_elements", "Use at most 12 things on the strip.");
    case "strip_empty":
      return t("rewards.card.problem.strip_empty", "The strip is empty: only the footer will show.");
    case "outside_grid":
      return t("rewards.card.problem.outside_grid", "An element runs off the strip.");
    case "covers_footer":
      return t("rewards.card.problem.covers_footer", "An element covers the “rewards by madar” footer.");
    case "under_primary_field":
      return t("rewards.card.problem.under_primary_field", "An element sits where Apple Wallet writes the primary field.");
    case "overlap":
      return t("rewards.card.problem.overlap", "Two elements overlap.");
    case "track_unknown":
      return t("rewards.card.problem.track_unknown", "Something shows a stamp track the card no longer has.");
    case "stamps_on_points":
      return t("rewards.card.problem.stamps_on_points", "A points programme has no stamps: use a bar or a count.");
    case "too_many_stamps":
      return t("rewards.card.problem.too_many_stamps", "This track has more than 20 stamps: use a bar.");
    case "stamps_too_small":
      return t("rewards.card.problem.stamps_too_small", "The stamps would be too small to see: make the box bigger.");
    case "bar_too_short":
      return t("rewards.card.problem.bar_too_short", "A bar needs at least 3 columns.");
    case "count_too_small":
      return t("rewards.card.problem.count_too_small", "The count would be too small to read: make its box bigger.");
    case "text_empty":
      return t("rewards.card.problem.text_empty", "A text has no words in either language.");
    case "text_long":
      return t("rewards.card.problem.text_long", "A text is longer than 30 characters.");
    case "text_does_not_fit":
      return t("rewards.card.problem.text_does_not_fit", "A text doesn't fit its box: widen it or pick a smaller size.");
    case "text_control":
      return t("rewards.card.problem.text_control", "A text holds a character that can't be printed.");
    case "logo_too_small":
      return t("rewards.card.problem.logo_too_small", "The logo needs at least 2 by 2 cells.");
    case "too_many_header_fields":
      return t("rewards.card.problem.too_many_header_fields", "Apple Wallet shows at most 2 fields beside the logo.");
    case "too_many_fields":
      return t("rewards.card.problem.too_many_fields", "Apple Wallet shows at most 3 fields under the strip (one row is kept for messages).");
    case "track_hidden":
      return t("rewards.card.problem.track_hidden", "A stamp track doesn't show anywhere on the card.");
    default:
      return t("rewards.card.problem.other", "Something in this design can't be drawn.");
  }
}

/** The element a problem points at (`elements[2]`, `elements[3]~elements[1]`), or null. */
export function problemElement(path: string): number | null {
  const m = /^elements\[(\d+)\]/.exec(path);
  return m ? Number(m[1]) : null;
}
