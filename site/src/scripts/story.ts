// The scenes of the scroll story (the motion engine, scripts/motion.ts, loads this where a
// page has them, and sets them up before anything else so every trigger after them
// measures the page with their pins in place). An area with screens is a scene: the page
// pauses on it briefly while scrolling turns its screens (all on show, the current one in
// the middle: carousel.ts; a progress line shows the scroll is doing something), then
// carries on. However fast the page moves, every change plays; the ones behind hurry.
// Also here: the family (family.ts), the cappuccino (barista.ts), the features page's
// pinned sets, the day's rail, the stage clocks, Basira's demo and the roadmap. They use
// the engine's GSAP, ticker, tokens and helpers; reduced motion never loads them.
import { gsap, ScrollTrigger, whenSeen, passed, settled, rtl } from "./motion";
import { initBarista } from "./barista";
import { familyScene, type SceneKit } from "./family";
import { carousel } from "./carousel";
import { EASE } from "@/lib/motion";

const root = document.documentElement;
const desktop = window.matchMedia("(min-width: 1024px)");

/**
 * The pinned scenes, in page order (the cappuccino pins on desktop only; on phones its
 * steps play while it is on screen). Returns how many there are, so the engine knows to
 * measure the page again before anything else.
 */
export function scenes() {
  const found = Array.from(document.querySelectorAll<HTMLElement>("[data-family], [data-order], [data-barista]"));
  // What the family scene (family.ts) borrows to behave like the area scenes.
  const sceneKit: SceneKit = { sequencer, whenSeen, hold };
  for (const el of found) {
    if (el.hasAttribute("data-barista")) initBarista({ mode: desktop.matches ? "scrub" : "play", ScrollTrigger });
    else if (el.hasAttribute("data-family")) familyScene(el, sceneKit);
    else areaScene(el);
  }
  return found.length + pinnedSets();
}

/** The rest of the story, measured against the pinned page: the rail, clocks, Basira, the roadmap. */
export function extras() {
  if (desktop.matches) rail();
  stageClocks();
  basira();
  roadmap();
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
    whenSeen(el, "top 85%", gsap.to(clock, { t: target, duration: 1.6, onUpdate: show, paused: true }));
  }
}

