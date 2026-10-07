// The scroll story: GSAP (ScrollTrigger, SplitText, DrawSVG) with Lenis smooth
// scrolling on mouse and trackpad. Each area with screens is a scene: it pins and
// scrolling moves through its screens one at a time, on desktop and phones alike.
// Reduced motion gets none of it (the content is fully visible without this file).
//
// Two ways in:
//  - fresh (from outside, or a reload): the hero and the first headings play their
//    entrance; the head script hid them until now ("m").
//  - soft (a click from another page of the site): the page transition brings the new
//    page in, so whatever is already on screen stays as it is; only what is further
//    down reveals as it scrolls in.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import { initBarista } from "./barista";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
// Phones: the address bar showing and hiding is not a resize worth re-measuring for.
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const soft = root.hasAttribute("data-soft");
const rtl = root.dir === "rtl";
const dir = rtl ? -1 : 1;
const desktop = window.matchMedia("(min-width: 1024px)");

/** On screen when the page opened: on a soft entry it is left exactly as it is. */
const settled = (el: Element) => {
  if (!soft) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

if (reduce) {
  root.classList.add("m-ready");
  initBarista({ mode: "still" });
} else {
  run();
  root.classList.add("m-ready");
}

function run() {
  // Smooth scroll on mouse and trackpad only; touch keeps its native momentum.
  if (window.matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -88 }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Entrances first, so nothing waits on the scenes below.
  if (!soft) hero();

  // Pins next, in page order: every trigger created after them measures the page with
  // the pins' extra scroll length already in place.
  const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-order], [data-barista]"));
  for (const el of scenes) {
    if (el.hasAttribute("data-barista")) initBarista({ mode: "scrub" });
    else areaScene(el);
  }
  if (desktop.matches) {
    root.classList.add("story-on");
    parallax();
    rail();
  }

  splits();
  reveals();
  orbits();
  lines();
  stageClocks();
  basira();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  // Late fonts change line heights a little: measure again once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
}

function hero() {
  const el = document.querySelector<HTMLElement>("[data-hero]");
  if (!el) return;
  const title = el.querySelector<HTMLElement>("[data-hero-title]");
  const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.15 } });
  if (title) {
    // Words only: splitting letters would break how Arabic letters join.
    const split = SplitText.create(title, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(title, { autoAlpha: 1 });
    tl.from(split.words, { yPercent: 115, stagger: 0.055 }, 0.05);
  }
  tl.fromTo("[data-hero-item]", { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07 }, 0.3)
    .fromTo("[data-hero-browser]", { y: 70, autoAlpha: 0, rotateX: 7, transformPerspective: 1400 }, { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.5 }, 0.15)
    .fromTo("[data-hero-ipad]", { y: 110, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.5 }, 0.4)
    .fromTo("[data-hero-chip]", { y: 24, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1 }, 0.9);
}

function splits() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-split]")) {
    if (el.closest("[data-hero]") || settled(el)) continue;
    const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(el, { autoAlpha: 1 });
    gsap.from(split.words, {
      yPercent: 110,
      duration: 1,
      ease: "expo.out",
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }
}

function reveals() {
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]").filter((el) => !settled(el));
  gsap.set(items, { autoAlpha: 0, y: 26 });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: 0.07, overwrite: true }),
  });
}

function orbits() {
  for (const svg of gsap.utils.toArray<SVGSVGElement>("[data-orbit]")) {
    if (!settled(svg)) {
      gsap.fromTo(svg.querySelectorAll("[data-draw]"), { drawSVG: "50% 50%" }, {
        drawSVG: "0% 100%",
        duration: 2.4,
        ease: "expo.inOut",
        stagger: 0.12,
        scrollTrigger: { trigger: svg.parentElement ?? svg, start: "top 90%", once: true },
      });
    }
    const sat = svg.querySelector(".orbit-satellite");
    if (sat) gsap.to(sat, { rotation: 360 * dir, svgOrigin: "800 800", duration: 90, ease: "none", repeat: -1 });
  }
}

function lines() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-draw-line]")) {
    if (settled(el)) continue;
    gsap.fromTo(el, { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" }, {
      scaleX: 1, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  }
}

