#!/usr/bin/env node
/**
 * Every animation in src/ goes through src/lib/motion (see CLAUDE.md, "Motion").
 * ESLint refuses the animation-library imports; this refuses what ESLint
 * cannot see: keyframes, Tailwind animation and timing classes, and inline
 * transition/animation styles outside src/lib/motion.
 *
 *   node scripts/motion-check.mjs        (part of `npm run lint`)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const ALLOWED = [join(SRC, "lib/motion")];
const SKIP = [join(SRC, "data/api/generated"), join(SRC, "generated"), join(SRC, "lib/rules/wasm")];

const RULES = [
  { re: /@keyframes\b/, why: "@keyframes lives in src/lib/motion/motion.css only; use a motion hook or component" },
  { re: /\banimate-\[/, why: "arbitrary Tailwind animation; use a motion hook or component" },
  { re: /\banimate-(pulse|bounce|ping)\b/, why: "use the skeleton shimmer or a motion recipe" },
  { re: /\b(animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-\d+|zoom-out-\d+|slide-in-from-[a-z]+|slide-out-to-[a-z]+)\b/, why: "tw-animate classes are gone; overlays animate through src/lib/motion" },
  { re: /\bduration-\d+\b/, why: "use a duration token: duration-fast | base | slow | brand | count" },
  { re: /\bease-\[|\[transition-timing-function:/, why: "use an ease token: ease-out | in | in-out | expo | drawer | overshoot" },
  { re: /\b(transition|animation)\s*:\s*["'`]/, why: "inline transition/animation style; use a motion hook or a token class" },
  { re: /tw-animate-css/, why: "tw-animate-css was replaced by src/lib/motion" },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.some((s) => p.startsWith(s)) || ALLOWED.some((a) => p.startsWith(a))) continue;
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield p;
  }
}

const problems = [];
for (const file of walk(SRC)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { re, why } of RULES) {
      if (re.test(line)) problems.push(`${relative(ROOT, file)}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`);
    }
  });
}

if (problems.length) {
  console.error(`motion-check: ${problems.length} problem(s)\n\n${problems.join("\n")}\n`);
  process.exit(1);
}
console.log("motion-check: clean");
