/**
 * The motion tokens for scripts: the CSS variables of src/styles/tokens.css, read from the
 * page at runtime, so a script and the styles can never disagree. Change a value there,
 * never here. Browser only (it reads the page's styles): import it from src/scripts/,
 * never from an .astro file's frontmatter. `npm run check` (scripts/lint-motion.mjs)
 * fails if a name read here is missing from tokens.css.
 */
const css = getComputedStyle(document.documentElement);

/** A token's value as a number: seconds for times ("0.95s", "70ms"), px for lengths. */
function read(name: string): number {
  const raw = css.getPropertyValue(name).trim();
  const n = parseFloat(raw) / (raw.endsWith("ms") ? 1000 : 1);
  // A missing token is a bug: say so (npm run verify fails on console errors) and go instant.
  if (Number.isNaN(n)) console.error(`motion token ${name} is missing from tokens.css`);
  return Number.isNaN(n) ? 0 : n;
}

/** Durations in seconds (GSAP's unit). */
export const DUR = {
  pop: read("--dur-pop"),
  reveal: read("--dur-reveal"),
  draw: read("--dur-draw"),
  wave: read("--dur-wave"),
  hop: read("--dur-hop"),
};
/** Seconds a scroll-driven piece (parallax, the hero, the light) takes to catch up with the scroll, up or down. */
export const SCRUB = read("--scrub");
/** Seconds between the items of a reveal group, and between a heading's words. */
export const STAGGER = read("--stagger");
export const STAGGER_WORD = read("--stagger-word");
/** How far a reveal rises, px. */
export const REVEAL_Y = read("--reveal-y");

/** Phones: every moment, scaled to a phone (the engine's matchMedia picks it below md, 768 px). */
export const PHONE = "(max-width: 767px)";
export const REVEAL_Y_PHONE = read("--reveal-y-phone");
export const STAGGER_PHONE = read("--stagger-phone");
/** A data-parallax factor is multiplied by this on phones. */
export const PARALLAX_PHONE = read("--parallax-phone");

/**
 * GSAP's names for the token curves (GSAP can't take a CSS cubic-bezier without a plugin):
 * the same shapes, matched by eye.
 */
export const EASE = {
  /** --ease-out-expo */
  out: "expo.out",
  /** --ease-in-out-quart */
  inOut: "power3.inOut",
  /** --ease-pop */
  pop: "back.out(1.7)",
  /** --ease-spring */
  spring: "back.out(1.4)",
  /** --ease-draw */
  draw: "power2.inOut",
};
