// The site's one motion switch and its one "it has come in" observer (every page loads
// this from BaseLayout). The vocabulary it drives is CSS, in styles/motion.css:
//  - Motion allowed (no prefers-reduced-motion): <html> gets .crew-armed, and from then on
//    the CSS may hold back what waits for its entrance (data-pop, data-draw, the crew).
//    Without this file (no JavaScript) or with reduced motion nothing is held back: every
//    page is complete and still.
//  - data-in: set once on a watched element when it reaches the reveal line (8% above the
//    bottom of the screen, where story.ts reveals too) or is already past it, so a jump
//    down the page finishes what it carried past, out of sight. The CSS plays the
//    entrance from there.
//  - Settled: what is already on screen or above when this file starts is marked
//    data-in="still" before anything is held back, so it never blinks or replays.
//  - Elements that come in together are numbered (--n) in page order, each kind on its
//    own (pops, draws), and the CSS staggers them by --stagger.
//  - onScreen: whether an element is on screen now (data-live), for loops that should
//    only run while seen (crew.ts).
// story.ts (GSAP) keeps data-reveal and data-split; it uses the same tokens.

export const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

type Watch = { onIn?: (el: Element) => void };
const watches = new Map<Element, Watch>();

const come = (el: Element, still: boolean) => {
  if (el.hasAttribute("data-in")) return;
  el.setAttribute("data-in", still ? "still" : "");
  watches.get(el)?.onIn?.(el);
};

const reached = new IntersectionObserver(
  (entries) => {
    const counts = { pop: 0, draw: 0, other: 0 };
    for (const e of entries.filter((x) => x.isIntersecting)) {
      const el = e.target as HTMLElement | SVGElement;
      reached.unobserve(el);
      const kind = el.hasAttribute("data-pop") ? "pop" : el.hasAttribute("data-draw") ? "draw" : "other";
      if (kind !== "other") el.style.setProperty("--n", String(counts[kind]++));
      come(el, false);
    }
  },
  // The top margin reaches far above the screen: past the line counts as reached.
  { rootMargin: "100000px 0px -8% 0px" },
);

/** Painted already: on screen or above it. */
const isIn = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;

/**
 * Sets data-in on `el` once it comes in, and calls `onIn`. With `settle`, an element
 * that is already in when it is watched is marked data-in="still" at once (no entrance).
 */
export function watch(el: Element, { onIn, settle = false }: Watch & { settle?: boolean } = {}) {
  if (reduce) return;
  watches.set(el, { onIn });
  if (settle && isIn(el)) come(el, true);
  else reached.observe(el);
}

const shown = new Map<Element, (on: boolean) => void>();
const live = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      e.target.toggleAttribute("data-live", e.isIntersecting);
      shown.get(e.target)?.(e.isIntersecting);
    }
  },
  { rootMargin: "0px 0px -4% 0px" },
);

/** Tracks whether `el` is on screen (data-live, and `onChange`). */
export function onScreen(el: Element, onChange?: (on: boolean) => void) {
  if (onChange) shown.set(el, onChange);
  live.observe(el);
}

if (!reduce) {
  // The vocabulary: settle what is in already, then arm (no paint in between).
  for (const el of document.querySelectorAll("[data-pop], [data-draw]")) {
    // A stroke draws by its own length: one unit, whatever the path.
    if (el instanceof SVGSVGElement) for (const s of el.querySelectorAll("path, line, polyline, circle")) s.setAttribute("pathLength", "1");
    watch(el, { settle: true });
  }
  root.classList.add("crew-armed");
}
