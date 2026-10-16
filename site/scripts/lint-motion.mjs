// The motion system's rules, checked (npm run check). See site/CLAUDE.md, "Motion".
//  1. @keyframes live in styles/motion.css (the vocabulary and the interface's motion) and
//     styles/sections/crew.css (the crew's character motion) only: a page or a component
//     never writes its own reveal keyframes.
//  2. data-in is set by scripts/motion.ts only (its one observer).
//  3. Every token src/lib/motion.ts reads is defined in styles/tokens.css.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const KEYFRAMES_OK = new Set(["styles/motion.css", "styles/sections/crew.css"]);
const DATA_IN_OK = new Set(["scripts/motion.ts"]);

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(css|astro|ts|js|mjs)$/.test(e.name)) yield p;
  }
}

const problems = [];
for await (const file of files(src)) {
  const rel = path.relative(src, file).split(path.sep).join("/");
  const text = await readFile(file, "utf8");
  if (!KEYFRAMES_OK.has(rel) && /@keyframes\s/.test(text)) {
    problems.push(`${rel}: @keyframes outside styles/motion.css (use data-reveal, data-pop, data-draw, data-split)`);
  }
  if (!DATA_IN_OK.has(rel) && /(set|toggle|remove)Attribute\(\s*["']data-in["']/.test(text)) {
    problems.push(`${rel}: sets data-in itself (watch() from scripts/motion.ts does)`);
  }
}

const tokens = await readFile(path.join(src, "styles/tokens.css"), "utf8");
const mirror = await readFile(path.join(src, "lib/motion.ts"), "utf8");
for (const [, name] of mirror.matchAll(/read\("(--[\w-]+)"\)/g)) {
  if (!new RegExp(`${name}\\s*:`).test(tokens)) problems.push(`lib/motion.ts reads ${name}, which styles/tokens.css does not define`);
}

if (problems.length) {
  console.log(`✗ motion lint:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("✓ motion lint: keyframes, data-in and tokens in their one place");
