import { describe, expect, it } from "vitest";

import { publicRootDomain, shopAddresses } from "./shop-address";

describe("publicRootDomain", () => {
  it("drops the API's own label", () => {
    expect(publicRootDomain("https://api.madar-pos.cloud")).toBe("madar-pos.cloud");
  });

  it("keeps every label below the first, so a deeper host still works", () => {
    expect(publicRootDomain("https://api.staging.madar-pos.cloud")).toBe(
      "staging.madar-pos.cloud",
    );
  });

  it("has nothing to offer local development", () => {
    expect(publicRootDomain("http://localhost:8082")).toBeNull();
    expect(publicRootDomain("http://127.0.0.1:8082")).toBeNull();
  });

  it("falls back to the given host when the API url is unusable", () => {
    expect(publicRootDomain("not a url", "app.madar-pos.cloud")).toBe("madar-pos.cloud");
    expect(publicRootDomain(undefined, "app.madar-pos.cloud")).toBe("madar-pos.cloud");
  });
});

describe("shopAddresses", () => {
  it("mounts the card at the root and the rest under their paths", () => {
    expect(shopAddresses("drops", "madar-pos.cloud")).toEqual([
      { key: "card", url: "https://drops.madar-pos.cloud" },
      { key: "order", url: "https://drops.madar-pos.cloud/order" },
      { key: "book", url: "https://drops.madar-pos.cloud/book" },
    ]);
  });

  it("shows nothing rather than a broken address", () => {
    expect(shopAddresses(null, "madar-pos.cloud")).toEqual([]);
    expect(shopAddresses("drops", null)).toEqual([]);
    expect(shopAddresses("", "")).toEqual([]);
  });
});
