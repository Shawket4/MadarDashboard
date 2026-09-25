/**
 * A branch pin from whatever the owner has to hand: a Google Maps link (the
 * long one a browser shows, or a `?q=` / `query=` link), bare coordinates
 * copied from Maps ("30.0444, 31.2357"), or a `geo:` URI. Pure, so it is
 * tested directly. No network: a short share link (maps.app.goo.gl) only
 * says where it redirects when opened, so it is recognised and explained
 * rather than guessed at.
 */
import { latinDigits } from "@/components/inputs";

export interface LatLng {
  lat: number;
  lng: number;
}

export type PinParse = { ok: LatLng } | { error: "short_link" | "none" | "out_of_range" };

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** Read a pin out of pasted text. */
export function parsePin(raw: string): PinParse {
  const text = latinDigits(raw).replace(/[،٫]/g, (c) => (c === "،" ? "," : ".")).trim();
  if (!text) return { error: "none" };

  let s = text;
  try {
    s = decodeURIComponent(text);
  } catch {
    /* keep it as typed */
  }

  if (/^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(s)) return { error: "short_link" };

  const tries: RegExp[] = [
    // The place's own pin in a /maps/place/ link: !3d<lat>!4d<lng>.
    new RegExp(String.raw`!3d${NUM}!4d${NUM}`),
    // An explicit query: ?q=, &query=, ll=, destination=, center=.
    new RegExp(String.raw`[?&](?:q|query|ll|destination|daddr|center|sll)=(?:loc:)?${NUM}\s*,\s*${NUM}`),
    // geo:30.04,31.23
    new RegExp(String.raw`^geo:${NUM}\s*,\s*${NUM}`),
    // The map's centre in a browser link: /@30.04,31.23,17z.
    new RegExp(String.raw`@${NUM},${NUM}`),
    // Bare coordinates, as Maps copies them: "30.0444, 31.2357" (or a space).
    new RegExp(String.raw`^${NUM}\s*[,\s]\s*${NUM}$`),
  ];
  for (const re of tries) {
    const m = re.exec(s);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (!valid(lat, lng)) return { error: "out_of_range" };
    return { ok: { lat: round6(lat), lng: round6(lng) } };
  }
  return { error: "none" };
}

/** Six decimals is about 10 cm: more is noise. */
export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Roughly Egypt, to warn (never refuse) about a pin pasted from the wrong place. */
export const inEgypt = ({ lat, lng }: LatLng) => lat >= 21.5 && lat <= 32 && lng >= 24.5 && lng <= 37;

/** A link that opens the pin in Google Maps, so the owner can check it on a real map. */
export const mapsLink = ({ lat, lng }: LatLng) => `https://www.google.com/maps?q=${lat},${lng}`;

/** `30.044400, 31.235700` for reading (always Latin digits, LTR). */
export const fmtLatLng = ({ lat, lng }: LatLng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
