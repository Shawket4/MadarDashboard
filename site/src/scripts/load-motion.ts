// Every page's motion door (BaseLayout loads it; it is tiny and holds no GSAP). It fetches
// the motion engine (scripts/motion.ts: GSAP and its plugins, Lenis, and through it the
// scenes and the crew) only when the page has something to move and motion is allowed. A
// page with nothing to move, reduced motion, or no JavaScript pays nothing and shows every
// page complete and still. With reduced motion the two still pieces that need a script
// are drawn without GSAP: the cappuccino's still frame, the ledger's beams.
const MOVES = [
  "[data-reveal]", "[data-split]", "[data-pop]", "[data-draw]", "[data-count]", "[data-parallax]", "[data-sequence]",
  "[data-orbit]", "[data-light]", "[data-crew]", "[data-swing]", "[data-beams]",
  "[data-family]", "[data-order]", "[data-barista]", "[data-pin-set]", "[data-roadmap]", "[data-rail]",
].join(", ");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const has = (selector: string) => document.querySelector(selector) !== null;

if (!reduce) {
  if (has(MOVES)) void import("./motion");
} else {
  if (has("[data-barista]")) void import("./barista").then((m) => m.initBarista({ mode: "still" }));
  if (has("[data-beams]")) void import("./beams").then((m) => m.drawBeams(false));
}
