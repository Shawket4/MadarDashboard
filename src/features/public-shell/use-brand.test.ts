import { describe, expect, it } from "vitest";

import { hostSlug } from "./use-brand";

describe("hostSlug", () => {
  it("reads a shop's own subdomain", () => {
    expect(hostSlug("rue.madar-pos.cloud")).toBe("rue");
  });

  it("ignores our own generic origins", () => {
    // Asking `/public/orgs/brand?slug=reservations` is a guaranteed miss on
    // first paint of every booking page we serve.
    for (const host of [
      "order.madar-pos.cloud",
      "reservations.madar-pos.cloud",
      "loyalty.madar-pos.cloud",
      "www.madar-pos.cloud",
    ]) {
      expect(hostSlug(host)).toBeNull();
    }
  });

  it("ignores a hostname with no subdomain at all", () => {
    expect(hostSlug("madar-pos.cloud")).toBeNull();
    expect(hostSlug("localhost")).toBeNull();
  });

  it("does not mistake an IP address for a slug", () => {
    expect(hostSlug("127.0.0.1")).toBeNull();
  });
});