/** The stage clock runs up to its hour as the stage comes in: 04:00 → 07:00. */
function stageClocks() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-stage-time]")) {
    if (settled(el)) continue;
    const [h = 0, m = 0] = (el.dataset.stageTime ?? "00:00").split(":").map(Number);
    const target = h * 60 + m;
    const clock = { t: Math.max(0, target - 180) };
    const show = () => {
      const v = Math.round(clock.t / 5) * 5;
      el.textContent = `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    };
    show();
    gsap.to(clock, { t: target, duration: 1.6, ease: "expo.out", onUpdate: show, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  }
}

function basira() {
  for (const box of gsap.utils.toArray<HTMLElement>("[data-basira]")) {
    if (settled(box)) continue;
    const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 75%", once: true } });
    tl.from(box.querySelector("[data-basira-q]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" })
      .from(box.querySelector("[data-basira-a]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" }, "+=0.25")
      .from(box.querySelectorAll("[data-bar]"), { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%", duration: 1.1, ease: "expo.out", stagger: 0.09 }, "-=0.3");
  }
}

function parallax() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]")) {
    const f = Number(el.dataset.parallax ?? "0.05");
    gsap.to(el, {
      yPercent: -f * 100,
      ease: "none",
      scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/**
 * Plays changes one after another. When a new target comes in while a change is still
 * running (a fast scroll), the running one hurries to its end and the next follows,
 * sped up while there is a backlog: nothing is ever cut off half-way.
 */
function sequencer(change: (from: number, to: number) => gsap.core.Animation) {
  let current = 0;
  let target = 0;
  let running: gsap.core.Animation | null = null;
  const next = () => {
    if (running || current === target) return;
    const from = current;
    current += Math.sign(target - current);
    running = change(from, current);
    if (current !== target) running.timeScale(2.6);
    running.eventCallback("onComplete", () => {
      running = null;
      next();
    });
  };
  return (to: number) => {
    target = to;
    if (running && running.timeScale() < 3) running.timeScale(3);
    next();
  };
}

/** An area with screens: pin it, and let scrolling move through the screens. */
function areaScene(area: HTMLElement) {
  const order: number[] = JSON.parse(area.dataset.order || "[]");
  const n = order.length;
  const panel = area.querySelector<HTMLElement>("[data-area-pin]");
  const media = area.querySelector<HTMLElement>("[data-media]");
  if (n < 2 || !panel || !media) return;
  const cards = Array.from(media.querySelectorAll<HTMLElement>("[data-card]"));
  const steps = Array.from(area.querySelectorAll<HTMLElement>("[data-step]"));
  const texts = Array.from(area.querySelectorAll<HTMLElement>("[data-screen-text]"));
  const dots = Array.from(media.querySelectorAll<HTMLElement>("[data-dot]"));
  const count = media.querySelector<HTMLElement>("[data-media-count]");
  const caption = media.querySelector<HTMLElement>("[data-media-caption]");
  const row = media.dataset.media === "row" && desktop.matches;
  const pad = (v: number) => String(v).padStart(2, "0");
  const altOf = (card: number) => cards[card]?.querySelector("img")?.getAttribute("alt") ?? "";

  // What a screen change says, at once: which points are lit, the counter, the caption.
  const mark = (k: number) => {
    const card = order[k] ?? 0;
    cards.forEach((c, i) => c.toggleAttribute("data-active", i === card));
    steps.forEach((s) => s.toggleAttribute("data-active", Number(s.dataset.screen) === card));
    texts.forEach((t, i) => t.toggleAttribute("data-active", i === k));
    dots.forEach((d, i) => d.toggleAttribute("data-on", i === k));
    if (count) count.textContent = `${pad(k + 1)} / ${pad(n)}`;
    if (caption) caption.textContent = altOf(card);
  };

  // Start state: GSAP owns the screens from here.
  cards.forEach((c, i) => {
    const on = i === order[0];
    if (row) gsap.set(c, { autoAlpha: on ? 1 : 0.42, scale: on ? 1.04 : 0.94, yPercent: on ? -3 : 0 });
    else gsap.set(c, { autoAlpha: on ? 1 : 0, y: 0, scale: 1 });
  });
  texts.forEach((t, i) => gsap.set(t, { autoAlpha: i === 0 ? 1 : 0 }));
  mark(0);

  const change = (from: number, to: number) => {
    mark(to);
    const way = to > from ? 1 : -1;
    const a = cards[order[from] ?? 0];
    const b = cards[order[to] ?? 0];
    const tl = gsap.timeline();
    if (row) {
      cards.forEach((c) => {
        const on = c === b;
        tl.to(c, { autoAlpha: on ? 1 : 0.42, scale: on ? 1.04 : 0.94, yPercent: on ? -3 : 0, duration: 0.7, ease: "expo.out" }, 0);
      });
    } else if (a && b) {
      tl.set(b, { zIndex: 2 }, 0).set(a, { zIndex: 1 }, 0)
        .to(a, { autoAlpha: 0, y: -36 * way, scale: 0.97, duration: 0.42, ease: "power2.in" }, 0)
        .fromTo(b, { autoAlpha: 0, y: 52 * way, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }, 0.1);
    }
    const ta = texts[from];
    const tb = texts[to];
    if (ta && tb) {
      tl.to(ta, { autoAlpha: 0, y: -10 * way, duration: 0.25, ease: "power2.in" }, 0)
        .fromTo(tb, { autoAlpha: 0, y: 14 * way }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out" }, 0.15);
    }
    return tl;
  };
  const go = sequencer(change);

  // Each screen gets most of a screen's height of scrolling while the area stays put.
  ScrollTrigger.create({
    trigger: panel,
    pin: true,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 0.8 * n)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => go(Math.min(n - 1, Math.floor(self.progress * n))),
  });
}

/** The floating pill: which part of the day we're in, and how far through it. */
function rail() {
  const story = document.querySelector<HTMLElement>("[data-story]");
  const pill = document.querySelector<HTMLElement>("[data-rail]");
  if (!story || !pill) return;
  const progress = pill.querySelector<HTMLElement>("[data-rail-progress]");
  const chips = Array.from(pill.querySelectorAll<HTMLElement>("[data-rail-chip]"));
  // These ranges contain pinned scenes, so they measure after them (refreshPriority -1);
  // measured before, they would end a whole pin-length too early.
  if (progress) {
    gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { trigger: story, start: "top 20%", end: "bottom bottom", scrub: 0.4, refreshPriority: -1 } });
  }
  gsap.fromTo(pill, { autoAlpha: 0, y: 16 }, {
    autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out",
    scrollTrigger: { trigger: story, start: "top 40%", end: "bottom 55%", toggleActions: "play reverse play reverse", refreshPriority: -1 },
  });
  for (const block of gsap.utils.toArray<HTMLElement>("[data-stage-block]")) {
    const key = block.dataset.stageBlock;
    ScrollTrigger.create({
      trigger: block,
      start: "top 50%",
      end: "bottom 50%",
      refreshPriority: -1,
      onToggle: (self) => {
        if (!self.isActive) return;
        chips.forEach((c) => (c.dataset.railChip === key ? c.setAttribute("data-active", "") : c.removeAttribute("data-active")));
      },
    });
  }
}
