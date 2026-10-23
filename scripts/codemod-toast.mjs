#!/usr/bin/env node
/**
 * Move toast call sites onto the one toast module, @/components/ui/toast
 * (CLAUDE.md, "Toasts"). Re-runnable and idempotent: run it after merging a
 * branch that still imports sonner or the old wrappers.
 *
 *   node scripts/codemod-toast.mjs           rewrite src/ and shared/, list the files changed
 *   node scripts/codemod-toast.mjs --check   change nothing; exit 1 if a file needs it
 *   node scripts/codemod-toast.mjs <paths…>  only these files or folders
 *
 * It rewrites:
 *  - `from "sonner"`, `import("sonner")`, `vi.mock("sonner", …)` → the toast module
 *    (a test's own mock keeps working against it, and is listed: the guard test
 *    wants it replaced by the shared spies, src/test/toast.ts);
 *  - `@/components/ui/sonner` and `features/public-shell/public-toaster`
 *    (any relative spelling) → the toast module, `PublicToaster` → `Toaster`;
 *  - sonner's bare `toast("…")` → `toast.message("…")`;
 *  - drops `@/lib/contact-toast` (the toast module adds that action itself);
 *  - merges the imports from the toast module into one.
 * What it cannot do it prints (sonner-only options, `Toaster` props): the type
 * check names the rest.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TARGET = "@/components/ui/toast";
const SKIP = [/^src\/components\/ui\/toast\//, /^src\/data\/api\/generated\//, /^src\/generated\//, /^src\/lib\/rules\/wasm\//];
// Thin re-export kept so a branch importing the old path still builds; the codemod leaves it.
const KEEP = new Set(["src/features/public-shell/public-toaster.tsx"]);

const args = process.argv.slice(2);
const check = args.includes("--check");
const roots = args.filter((a) => a !== "--check");

function* walk(p) {
  const rel = relative(ROOT, p);
  if (/node_modules|(^|\/)dist/.test(rel) || SKIP.some((re) => re.test(rel))) return;
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) yield* walk(join(p, n));
  else if (/\.(tsx?|mts)$/.test(p) && !KEEP.has(rel)) yield p;
}

const OLD_MODULE = String.raw`(?:sonner|@\/components\/ui\/sonner|[^"'\s]*public-shell\/public-toaster|\.{1,2}\/(?:[^"'\s]*\/)?public-toaster)`;

export function transform(src) {
  let out = src;
  // Module specifiers in imports, re-exports, dynamic imports, vi.mock / vi.doMock / importOriginal types.
  out = out.replace(new RegExp(String.raw`(\bfrom\s*|\bimport\s*\(\s*|\bvi\.(?:do)?[mM]ock\(\s*|\bimport\s+)(["'])${OLD_MODULE}\2`, "g"), `$1$2${TARGET}$2`);
  out = out.replace(/^import\s*\{[^}]*\binstallContactToast\b[^}]*\}\s*from\s*["']@\/lib\/contact-toast["'];?\n/m, "");
  out = out.replace(/^\s*installContactToast\(\);?\n/m, "");
  if (out.includes(TARGET)) {
    out = out.replace(/\bPublicToaster\b/g, "Toaster");
    out = out.replace(/\bToaster as Sonner\b/g, "Toaster");
    // sonner's bare toast("…") is its neutral toast.
    out = out.replace(/(^|[^.\w])toast\(/g, "$1toast.message(");
    out = mergeImports(out);
  }
  return out;
}

/** Fold every `import { … } from TARGET` into the first one. */
function mergeImports(src) {
  const re = new RegExp(String.raw`^import\s*(type\s+)?\{([^}]*)\}\s*from\s*["']${TARGET.replace(/\//g, "\\/")}["'];?[ \t]*\n`, "gm");
  const found = [...src.matchAll(re)];
  if (found.length < 2) return src;
  const names = new Set();
  for (const m of found)
    for (const n of m[2].split(",").map((s) => s.trim()).filter(Boolean)) names.add(m[1] && !n.startsWith("type ") ? `type ${n}` : n);
  // A name imported both as a value and as a type keeps the value.
  for (const n of [...names]) if (n.startsWith("type ") && names.has(n.slice(5))) names.delete(n);
  let first = true;
  return src.replace(re, () => {
    if (!first) return "";
    first = false;
    return `import { ${[...names].join(", ")} } from "${TARGET}";\n`;
  });
}

const WARN = [
  [/\btoast\.custom\(/, "toast.custom has no equivalent: use a severity"],
  [/\btoast\.getHistory\(|\btoast\.getToasts\(/, "sonner's history API has no equivalent"],
  [/\b(richColors|closeButton|onAutoClose|onDismiss|cancel|unstyled|classNames|invert|important)\s*:/, "sonner-only option (check it is not passed to toast)"],
];

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const files = (roots.length ? roots.map((r) => join(process.cwd(), r)) : [join(ROOT, "src"), join(ROOT, "shared")]).flatMap((r) => [...walk(r)]);
  const changed = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const out = transform(src);
    if (out !== src) {
      changed.push(relative(ROOT, f));
      if (!check) writeFileSync(f, out);
    }
    if (out.includes(TARGET))
      for (const [re, why] of WARN) if (re.test(out) && !/\.test\.tsx?$/.test(f)) console.warn(`  check ${relative(ROOT, f)}: ${why}`);
    if (/\.test\.tsx?$/.test(f) && /vi\.(?:do)?[mM]ock\(\s*["']@\/components\/ui\/toast["']/.test(out))
      console.warn(`  check ${relative(ROOT, f)}: drop its toast vi.mock and assert on the shared spies (expect(toast.error)…; src/test/toast.ts)`);
  }
  console.log(`${check ? "would change" : "changed"} ${changed.length} file(s)${changed.length ? ":\n  " + changed.join("\n  ") : ""}`);
  if (check && changed.length) process.exit(1);
}
