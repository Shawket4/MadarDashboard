import { describe, expect, it } from "vitest";

import { inEgypt, mapsLink, parsePin } from "./geo";

describe("parsePin", () => {
  it("reads the place pin of a long Google Maps link over its map centre", () => {
    const url =
      "https://www.google.com/maps/place/Cairo+Tower/@30.0459,31.2243,17z/data=!3m1!4b1!4m6!3m5!1s0x1458!8m2!3d30.045915!4d31.224290!16s";
    expect(parsePin(url)).toEqual({ ok: { lat: 30.045915, lng: 31.22429 } });
  });

  it("reads the map centre when there's no place pin", () => {
    expect(parsePin("https://www.google.com/maps/@30.0444196,31.2357116,15z")).toEqual({ ok: { lat: 30.04442, lng: 31.235712 } });
  });

  it("reads ?q= / query= / ll= links, encoded or not", () => {
    expect(parsePin("https://maps.google.com/?q=30.0444,31.2357")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
    expect(parsePin("https://www.google.com/maps/search/?api=1&query=30.0444%2C31.2357")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
    expect(parsePin("https://maps.google.com/maps?ll=29.96,31.25&z=16")).toEqual({ ok: { lat: 29.96, lng: 31.25 } });
  });

  it("reads bare coordinates as Maps copies them, and geo: URIs", () => {
    expect(parsePin("30.0444, 31.2357")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
    expect(parsePin("  30.0444 31.2357 ")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
    expect(parsePin("geo:30.0444,31.2357")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
    expect(parsePin("-33.86, 151.2")).toEqual({ ok: { lat: -33.86, lng: 151.2 } });
  });

  it("reads Arabic digits and the Arabic comma", () => {
    expect(parsePin("٣٠٫٠٤٤٤، ٣١٫٢٣٥٧")).toEqual({ ok: { lat: 30.0444, lng: 31.2357 } });
  });

  it("recognises a short share link it can't open, instead of guessing", () => {
    expect(parsePin("https://maps.app.goo.gl/AbCdEf123")).toEqual({ error: "short_link" });
    expect(parsePin("https://goo.gl/maps/xyz")).toEqual({ error: "short_link" });
  });

  it("refuses what isn't a place", () => {
    expect(parsePin("")).toEqual({ error: "none" });
    expect(parsePin("Zamalek, Cairo")).toEqual({ error: "none" });
    expect(parsePin("95.1, 31.2")).toEqual({ error: "out_of_range" });
  });

  it("knows roughly where Egypt is, and links back to Maps", () => {
    expect(inEgypt({ lat: 30.04, lng: 31.23 })).toBe(true);
    expect(inEgypt({ lat: 31.23, lng: 30.04 })).toBe(true); // Alexandria-ish: still Egypt
    expect(inEgypt({ lat: 51.5, lng: -0.12 })).toBe(false);
    expect(mapsLink({ lat: 30.04, lng: 31.23 })).toBe("https://www.google.com/maps?q=30.04,31.23");
  });
});
