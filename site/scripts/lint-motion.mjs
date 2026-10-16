// The motion system's rules, checked (npm run check). See site/CLAUDE.md, "Motion".
//  1. @keyframes live in styles/motion.css (the first screen, the interface's own motion)
//     and styles/sections/crew.css (the crew's idle life) only: a page or a component
//     never writes keyframes for reveal-type motion; it marks it up for the engine.
//  2. GSAP is imported by the engine only (scripts/motion.ts); everything else takes it
//     from there, so there is one GSAP, one ticker and one set of defaults.
//  3. No requestAnimationFrame loops in the site's own code: GSAP's ticker is the one clock.
//  4. Every data-sequence="name" in the markup has its defineSequence("name").
//  5. Every token src/lib/motion.ts reads is defined in styles/tokens.css.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const KEYFRAMES_OK = new Set(["styles/motion.css", "styles/sections/crew.css"]);
const GSAP_OK = new Set(["scripts/motion.ts"]);

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(css|astro|ts|js|mjs)$/.test(e.name)) yield p;
  }
}

const problems = [];
const used = new Map();
let defined = "";
for await (const file of files(src)) {
  const rel = path.relative(src, file).split(path.sep).join("/");
  const text = await readFile(file, "utf8");
  if (!KEYFRAMES_OK.has(rel) && /@keyframes\s/.test(text)) {
    problems.push(`${rel}: @keyframes outside styles/motion.css (mark it up: data-reveal, data-pop, data-draw, data-split, data-sequence)`);
  }
  if (!GSAP_OK.has(rel) && /\bimport\s+(?!type\b)[^;'"]*from\s+["']gsap/.test(text)) {
    problems.push(`${rel}: imports GSAP itself (take gsap and ScrollTrigger from scripts/motion.ts)`);
  }
  if (/\brequestAnimationFrame\s*\(/.test(text)) problems.push(`${rel}: a requestAnimationFrame loop (use gsap.ticker from scripts/motion.ts)`);
  if (rel.endsWith(".astro")) for (const [, name] of text.matchAll(/data-sequence="([\w-]+)"/g)) used.set(name, rel);
  defined += [...text.matchAll(/defineSequence\(\s*"([\w-]+)"/g)].map((m) => ` ${m[1]} `).join("");
}
for (const [name, rel] of used) if (!defined.includes(` ${name} `)) problems.push(`${rel}: data-sequence="${name}" has no defineSequence("${name}")`);

const tokens = await readFile(path.join(src, "styles/tokens.css"), "utf8");
const mirror = await readFile(path.join(src, "lib/motion.ts"), "utf8");
for (const [, name] of mirror.matchAll(/read\("(--[\w-]+)"\)/g)) {
  if (!new RegExp(`${name}\\s*:`).test(tokens)) problems.push(`lib/motion.ts reads ${name}, which styles/tokens.css does not define`);
}

if (problems.length) {
  console.log(`✗ motion lint:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("✓ motion lint: keyframes, GSAP, the ticker, set pieces and tokens each in their one place");
