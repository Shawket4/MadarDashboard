/**
 * Toasts have one home, @/components/ui/toast (CLAUDE.md, "Toasts"). ESLint
 * refuses the imports; this also covers what ESLint does not see: tests that
 * mock a toast library, dynamic imports, and toasts built by hand.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../../..");
const HOME = "src/components/ui/toast/";
const IMPL = "src/components/ui/toast/sileo.tsx";
const SKIP = /(^|\/)(node_modules|generated|wasm)(\/|$)|^src\/routeTree\.gen\.ts$/;

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (SKIP.test(rel)) continue;
    if (statSync(join(ROOT, rel)).isDirectory()) yield* files(rel);
    else if (/\.(tsx?|mts|mjs|js)$/.test(name)) yield rel;
  }
}
const all = [...files("src"), ...files("shared")].map((f) => ({ f, src: readFileSync(join(ROOT, f), "utf8") }));

const LIBS = String.raw`(?:sonner|sileo|react-hot-toast|react-toastify|@radix-ui\/react-toast|notistack)`;
const USES_LIB = new RegExp(String.raw`(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\(\s*|\bvi\.(?:do)?[mM]ock\(\s*)["']${LIBS}(?:\/[^"']*)?["']`);

const hits = (re: RegExp, except: (f: string) => boolean) =>
  all.filter(({ f, src }) => !except(f) && re.test(src)).map(({ f }) => relative(ROOT, join(ROOT, f)));

describe("toasts go through @/components/ui/toast", () => {
  it("nothing but the implementation imports or mocks a toast library", () => {
    expect(hits(USES_LIB, (f) => f === IMPL || f === `${HOME}no-direct-toasts.test.ts`)).toEqual([]);
  });

  it("no test mocks the toast module: every test gets the shared silent spies (src/test/toast.ts)", () => {
    expect(hits(/vi\.(?:do)?[mM]ock\(\s*["']@\/components\/ui\/toast["']/, (f) => f.startsWith(HOME))).toEqual([]);
  });

  it("no toaster or snackbar is built by hand", () => {
    const own = /\b(?:function|const|class)\s+\w*(?:Toaster|Snackbar)\b|\[data-(?:sonner|sileo)-/;
    expect(hits(own, (f) => f.startsWith(HOME) || f === "src/features/public-shell/public-toaster.tsx" || f === "src/test/toast.ts")).toEqual([]);
  });

  it("no floating, self-announcing notice (a toast in disguise)", () => {
    // A `fixed` element that is also role="alert"/"status": that is a toast, so raise one.
    const notice = /<\w+(?=[^>]*\brole=["'](?:alert|status)["'])(?=[^>]*className=["'][^"']*\bfixed\b)[^>]*>/;
    expect(hits(notice, (f) => f.startsWith(HOME) || /\.test\.tsx?$/.test(f))).toEqual([]);
  });

  it("no alert() for feedback", () => {
    expect(hits(/(?:^|[^\w.])(?:window\.)?alert\(/m, (f) => /\.test\.tsx?$/.test(f))).toEqual([]);
  });

  it("finds what it looks for (the patterns are live)", () => {
    expect(USES_LIB.test('import { toast } from "sonner";')).toBe(true);
    expect(USES_LIB.test('vi.mock("sileo", () => ({}))')).toBe(true);
    expect(USES_LIB.test('import { toast } from "@/components/ui/toast";')).toBe(false);
    expect(all.length).toBeGreaterThan(500);
  });
});
