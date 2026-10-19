// The Foodics walkthrough (home/Foodics.astro, media/FoodicsStage.astro): one beat per
// step, on one timeline.
//  loop   every scene, every width: the beats play as the scene comes in, the last frame
//         holds, and it starts again; paused while it is off screen. The current step is
//         lit in the list and the stepper. A step (the stepper's, or one in the list) plays
//         that beat and holds it; the stepper's button pauses or plays the loop.
//  still  reduced motion, no JavaScript: the page as rendered, its last frame and no stepper
//         (this module never loads); if reduced motion comes on later, it goes back to that
// The engine (scripts/motion.ts) sets this up with the scenes, before the vocabulary.
// Transform and opacity only.
import { gsap, ScrollTrigger, rtl } from "./motion";
import { EASE } from "@/lib/motion";

const root = document.documentElement;
/** The beats run a little quicker than their written time. */
const PLAY_SPEED = 1.2;
/** How long the last frame holds before the walkthrough starts again, in seconds. */
const HOLD = 2.4;

/** `el`'s middle in px from `stage`'s corner, by layout: transforms don't move it. */
function middle(el: HTMLElement, stage: HTMLElement) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  for (let n: HTMLElement | null = el; n && n !== stage; n = n.offsetParent as HTMLElement | null) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y };
}

/**
 * The beats, on a paused timeline, from the first frame to the last (the page as rendered).
 * Each piece's first tween states where it starts, so the timeline holds the first frame
 * from the moment it is built. Returns when each beat starts.
 */
