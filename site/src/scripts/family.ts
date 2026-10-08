// The family (FamilyShowcase.astro): Madar's products as 3D objects, one at a
// time, as the page scrolls. The panel pins like the area scenes (story.ts) and
// shares their manners: the item that goes with the object stays bright, the
// progress line fills with the scroll, every change plays however fast the page
// moves (the sequencer hurries the ones behind), and the phone's WhatsApp bar
// steps aside meanwhile.
//
// The 3D is the shared engine (shared/showcase), loaded on its own only when the
// section is near and the page has finished loading. GSAP drives it: scrolling
// picks the object and turns it; GSAP tweens pop objects in and out. Until the
// 3D is ready the stage shows the 2D orbit; where it can't run (no WebGL, data
// saving on) nothing pins and the whole list shows beside the orbit.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Showcase, Stage } from "@shared/showcase/engine";

/** Scrolling per object, as a share of the screen's height. */
const SPAN = 0.35;

/** What the scene borrows from the scroll story, so it behaves like the others. */
export type SceneKit = {
  sequencer: (
    change: (from: number, to: number) => gsap.core.Animation,
    snap: (to: number) => void,
    inView: () => boolean,
  ) => (to: number) => void;
  whenSeen: (el: Element, start: string, anim: gsap.core.Animation) => void;
  /** A scene holds the page (or lets go). */
  hold: (holding: boolean) => void;
};

/** WebGL is there, and the visitor isn't saving data. */
function can3D() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Resolves once the page has loaded and the main thread has a quiet moment: the 3D never competes with the hero. */
const settledPage = new Promise<void>((resolve) => {
  // Safari has no requestIdleCallback: a short wait does the same job there.
  const idle = () =>
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 200);
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
});

export function familyScene(section: HTMLElement, kit: SceneKit) {
  const panel = section.querySelector<HTMLElement>("[data-family-pin]");
  const stageEl = section.querySelector<HTMLElement>("[data-family-stage]");
  if (!panel || !stageEl || !can3D()) return;
  section.setAttribute("data-scene", "");
  const items = Array.from(section.querySelectorAll<HTMLElement>("[data-family-item]"));
  const texts = Array.from(section.querySelectorAll<HTMLElement>("[data-family-text]"));
  const bar = section.querySelector<HTMLElement>("[data-family-progress]");
  const n = items.length;

  // What the engine draws. GSAP animates it from the start, before the 3D has
  // even loaded, so the engine picks up exactly where the scroll is.
  const stage: Stage = { index: 0, presence: 0, leaving: false, turn: 0 };
  const turnTo = gsap.quickTo(stage, "turn", { duration: 0.6, ease: "power3.out" });

  const mark = (k: number) => {
    items.forEach((el, i) => el.toggleAttribute("data-active", i === k));
    texts.forEach((el, i) => el.toggleAttribute("data-active", i === k));
  };
  const inView = () => {
    const r = panel.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  // Object k on stage at once (a jump past the scene).
  const snap = (k: number) => {
    mark(k);
    gsap.killTweensOf(stage, "presence,index,leaving");
    Object.assign(stage, { index: k, leaving: false, presence: 1 });
  };
  // One object pops out (a little swell, then gone) and the next pops in.
  const change = (_from: number, to: number) => {
    mark(to);
    return gsap
      .timeline()
      .set(stage, { leaving: true })
      .to(stage, { presence: 0, duration: 0.2, ease: "back.in(1.6)" })
      .set(stage, { index: to, leaving: false })
      .to(stage, { presence: 1, duration: 0.5, ease: "back.out(1.7)" });
  };
  const go = kit.sequencer(change, snap, inView);

  // The first object pops in as the stage comes into view.
  kit.whenSeen(stageEl, "top 75%", gsap.to(stage, { presence: 1, duration: 0.7, ease: "back.out(1.7)", paused: true }));

  // Each object gets a third of a screen of scrolling, and turns through it.
  ScrollTrigger.create({
    trigger: panel,
    pin: true,
    anticipatePin: 1,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * SPAN * n)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (bar) gsap.set(bar, { scaleX: self.progress });
      const at = self.progress * n;
      const k = Math.min(n - 1, Math.floor(at));
      go(k);
      turnTo(Math.min(1, at - k));
    },
    onToggle: (self) => kit.hold(self.isActive),
  });

  // The engine: fetched when the section is within a screen and a half and the
  // page has settled; it draws only while the section is on screen.
  let showcase: Showcase | null = null;
  let onScreen = false;
  const load = async () => {
    await settledPage;
    try {
      const { createShowcase } = await import("@shared/showcase/engine");
      const canvas = document.createElement("canvas");
      canvas.className = "family-canvas";
      canvas.setAttribute("aria-hidden", "true");
      stageEl.append(canvas);
      const lost = () => {
        section.removeAttribute("data-3d");
        showcase?.dispose();
        showcase = null;
        canvas.remove();
      };
      try {
        showcase = createShowcase(canvas, { stage, accent: "#2E94A6", onLost: lost });
      } catch {
        canvas.remove();
        return;
      }
      await showcase.ready;
      if (!showcase) return;
      section.setAttribute("data-3d", "");
      showcase.setActive(onScreen);
    } catch {
      // The chunk didn't load (offline, a deploy in between): the orbit stays.
    }
  };
  ScrollTrigger.create({ trigger: section, start: "top bottom+=150%", once: true, onEnter: () => void load() });
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    // The section holds the pinned panel, so this range is measured after the pin
    // (story.ts sorts triggers by where they start, and this one starts first).
    // Measured before, it ended about a screen into the pin, and the engine stopped
    // drawing there with the scene still on screen: on phones, where the pin is
    // longer than the panel, the objects froze part-way through.
    refreshPriority: -1,
    onToggle: (self) => {
      onScreen = self.isActive;
      showcase?.setActive(onScreen);
    },
  });
}
