import { describe, expect, it } from "vitest";

import { rulesPreloadTags } from "./preload-rules";

describe("rulesPreloadTags", () => {
  it("preloads the hashed rules wasm as a CORS fetch, nothing else", () => {
    const tags = rulesPreloadTags(
      ["assets/madar_web_bg-D0xRkBid.wasm", "assets/dotlottie-player-B-YISd_O.wasm", "assets/index-Bv9bnP3U.js"],
      "/",
    );
    expect(tags).toEqual([
      {
        tag: "link",
        attrs: { rel: "preload", as: "fetch", type: "application/wasm", crossorigin: true, href: "/assets/madar_web_bg-D0xRkBid.wasm" },
        injectTo: "head-prepend",
      },
    ]);
  });

  it("follows the build's base", () => {
    expect(rulesPreloadTags(["assets/madar_web_bg-x_1.wasm"], "/order/")[0].attrs!.href).toBe("/order/assets/madar_web_bg-x_1.wasm");
  });
});
