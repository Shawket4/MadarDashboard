// The crew on the Free page (components/free): the badges drop in and swing, the Z-report
// prints, and the characters live a little: they breathe (CSS), blink and wave at their
// own uneven pace, follow the pointer with their eyes (or glance around on a phone), and
// hop when tapped or pointed at. All of it only with motion allowed, and only while on
// screen. Without this file everything is simply there, still (global.css "The crew").

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  // From here on the page may hold the badges and the receipt back until they scroll in.
  root.classList.add("crew-armed");

  const swings = Array.from(document.querySelectorAll<HTMLElement>("[data-swing]"));
  const figures = Array.from(document.querySelectorAll<SVGSVGElement>("svg[data-crew]"));
  const onScreen = new Set<Element>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          onScreen.add(e.target);
          // Into view once: the badge drops, the receipt prints.
          if (e.target instanceof HTMLElement && e.target.hasAttribute("data-swing")) e.target.dataset.in = "";
        } else onScreen.delete(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  for (const el of [...swings, ...figures]) io.observe(el);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const live = (f: Element) => onScreen.has(f) && !document.hidden;

  /** Set a flag for a while (a blink, a wave, a hop), then clear it. */
  const flash = (el: Element, attr: string, ms: number) => {
    el.setAttribute(attr, "");
    window.setTimeout(() => el.removeAttribute(attr), ms);
  };

  for (const [i, f] of figures.entries()) {
    // Blinks: every few seconds, now and then a double.
    const blink = () => {
      if (live(f)) {
        flash(f, "data-blink", 130);
        if (Math.random() < 0.25) window.setTimeout(() => flash(f, "data-blink", 120), 260);
      }
      window.setTimeout(blink, rand(2600, 6200));
    };
    window.setTimeout(blink, rand(900, 3000));

    // Waves: one soon after it arrives (staggered, so two never wave in step), then idly.
    const wave = () => {
      if (live(f)) flash(f, "data-wave", 1700);
      window.setTimeout(wave, rand(6500, 12000));
    };
    window.setTimeout(wave, 1600 + i * 900);

    // Pointed at or tapped: a hop, a big smile and a wave.
    const cheer = () => {
      if (f.hasAttribute("data-cheer")) return;
      flash(f, "data-cheer", 760);
      flash(f, "data-wave", 1700);
    };
    const target = f.closest("[data-crew-host]") ?? f;
    target.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType === "mouse") cheer();
    });
    target.addEventListener("click", cheer);
  }

  // Eyes: they follow a mouse; on touch screens they glance around now and then.
  const pupils = figures.map((f) => ({ f, els: Array.from(f.querySelectorAll<SVGGElement>(".crew-pupil")) }));
  const look = (f: SVGSVGElement, els: SVGGElement[], dx: number, dy: number) => {
    // dx, dy in -1…1; the pupils travel at most 3 units of the artwork inside the eye.
    for (const el of els) el.style.transform = `translate(${(dx * 3).toFixed(2)}px, ${(dy * 2.4).toFixed(2)}px)`;
    f.toggleAttribute("data-looking", dx !== 0 || dy !== 0);
  };
  let pointer: { x: number; y: number } | null = null;
  let frame = 0;
  const follow = () => {
    frame = 0;
    if (!pointer) return;
    for (const { f, els } of pupils) {
      if (!onScreen.has(f)) continue;
      const r = f.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.45;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      // Full travel from about a character's width away; closer, the eyes ease to centre.
      const k = Math.min(1, d / Math.max(r.width, 80));
      look(f, els, (dx / d) * k, (dy / d) * k);
    }
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(follow);
    },
    { passive: true },
  );
  // The mouse leaves the window: eyes back to the middle.
  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget) return;
    pointer = null;
    for (const { f, els } of pupils) look(f, els, 0, 0);
  });

  const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasMouse) {
    const glance = () => {
      for (const { f, els } of pupils) {
        if (!live(f) || Math.random() < 0.4) continue;
        const a = rand(0, Math.PI * 2);
        look(f, els, Math.cos(a), Math.sin(a) * 0.7);
        window.setTimeout(() => look(f, els, 0, 0), rand(700, 1400));
      }
      window.setTimeout(glance, rand(2500, 4500));
    };
    window.setTimeout(glance, 2000);
  }

  // A badge nudged with the pointer swings a little, as a hanging card would.
  for (const s of swings) {
    const badge = s.querySelector(".crew-badge");
    if (!badge) continue;
    s.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType !== "mouse" || !s.hasAttribute("data-settled")) return;
      badge.classList.remove("crew-nudge");
      void (badge as HTMLElement).offsetWidth;
      badge.classList.add("crew-nudge");
    });
    badge.addEventListener("animationend", (e) => {
      const name = (e as AnimationEvent).animationName;
      if (name === "crew-drop") s.setAttribute("data-settled", "");
      if (name === "crew-nudge") badge.classList.remove("crew-nudge");
    });
  }
}