function beats(stage: HTMLElement) {
  const all = (name: string) => Array.from(stage.querySelectorAll<HTMLElement>(`[data-fx="${name}"]`));
  const one = (name: string) => stage.querySelector<HTMLElement>(`[data-fx="${name}"]`);
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
  const add = (targets: HTMLElement[] | HTMLElement | null, from: gsap.TweenVars, to: gsap.TweenVars, at: number) => {
    if (targets && (!Array.isArray(targets) || targets.length)) tl.fromTo(targets, from, to, at);
  };
  const starts: number[] = [];
  // Toward the reading end: things slide in from the start side, in either language.
  const lean = rtl ? -1 : 1;
  let at = 0;

  // 1. The code comes on WhatsApp and goes into the dashboard digit by digit, ticked.
  const signup = one("signup");
  if (signup) {
    starts.push(at);
    const note = one("note");
    add(note, { autoAlpha: 0, y: -12, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: EASE.spring }, at + 0.05);
    add(all("digit"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08 }, at + 0.45);
    add(one("ok"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.pop }, at + 1.05);
    if (note) tl.to(note, { autoAlpha: 0, y: -8, duration: 0.3, ease: "power2.in" }, at + 1.2);
    add(signup, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -10, duration: 0.3, ease: EASE.inOut }, at + 1.3);
    at += 1.55;
  }

  // 2. The dashboard opens on the menu, and the files from Foodics land beside it, one by
  //    one, a little askew.
  const files = all("file");
  const tilt = (i: number) => [-5, 3, -2, 4][i % 4]! * lean;
  if (files.length) {
    starts.push(at);
    if (signup) add(one("import"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, at);
    const arrive = signup ? at + 0.4 : at + 0.1;
    add(files, { autoAlpha: 0, y: -16, scale: 0.92, rotation: (i: number) => tilt(i) * 1.8 }, { autoAlpha: 1, y: 0, scale: 1, rotation: tilt, duration: 0.55, stagger: 0.12, ease: EASE.spring }, arrive);
    at = arrive + 1.05;
  }

  // 3. They fly into the drop zone, which lights up; "read on this device" confirms them.
  const drop = one("drop");
  if (files.length && drop) {
    starts.push(at);
    const to = (i: number, el: HTMLElement) => {
      const a = middle(el, stage);
      const b = middle(drop, stage);
      return { x: b.x - a.x + (i - 1.5) * 6, y: b.y - a.y + (i - 1.5) * 3 };
    };
    tl.to(files, { x: (i: number, el: HTMLElement) => to(i, el).x, y: (i: number, el: HTMLElement) => to(i, el).y, rotation: (i: number) => (i - 1.5) * 4 * lean, scale: 0.62, duration: 0.65, stagger: 0.07, ease: EASE.inOut }, at)
      .to(files, { autoAlpha: 0, scale: 0.45, duration: 0.25, stagger: 0.07, ease: "power2.in" }, at + 0.55);
    add(one("hot"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 0.3);
    add(one("local"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45 }, at + 0.95);
    at += 1.45;
  }

  // 4. The drop zone gives way to the preview as it builds: categories, then items, then
  //    sizes and choices; the skipped row; "nothing is saved yet" and the Save button.
  const cats = all("cat");
  if (cats.length) {
    starts.push(at);
    const from = { autoAlpha: 0, x: -10 * lean };
    const land = { autoAlpha: 1, x: 0, duration: 0.45 };
    add(drop, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.97, duration: 0.35, ease: EASE.inOut }, at);
    add(one("tree"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, at + 0.05);
    add(cats, from, { ...land, stagger: 0.16 }, at + 0.15);
    add(all("item"), from, { ...land, stagger: 0.1 }, at + 0.45);
    add(all("size"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.07, ease: EASE.pop }, at + 0.85);
    add(all("choice"), from, land, at + 0.95);
    add(all("skip"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45 }, at + 1.15);
    add(one("foot"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45 }, at + 1.3);
    add(one("unsaved"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 1.3);
    at += 1.8;
  }

  // 5. Saved; the till comes up dark, lights up with the menu, says it is up to date, and
  //    the first order is rung up: a cappuccino.
  const till = one("till");
  if (till) {
    starts.push(at);
    const save = one("save");
    const unsaved = one("unsaved");
    const sold = stage.querySelector<HTMLElement>("[data-fx='tile'][data-sold]");
    if (save) tl.to(save, { scale: 0.92, duration: 0.12, ease: "power2.in" }, at + 0.05).to(save, { scale: 1, duration: 0.4, ease: EASE.pop }, at + 0.17);
    if (unsaved) tl.to(unsaved, { autoAlpha: 0, y: -6, duration: 0.2, ease: "power2.in" }, at + 0.2);
    add(one("saved"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35 }, at + 0.3);
    // It comes up solid (a quick fade, a longer rise), dark until the menu reaches it.
    add(till, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: "none" }, at + 0.35);
    add(till, { yPercent: 22 }, { yPercent: 0, duration: 0.75 }, at + 0.35);
    add(one("glow"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.9 }, at + 0.75);
    add(one("on"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, at + 0.85);
    add(all("tile"), { autoAlpha: 0, y: 8, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: EASE.spring }, at + 1.0);
    add(one("sync"), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: EASE.pop }, at + 1.3);
    if (sold) tl.to(sold, { scale: 0.93, duration: 0.12, ease: "power2.in" }, at + 1.6).to(sold, { scale: 1, duration: 0.4, ease: EASE.pop }, at + 1.72);
    add(one("badge"), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: EASE.pop }, at + 1.7);
    add(one("line"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at + 1.78);
    add(one("total"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 1.85);
    at += 2.3;
  }

  // The caption follows the beats (the step's name and its number), the line fills.
  for (const set of [all("label"), all("n")]) {
    set.forEach((el, k) => {
      const leave = starts[k + 1];
      const out = { autoAlpha: 0, y: -6, duration: 0.2, ease: "power2.in" };
      if (k === 0) {
        if (leave !== undefined) add(el, { autoAlpha: 1, y: 0 }, out, leave);
        return;
      }
      add(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3 }, (starts[k] ?? 0) + 0.12);
      if (leave !== undefined) tl.to(el, out, leave);
    });
  }
  add(one("progress"), { scaleX: 0 }, { scaleX: 1, duration: at, ease: "none" }, 0);
  return { tl, starts };
}

/**
 * Sets up every Foodics scene on the page. Built inside a matchMedia: reduced motion reverts
 * it to the page as rendered. Nothing pins, so the engine has nothing to measure again (0).
 */
export function scenes() {
  for (const scene of document.querySelectorAll<HTMLElement>("[data-foodics]")) {
    const stage = scene.querySelector<HTMLElement>("[data-foodics-stage]");
    if (!stage) continue;
    // The head script's 8 s fallback has shown the last frame and it is on screen: leave it.
    if (!root.classList.contains("reveal-wait") && stage.getBoundingClientRect().top < window.innerHeight) continue;
    const steps = Array.from(scene.querySelectorAll<HTMLElement>("[data-fx-step]"));
    const stepper = scene.querySelector<HTMLElement>("[data-fx-stepper]");
    const dots = Array.from(scene.querySelectorAll<HTMLButtonElement>("[data-fx-go]"));
    const toggle = scene.querySelector<HTMLButtonElement>("[data-fx-toggle]");
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      const { tl, starts } = beats(stage);
      tl.timeScale(PLAY_SPEED);
      // A step's beat runs to just before the next one starts (the last, to the end).
      const ends = starts.map((_, k) => (starts[k + 1] !== undefined ? starts[k + 1]! - 0.05 : tl.duration()));
      // The step the scene is on, lit in the list and the stepper.
      let lit = -1;
      const light = () => {
        const k = Math.max(0, starts.filter((s) => tl.time() >= s).length - 1);
        if (k === lit) return;
        lit = k;
        steps.forEach((s, i) => s.toggleAttribute("data-active", i === k));
        dots.forEach((d, i) => (i === k ? d.setAttribute("aria-current", "step") : d.removeAttribute("aria-current")));
      };
      tl.eventCallback("onUpdate", light);
      light();

      // Looping unless someone picked a step or pressed pause; only ever while on screen.
      let auto = true;
      let seen = false;
      let seek: gsap.core.Tween | undefined;
      const again = gsap.delayedCall(HOLD, () => tl.restart()).pause();
      tl.eventCallback("onComplete", () => {
        if (auto && seen) again.restart(true);
      });
      const run = () => {
        if (!auto || !seen) {
          tl.pause();
          again.pause();
        } else if (tl.progress() === 1) again.restart(true);
        else tl.play();
      };
      const show = () => {
        if (!toggle) return;
        toggle.toggleAttribute("data-paused", !auto);
        toggle.setAttribute("aria-label", (auto ? toggle.dataset.pause : toggle.dataset.play) ?? "");
      };
      // A step: its beat from the start, then held there until play.
      const go = (k: number) => {
        if (starts[k] === undefined) return;
        auto = false;
        again.pause();
        seek?.kill();
        seek = tl.tweenFromTo(starts[k]!, ends[k]!, { onUpdate: light });
        show();
      };
      const onToggle = () => {
        seek?.kill();
        auto = !auto;
        show();
        run();
      };
      const onDot = (e: Event) => go(Number((e.currentTarget as HTMLElement).dataset.fxGo));
      // A step in the list picks it too, unless the click was on its link.
      const onStep = (e: Event) => {
        if ((e.target as HTMLElement).closest("a")) return;
        go(steps.indexOf(e.currentTarget as HTMLElement));
      };
      toggle?.addEventListener("click", onToggle);
      dots.forEach((d) => d.addEventListener("click", onDot));
      steps.forEach((s) => s.addEventListener("click", onStep));
      ScrollTrigger.create({ trigger: stage, start: "top bottom", end: "bottom top", onToggle: (self) => { seen = self.isActive; run(); } });
      if (stepper) stepper.hidden = false;
      scene.setAttribute("data-fx-live", "");
      show();
      return () => {
        toggle?.removeEventListener("click", onToggle);
        dots.forEach((d) => d.removeEventListener("click", onDot));
        steps.forEach((s) => {
          s.removeEventListener("click", onStep);
          s.removeAttribute("data-active");
        });
        if (stepper) stepper.hidden = true;
        scene.removeAttribute("data-fx-live");
      };
    });
  }
  return 0;
}
