// @vitest-environment node
/**
 * Every date and time is read and shown on the SHOP's clock: the branch's (else
 * the org's) IANA zone, which `useSyncTimezone` (src/data/scope/use-timezone.ts)
 * keeps in the app store and `@/lib/format`, `@/lib/week` and `@/lib/zoned-input`
 * read through madar-time (WebAssembly). Never the DEVICE's zone (an owner abroad,
 * a laptop left on UTC) and never a zone or an offset written by hand: Egypt
 * keeps summer time again, so Cairo is +03:00 for half the year and +02:00 for
 * the other half.
 *
 * This walks the code (src/ and shared/; not generated code, mocks or tests) for
 * the ways that crept in before, by syntax (the TypeScript parser), so a comment
 * or a word in a sentence is never a hit. A hit is fixed, or listed in ALLOWED
 * with the reason it is right; a listed line that no longer hits must leave the
 * list.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../..");
/** The one place the platform's default zone is written: `APP_TZ`. */
const ZONE_HOME = "src/data/config/constants.ts";
const SKIP = /(^|\/)(node_modules|generated|wasm|mock)(\/|$)|\.test\.tsx?$|^src\/test\/|^src\/routeTree\.gen\.ts$/;

type Rule =
  | "zone-literal" // "Africa/Cairo" outside ZONE_HOME
  | "fixed-offset" // "+03:00" / "+02:00" in a string
  | "tz-offset" // Date#getTimezoneOffset: the device's offset
  | "no-time-zone" // toLocale*String / Intl.DateTimeFormat with no timeZone: the device's zone
  | "device-clock" // Date#getHours & co, or new Date(y, m, d…): the device's calendar and clock
  | "utc-today" // new Date().toISOString().slice(0, 10): UTC's date, not the shop's
  | "datetime-local"; // an <input type="datetime-local"> not fed by toZonedInput / fromZonedInput

interface Hit {
  file: string;
  line: number;
  rule: Rule;
  text: string;
}

const DEVICE_CLOCK = new Set([
  "getFullYear", "getMonth", "getDate", "getDay", "getHours", "getMinutes", "getSeconds",
  "setFullYear", "setMonth", "setDate", "setHours", "setMinutes", "setSeconds",
]);
const TO_LOCALE = new Set(["toLocaleDateString", "toLocaleTimeString", "toLocaleString"]);
const FIXED_OFFSET = /[+-](?:0\d|1[0-4]):[0-5]\d(?!\d)/;

const propName = (p: ts.ObjectLiteralElementLike): string | undefined =>
  p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : undefined;

/** An options argument that names its zone: `{ …, timeZone }`, or `withTZ(…)` (lib/format). */
const namesAZone = (args: ts.NodeArray<ts.Expression> | undefined): boolean =>
  (args ?? []).some(
    (a) =>
      (ts.isObjectLiteralExpression(a) && a.properties.some((p) => propName(p) === "timeZone")) ||
      (ts.isCallExpression(a) && ts.isIdentifier(a.expression) && a.expression.text === "withTZ"),
  );

const isBareNewDate = (e: ts.Expression): boolean =>
  ts.isNewExpression(e) &&
  ts.isIdentifier(e.expression) &&
  e.expression.text === "Date" &&
  (e.arguments ?? []).every((a) => /^Date\.now\(\)$/.test(a.getText()));

/** The hits in one file's source. */
function scan(file: string, src: string): Hit[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const lines = src.split("\n");
  const hits: Hit[] = [];
  const hit = (node: ts.Node, rule: Rule) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    // One hit per line and rule: `d.getFullYear()…d.getDate()` is one finding.
    if (hits.some((h) => h.line === line + 1 && h.rule === rule)) return;
    hits.push({ file, line: line + 1, rule, text: lines[line].trim() });
  };
  const localInputs: ts.Node[] = [];
  const names = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) names.add(node.text);

    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const text = node.text;
      if (text.includes("Africa/Cairo") && file !== ZONE_HOME) hit(node, "zone-literal");
      if (FIXED_OFFSET.test(text)) hit(node, "fixed-offset");
      if (text === "datetime-local") localInputs.push(node);
    }

    if (ts.isPropertyAccessExpression(node) && node.name.text === "getTimezoneOffset") hit(node, "tz-offset");

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const { name, expression: receiver } = node.expression;
      if (TO_LOCALE.has(name.text) && !namesAZone(node.arguments)) hit(node, "no-time-zone");
      if (DEVICE_CLOCK.has(name.text) && !/^new TZDate\(/.test(receiver.getText(sf))) hit(node, "device-clock");
      if (
        (name.text === "slice" || name.text === "substring" || name.text === "split") &&
        ts.isCallExpression(receiver) &&
        ts.isPropertyAccessExpression(receiver.expression) &&
        receiver.expression.name.text === "toISOString" &&
        isBareNewDate(receiver.expression.expression)
      ) {
        hit(node, "utc-today");
      }
    }

    if (
      (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "DateTimeFormat" &&
      !namesAZone(node.arguments)
    ) {
      hit(node, "no-time-zone");
    }

    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "Date" &&
      (node.arguments?.length ?? 0) >= 2
    ) {
      hit(node, "device-clock");
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);

  // A datetime-local input has no zone: the browser reads it on the device's
  // clock. Its file writes it with toZonedInput and reads it with fromZonedInput.
  if (!(names.has("toZonedInput") && names.has("fromZonedInput"))) {
    for (const n of localInputs) hit(n, "datetime-local");
  }
  return hits;
}

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (SKIP.test(rel)) continue;
    if (statSync(join(ROOT, rel)).isDirectory()) yield* files(rel);
    else if (/\.tsx?$/.test(name)) yield rel;
  }
}

