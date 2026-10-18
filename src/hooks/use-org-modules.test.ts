import { afterEach, describe, expect, it } from "vitest";

import { MODULES_KEY_PREFIX, rememberedModules } from "./use-org-modules";

afterEach(() => localStorage.clear());

describe("the remembered modules answer", () => {
  it("is the last answer for that org only", () => {
    localStorage.setItem(`${MODULES_KEY_PREFIX}org_1`, JSON.stringify({ org_id: "org_1", modules: ["pos"] }));
    expect(rememberedModules("org_1")?.modules).toEqual(["pos"]);
    expect(rememberedModules("org_2")).toBeUndefined();
    expect(rememberedModules(null)).toBeUndefined();
  });

  it("ignores anything malformed", () => {
    localStorage.setItem(`${MODULES_KEY_PREFIX}org_1`, "{not json");
    expect(rememberedModules("org_1")).toBeUndefined();
    localStorage.setItem(`${MODULES_KEY_PREFIX}org_1`, JSON.stringify({ modules: "pos" }));
    expect(rememberedModules("org_1")).toBeUndefined();
  });
});