function basira() {
  for (const box of gsap.utils.toArray<HTMLElement>("[data-basira]")) {
    if (settled(box)) continue;
    const tl = gsap.timeline({ paused: true });
    whenSeen(box, "top 75%", tl);
    tl.from(box.querySelector("[data-basira-q]"), { y: 16, autoAlpha: 0, duration: 0.7 })
      .from(box.querySelector("[data-basira-a]"), { y: 16, autoAlpha: 0, duration: 0.7 }, "+=0.25")
      .from(box.querySelectorAll("[data-bar]"), { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%", duration: 1.1, stagger: 0.09 }, "-=0.3");
  }
}

/**
 * The roadmap's line draws through time as it arrives: each stretch runs on to the next
 * stop, whose marker lands as the line gets there (a shipped one ticks) with its words
 * following. Desktop plays the row as one, under its labels. On phones each stop plays
 * as it scrolls in, after the line above it has reached it.
 */
function roadmap() {
  const box = document.querySelector<HTMLElement>("[data-roadmap]");
  if (!box) return;
  const across = desktop.matches;
  const from = across
    ? { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" }
    : { scaleY: 0, transformOrigin: "50% 0%" };
  const to = across ? { scaleX: 1 } : { scaleY: 1 };
  const stops = Array.from(box.querySelectorAll<HTMLElement>("[data-rm-stop]"));

  /** One stop from `at`; returns when the line reaches the next one. */
  const stop = (tl: gsap.core.Timeline, el: HTMLElement, at: number) => {
    const check = el.querySelector("[data-rm-check]");
    const out = el.querySelector("[data-rm-seg='out']");
    tl.fromTo(el.querySelector("[data-rm-marker]"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: EASE.pop }, at)
      .fromTo(el.querySelector("[data-rm-text]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, at + 0.1);
    if (check) tl.fromTo(check, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.4, ease: "power2.out" }, at + 0.18);
    if (out) tl.fromTo(out, from, { ...to, duration: 0.42, ease: "power1.inOut" }, at + 0.16);
    return at + 0.5;
  };

  if (across) {
    if (settled(box)) return;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(box.querySelectorAll("[data-rm-zone]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.15 }, 0)
      .fromTo(box.querySelectorAll("[data-rm-bracket]"), { scaleX: 0, transformOrigin: rtl ? "100% 0%" : "0% 0%" }, { scaleX: 1, duration: 0.9, ease: "expo.inOut", stagger: 0.15 }, 0.1);
    let at = 0.2;
    const lead = box.querySelector("[data-rm-seg='lead']");
    if (lead) {
      tl.fromTo(lead, from, { ...to, duration: 0.45, ease: "power1.in" }, at);
      at += 0.4;
    }
    for (const el of stops) at = stop(tl, el, at);
    whenSeen(box, "top 80%", tl);
    return;
  }

  let free = 0; // when the line reaches the next stop down
  for (const el of stops) {
    if (settled(el)) continue;
    const tl = gsap.timeline({ paused: true });
    const reach = stop(tl, el, 0);
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (passed(el)) return void tl.progress(1);
        const wait = Math.max(0, free - gsap.ticker.time);
        free = gsap.ticker.time + wait + reach;
        gsap.delayedCall(wait, () => void tl.play());
      },
    });
  }
}

/**
 * Plays changes one after another, every one of them. When the target moves on while a
 * change is still running (a fast scroll, a flick), the running change and the ones
 * after it speed up with the backlog (from about twice to four and a half times as
 * fast), so the screens catch up without skipping any. Out of sight (a jump went past the
 * scene, or back over it) it goes straight to where it should be: nobody would see it.
 */
function sequencer(
  change: (from: number, to: number) => gsap.core.Animation,
  snap: (to: number) => void,
  inView: () => boolean,
) {
  let current = 0; // where the running change is headed, or where things rest
  let target = 0;
  let running: gsap.core.Animation | null = null;
  const pace = () => {
    const behind = Math.abs(target - current);
    if (running && behind) running.timeScale(Math.max(running.timeScale(), Math.min(4.5, 1.6 + 0.7 * behind)));
  };
  const next = () => {
    if (running || current === target) return;
    const from = current;
    current += Math.sign(target - current);
    running = change(from, current);
    pace();
    running.eventCallback("onComplete", () => {
      running = null;
      next();
    });
  };
  return (to: number) => {
    if (to === target) return;
    target = to;
    if (!inView()) {
      running?.kill();
      running = null;
      current = to;
      snap(to);
      return;
    }
    pace();
    next();
  };
}

let pausedScenes = 0;
/** While a scene holds the page, the phone's WhatsApp bar steps aside for its words. */
function hold(holding: boolean) {
  pausedScenes = Math.max(0, pausedScenes + (holding ? 1 : -1));
  root.classList.toggle("scene-on", pausedScenes > 0);
}

/**
 * An area with screens: the page pauses on it while scrolling turns its screens (all on
 * show, the current one in the middle: carousel.ts), then carries on. The pause is kept
 * short (about two-thirds of a screen of scrolling per screen) and always visibly
 * moving: the progress line fills with the scroll. However fast the page moves, every
 * change plays (sequencer).
 */
function areaScene(area: HTMLElement) {
  const order: number[] = JSON.parse(area.dataset.order || "[]");
  const n = order.length;
  const panel = area.querySelector<HTMLElement>("[data-area-pin]");
  const media = area.querySelector<HTMLElement>("[data-media]");
  if (n < 2 || !panel || !media) return;
  const steps = Array.from(area.querySelectorAll<HTMLElement>("[data-step]"));
  const texts = Array.from(area.querySelectorAll<HTMLElement>("[data-screen-text]"));
  const bar = area.querySelector<HTMLElement>("[data-media-progress]");
  const screens = carousel(media, order);

  // The words that go with screen k, at once: its points stay bright beside it (desktop),
  // its own lines show under it (phones).
  const words = (k: number) => {
    const card = order[k] ?? 0;
    steps.forEach((s) => s.toggleAttribute("data-active", Number(s.dataset.screen) === card));
    texts.forEach((t, i) => t.toggleAttribute("data-active", i === k));
  };
  // Screen k at rest, without moving: the start, and where a jump past the scene leaves it.
  const snap = (k: number) => {
    words(k);
    screens.place(k);
    texts.forEach((t, i) => gsap.set(t, { autoAlpha: i === k ? 1 : 0, y: 0 }));
  };
  snap(0);
  const inView = () => {
    const r = panel.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };

  // The screens turn (carousel.ts); the words swap one after the other, never overlapping.
  const change = (from: number, to: number) => {
    words(to);
    const tl = screens.turn(from, to);
    const ta = texts[from];
    const tb = texts[to];
    if (ta && tb) {
      const way = to > from ? 1 : -1;
      tl.to(ta, { autoAlpha: 0, y: -8 * way, duration: 0.18, ease: "power2.in" }, 0)
        .fromTo(tb, { autoAlpha: 0, y: 12 * way }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.2);
    }
    return tl;
  };
  const go = sequencer(change, snap, inView);

  // Each screen gets about two-thirds of a screen's height of scrolling.
  ScrollTrigger.create({
    trigger: panel,
    pin: true,
    anticipatePin: 1,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 0.65 * n)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (bar) gsap.set(bar, { scaleX: self.progress });
      go(Math.min(n - 1, Math.floor(self.progress * n)));
    },
    onToggle: (self) => hold(self.isActive),
  });
}

/**
 * The features page's screen sets (MediaStack in "pass" mode). Each set pins on its own,
 * not its section (some sections' words are taller than the screen), while scrolling
 * turns its screens, as the home page's scenes do: about two-thirds of a screen of
 * scrolling per screen, the progress line filling as it goes, and every change played
 * however fast the page moves (sequencer). It holds below the header and the sticky jump
 * nav, centred in the height left. On desktop the words stay beside it (their column is
 * sticky); on phones they read above it. Returns how many sets it pinned.
 */
function pinnedSets() {
  const nav = document.querySelector<HTMLElement>("[data-jump-nav]");
  // Where the free screen starts: under the jump nav (itself stuck under the header), or
  // under the header alone; with a little air.
  const clear = () => (nav ? (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight : 64) + 16;
  let pinned = 0;
  for (const set of gsap.utils.toArray<HTMLElement>("[data-pin-set]")) {
    const media = set.querySelector<HTMLElement>("[data-media-mode='pass']");
    if (!media) continue;
    const order: number[] = JSON.parse(media.dataset.order || "[]");
    const n = order.length;
    if (n < 2) continue;
    const bar = media.querySelector<HTMLElement>("[data-media-progress]");
    const screens = carousel(media, order);
    screens.place(0);
    const inView = () => {
      const r = media.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const go = sequencer(screens.turn, screens.place, inView);
    const top = () => {
      const free = window.innerHeight - clear();
      return Math.round(clear() + Math.max(0, (free - set.offsetHeight) / 2));
    };
    ScrollTrigger.create({
      trigger: set,
      pin: true,
      // Spelled out: ScrollTrigger leaves the spacing off when the pin's parent is a flex
      // box (this one is, a column), and without it the page below scrolls up through
      // the held set instead of waiting for it.
      pinSpacing: true,
      anticipatePin: 1,
      start: () => `top ${top()}px`,
      end: () => `+=${Math.round(window.innerHeight * 0.65 * n)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (bar) gsap.set(bar, { scaleX: self.progress });
        go(Math.min(n - 1, Math.floor(self.progress * n)));
      },
      onToggle: (self) => hold(self.isActive),
    });
    pinned++;
  }
  return pinned;
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
    autoAlpha: 1, y: 0, duration: 0.5,
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