/**
 * The hits that are right, each with why. `has` is a piece of the hit's line,
 * so the entry follows the line when the file around it changes.
 */
const ALLOWED: { file: string; rule: Rule; has: string; why: string }[] = [
  // ── Not a shop's clock.
  {
    file: "shared/dates.ts",
    rule: "zone-literal",
    has: 'MADAR_TIME_ZONE = "Africa/Cairo"',
    why: "Madar's own clock (the copyright year in a footer), not a shop's; shared/ cannot import src/, and the marketing site builds it too",
  },
  {
    file: "src/features/integrations/handoff-content.ts",
    rule: "zone-literal",
    has: "the branch's own timezone (Africa/Cairo)",
    why: "the partner spec's prose (English text for a third party), beside a worked example whose from_utc/to_utc are Cairo's",
  },
  {
    file: "src/features/integrations/handoff-content.ts",
    rule: "zone-literal",
    has: '"timezone": "Africa/Cairo"',
    why: "the partner spec's worked example response; its from_utc/to_utc are Cairo's June bounds",
  },
  {
    file: "src/components/inputs/birthday.ts",
    rule: "device-clock",
    has: "today.getFullYear()",
    why: "a guest's own birthday (the public loyalty sign-up): 'never in the future' is the guest's today, on their own phone",
  },
  {
    file: "src/features/public-ordering/components/step-shell.tsx",
    rule: "device-clock",
    has: "new Date().getHours()",
    why: "'Good morning' greets the guest holding the phone, on their own clock",
  },
  {
    file: "src/features/reservations/manage-page.tsx",
    rule: "utc-today",
    has: "new Date().toISOString().slice(0, 10)",
    why: "the fallback when the public wasm package lacks the branch's zone (scripts/tz-filter.txt): UTC's date, documented beside it, rather than a failed page",
  },
];

const all = [...files("src"), ...files("shared")];
const hits = all.flatMap((f) => scan(f, readFileSync(join(ROOT, f), "utf8")));
const allowedBy = (h: Hit) => ALLOWED.find((a) => a.file === h.file && a.rule === h.rule && h.text.includes(a.has));
const show = (h: Hit) => `${h.file}:${h.line} [${h.rule}] ${h.text}`;

describe("times are on the shop's clock, never the device's", () => {
  it("no code reads the device's zone, or writes a zone or an offset by hand", () => {
    expect(
      hits.filter((h) => !allowedBy(h)).map(show),
      "Read the shop's zone instead: show through @/lib/format (fmtDate/fmtTime/fmtDateTime(iso, tz?), " +
        "businessDate, fmtNumber for a number), type a datetime-local through @/lib/zoned-input, default to " +
        "APP_TZ (@/data/config/constants). If the device really is right, list the line in ALLOWED with why.",
    ).toEqual([]);
  });

  it("every allowed line still hits, once (the list holds no stale entries)", () => {
    const stale = ALLOWED.filter((a) => hits.filter((h) => allowedBy(h) === a).length !== 1);
    expect(stale.map((a) => `${a.file} [${a.rule}] ${a.has}`)).toEqual([]);
  });

  it("finds what it looks for (the patterns are live)", () => {
    const rules = (src: string, file = "src/x.tsx") => scan(file, src).map((h) => h.rule);
    expect(rules('const tz = "Africa/Cairo";')).toEqual(["zone-literal"]);
    expect(rules('export const APP_TZ = "Africa/Cairo";', ZONE_HOME)).toEqual([]);
    expect(rules("// Cairo (Africa/Cairo) in a comment is a word, not a zone")).toEqual([]);
    expect(rules('const at = `${day}T09:00:00+03:00`;')).toEqual(["fixed-offset"]);
    expect(rules('const at = "2026-09-18T09:00:00+02:00";')).toEqual(["fixed-offset"]);
    expect(rules("const off = new Date().getTimezoneOffset();")).toEqual(["tz-offset"]);
    expect(rules("d.toLocaleDateString(lang);")).toEqual(["no-time-zone"]);
    expect(rules("d.toLocaleTimeString(lang, { hour: '2-digit' });")).toEqual(["no-time-zone"]);
    expect(rules("d.toLocaleString();")).toEqual(["no-time-zone"]);
    expect(rules("d.toLocaleDateString(lang, { day: 'numeric', timeZone: tz });")).toEqual([]);
    expect(rules("new Intl.DateTimeFormat(locale, { month: 'long' });")).toEqual(["no-time-zone"]);
    expect(rules("Intl.DateTimeFormat().resolvedOptions().timeZone;")).toEqual(["no-time-zone"]);
    expect(rules("new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });")).toEqual([]);
    expect(rules("new Intl.DateTimeFormat(getLocale(), withTZ(opts));")).toEqual([]);
    expect(rules("const h = new Date().getHours();")).toEqual(["device-clock"]);
    expect(rules("const day = new Date(y, m, d);")).toEqual(["device-clock"]);
    expect(rules("const n = new TZDate(y, m + 1, 0, tz).getDate();")).toEqual([]);
    expect(rules("const n = d.getUTCDate();")).toEqual([]);
    expect(rules("const today = new Date().toISOString().slice(0, 10);")).toEqual(["utc-today"]);
    expect(rules('const today = new Date(Date.now()).toISOString().split("T")[0];')).toEqual(["utc-today"]);
    expect(rules("const day = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);")).toEqual([]);
    expect(rules('const el = <input type="datetime-local" />;')).toEqual(["datetime-local"]);
    expect(rules('const el = <input type="datetime-local" value={toZonedInput(at, tz)} onChange={(e) => set(fromZonedInput(e.target.value, tz))} />;')).toEqual([]);
    expect(all.length).toBeGreaterThan(500);
  });
});
