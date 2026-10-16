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

import { scanJsx } from "./jsx-tags.mjs";

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
  // One component per job.
  { re: /\banimate-spin\b/, why: "use <Spinner> (components/ui/spinner); it is the one spinner", allow: ["src/components/ui/spinner.tsx"] },
  { re: /\bLoader2(Icon)?\b/, why: "use <Spinner> (components/ui/spinner) instead of a Loader2 icon", allow: ["src/components/ui/spinner.tsx"] },
  { re: /\bmotion-reduce:animate-none\b/, why: "spinners keep turning under reduced motion (the policy); motion.css stops the shimmer" },
  { re: /\bmotion-reduce:transition-none\b/, why: "redundant: motion.css already lands every transition at once under reduced motion" },
  { re: /\btransition-all\b/, why: "transition-all animates layout; name the properties (transition-colors, transition-[color,background-color,…])" },
  { re: /<span ref=\{\w+\} className="inline-flex">\s*$|usePop\(\w+, useChangeSignal\((?:\w+\.)*status\)\)/, why: "pop a changed status with <StatusPill popOn={status}>, not a wrapper", allow: ["src/components/app/status-pill.tsx"] },
  { re: /\bshimmer\b(?![-\w])/, why: "placeholders are <Skeleton> (components/ui/skeleton); it owns the shimmer", allow: ["src/components/ui/skeleton.tsx"], css: false },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.some((s) => p.startsWith(s)) || ALLOWED.some((a) => p.startsWith(a))) continue;
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield p;
  }
}

/*
 * Charts. In every file that imports Recharts:
 *  - each series spreads the motion props, `{...useChartMotion()}` or a
 *    variable holding them, so every draw runs on the count token;
 *  - each ResponsiveContainer sits inside a ChartCard or a ChartEntrance, so
 *    every chart arrives the same way (inside a Stagger they hold still).
 * Attribute text can hold `=>` and spread over many lines, hence the scanner.
 */
const SERIES = new Set(["Area", "Bar", "Funnel", "Line", "Pie", "RadialBar", "Radar", "Scatter"]);
function checkCharts(file, src, report) {
  if (!/from\s+["']recharts["']/.test(src)) return;
  const holders = new Set([...src.matchAll(/\b(\w+)\s*=\s*useChartMotion\(\)/g)].map((m) => m[1]));
  for (const tag of scanJsx(src)) {
    if (SERIES.has(tag.name)) {
      const spreads = [...tag.attrs.matchAll(/\{\s*\.\.\.\s*(useChartMotion\(\)|\w+)\s*\}/g)].map((m) => m[1]);
      if (!spreads.some((x) => x === "useChartMotion()" || holders.has(x))) {
        report(tag.line, `Recharts <${tag.name}> must spread {...useChartMotion()} (or a variable holding it)`);
      }
    }
    if (tag.name === "ResponsiveContainer" && !tag.ancestors.some((a) => a === "ChartCard" || a === "ChartEntrance")) {
      report(tag.line, "a chart sits in a <ChartCard> or a <ChartEntrance>, so it arrives like every other chart");
    }
  }
}

const problems = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    for (const { re, why, allow, css = true } of RULES) {
      if (allow?.includes(rel) || (!css && file.endsWith(".css"))) continue;
      if (re.test(line)) problems.push(`${rel}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`);
    }
  });
  if (file.endsWith(".tsx")) {
    checkCharts(file, src, (line, why) => problems.push(`${rel}:${line}  ${why}\n    ${lines[line - 1].trim().slice(0, 140)}`));
  }
}

if (problems.length) {
  console.error(`motion-check: ${problems.length} problem(s)\n\n${problems.join("\n")}\n`);
  process.exit(1);
}
console.log("motion-check: clean");
