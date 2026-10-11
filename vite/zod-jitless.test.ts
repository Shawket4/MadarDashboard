import { describe, expect, it } from "vitest";
import { ZOD_CORE, zodJitless } from "./zod-jitless";

describe("zodJitless", () => {
  it("sets jitless at the top of zod's core module only", () => {
    const plugin = zodJitless();
    const transform = plugin.transform as (code: string, id: string) => { code: string } | null;
    const out = transform("export const x = 1;", "/app/node_modules/zod/v4/core/core.js");
    expect(out?.code.split("\n")[0]).toBe("(globalThis.__zod_globalConfig ??= {}).jitless = true;");
    expect(transform("export const x = 1;", "/app/node_modules/zod/v4/core/util.js")).toBeNull();
    expect(ZOD_CORE.test("C:\\app\\node_modules\\zod\\v4\\core\\core.js")).toBe(true);
  });
});
