import {
  DirectionalLight,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import type { Material, Object3D, Texture } from "three";

import { circleLine } from "./geometry";
import { SHOWCASE_KEYS, type ShowcaseKey } from "./keys";
import { buildCup, buildDawamPhone, buildKitchen, buildReceipt, buildRewardsPhone, buildTill } from "./models";
import { C } from "./palette";
import { studioEnvironment } from "./studio";

/**
 * The family showcase: Madar's products as 3D objects over a hairline orbit,
 * one at a time. Plain three.js, no framework, shared by the dashboard's
 * sign-in panel (React, plays by itself) and the marketing site (Astro, driven
 * by scrolling with GSAP).
 *
 * The host gives it a canvas and either calls `play()` or animates `stage`
 * itself: which object is on stage, how present it is (a pop in or out) and how
 * far through its turn. The engine draws whatever `stage` says, every frame
 * while active, with an idle bob, a satellite riding the orbit, a teal ping when
 * an object lands, and the whole stage leaning toward the pointer.
 */

export { SHOWCASE_KEYS, type ShowcaseKey } from "./keys";

type Item = { key: ShowcaseKey; build: (renderer: WebGLRenderer) => Group; scale: number; pose?: [number, number, number] };

/** Each object's model; scales even out their sizes, poses give each its rest angle. */
const MODELS: Record<ShowcaseKey, Omit<Item, "key">> = {
  till: { build: buildTill, scale: 1 },
  dawam: { build: buildDawamPhone, scale: 1.12, pose: [0, 0, 0.05] },
  ordering: { build: buildCup, scale: 1.18, pose: [0.12, 0, 0] },
  receipt: { build: buildReceipt, scale: 0.9, pose: [-0.06, 0, 0.06] },
  kitchen: { build: buildKitchen, scale: 0.95 },
  rewards: { build: buildRewardsPhone, scale: 1.12, pose: [0, 0, -0.05] },
};
/** In the order they play (keys.ts). */
const ITEMS: Item[] = SHOWCASE_KEYS.map((key) => ({ key, ...MODELS[key] }));

export type Stage = {
  /** Which object is on stage: its index in `SHOWCASE_KEYS`. */
  index: number;
  /** 0: gone. 1: on stage. A pop's overshoot goes a little past 1. */
  presence: number;
  /** Arriving (rises from below the orbit, spinning into place) or leaving (rises on, spinning away). */
  leaving: boolean;
  /** How far through its turn the object is: 0 turned to one side, 1 to the other. */
  turn: number;
};

export type ShowcaseOptions = {
  /**
   * The stage to draw: pass one in to keep animating the same object across the
   * engine's arrival (the site's scroll animates it before the 3D has loaded).
   */
  stage?: Stage;
  /** The floor's accent (the satellite and the landing ping). Default: the dashboard's bright teal. */
  accent?: string;
  /** Lean the stage toward the pointer. Default: on for mouse and trackpad. */
  tilt?: boolean;
  /** The highest device-pixel ratio to draw at. Default 2. */
  maxDpr?: number;
  /** The GPU took the context away: the host shows its fallback. */
  onLost?: () => void;
};

export type Showcase = {
  /** What's on stage. A host driving the showcase animates these values. */
  readonly stage: Stage;
  /** Shaders compiled, textures uploaded, the first frame drawn. */
  readonly ready: Promise<void>;
  /** Plays by itself, object after object (the sign-in panel). `onCaption` hears which one is showing. */
  play(onCaption?: (key: ShowcaseKey | null) => void): void;
  /** Draw every frame (on screen) or not at all (scrolled away, or the panel hidden). */
  setActive(active: boolean): void;
  dispose(): void;
};

// The autoplay's timing, in seconds: each object's turn, its pop in, when it
// pops out and for how long, and when its caption shows.
const SLOT = 2.8;
const IN = 0.5;
const OUT_AT = 2.45;
const OUT = 0.3;
const CAPTION_AT = 0.2;
/** How far an object turns either side (radians). */
const SWAY = 0.42;
/** The floor the objects hover over, and its orbit's radius. */
const FLOOR = -1.1;
const ORBIT = 1.25;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutBack = (x: number, s = 1.6) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;
const easeInBack = (x: number, s = 1.5) => (s + 1) * x ** 3 - s * x ** 2;
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

export function createShowcase(canvas: HTMLCanvasElement, options: ShowcaseOptions = {}): Showcase {
  const { maxDpr = 2, accent = C.tealBright, onLost } = options;
  const tilt = options.tilt ?? (typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 0.7, 5.6);
  camera.lookAt(0, -0.15, 0);

  // The studio: reflections from a built-in environment; physically based
  // lights, where a white surface square to a light needs ~π to read white.
  const env = studioEnvironment(renderer);
  scene.environment = env.texture;
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 5, 4);
  const fill = new DirectionalLight(0xffffff, 1.1);
  fill.position.set(-2, 1, 6);
  const rim = new DirectionalLight("#d4f0f4", 1.6);
  rim.position.set(-4, 2, -3);
  scene.add(key, fill, rim);

  // The objects, each in a group the stage moves, and the floor.
  const rig = new Group();
  scene.add(rig);
  const slots = ITEMS.map((item) => {
    const slot = new Group();
    slot.add(item.build(renderer));
    slot.visible = false;
    rig.add(slot);
    return slot;
  });
  const orbitLine = circleLine(ORBIT);
  const orbit = new Line(orbitLine, new LineBasicMaterial({ color: C.paper, transparent: true, opacity: 0.24, depthWrite: false }));
  const pingInk = new LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const ping = new Line(orbitLine, pingInk);
  const satellite = new Mesh(new SphereGeometry(0.05, 24, 16), new MeshBasicMaterial({ color: accent, toneMapped: false }));
  for (const o of [orbit, ping, satellite]) o.position.y = FLOOR;
  ping.visible = false;
  rig.add(orbit, ping, satellite);

  const stage: Stage = options.stage ?? { index: 0, presence: 0, leaving: false, turn: 0 };
  let clock = 0; // seconds of drawing, for the idle motion
  let landed = -1; // the object whose arrival has pinged
  let pingAt = -10;

  /** Puts everything where `stage` and the clock say. */
  const apply = () => {
    const bob = Math.sin(clock * 1.6) * 0.035;
    ITEMS.forEach((item, i) => {
      const slot = slots[i];
      const on = i === stage.index && stage.presence > 0.0005;
      slot.visible = on;
      if (!on) return;
      const away = 1 - clamp01(stage.presence); // 0 on stage, 1 gone
      const lift = stage.leaving ? 0.25 * away * away : -0.4 * away;
      const spin = stage.leaving ? 0.9 * away * away : -1.1 * away;
      const [px, py, pz] = item.pose ?? [0, 0, 0];
      slot.scale.setScalar(Math.max(stage.presence, 0.0001) * item.scale);
      slot.position.y = lift + bob;
      slot.rotation.set(px + Math.sin(clock * 1.1) * 0.015, py - SWAY + 2 * SWAY * stage.turn + spin, pz + Math.sin(clock * 0.9) * 0.02);
    });
    // A teal ring spreads across the floor as each object lands.
    if (!stage.leaving && stage.presence >= 0.9 && landed !== stage.index) {
      landed = stage.index;
      pingAt = clock;
    }
    if (stage.presence < 0.05) landed = -1;
    const k = clamp01((clock - pingAt) / 1.1);
    ping.visible = k < 1;
    ping.scale.setScalar(0.55 + 0.7 * easeOutCubic(k));
    pingInk.opacity = 0.55 * (1 - k);
    const a = clock * 0.55;
    satellite.position.set(Math.cos(a) * ORBIT, FLOOR, Math.sin(a) * ORBIT);
  };
  const draw = () => {
    apply();
    renderer.render(scene, camera);
  };

  // Size to the canvas's box, whatever lays it out.
  let isReady = false;
  let running = false;
  let disposed = false;
  const fit = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (isReady && !running) draw(); // a still frame stays right after a resize
  };
  const resizing = new ResizeObserver(fit);
  resizing.observe(canvas);
  fit();

  // The stage leans toward the pointer, wherever it is on the page.
  const pointer = { x: 0, y: 0 };
  const move = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (tilt) window.addEventListener("pointermove", move, { passive: true });

  // The autoplay (the sign-in panel): the object on stage follows the clock.
  let auto: { t: number; onCaption?: (key: ShowcaseKey | null) => void; caption?: ShowcaseKey | null } | null = null;
  const autoplay = (dt: number) => {
    if (!auto) return;
    auto.t += dt;
    const slot = Math.floor(auto.t / SLOT) % ITEMS.length;
    const u = auto.t % SLOT;
    stage.index = slot;
    if (u < IN) {
      stage.leaving = false;
      stage.presence = easeOutBack(u / IN);
      stage.turn = 0;
    } else if (u < OUT_AT) {
      stage.leaving = false;
      stage.presence = 1;
      stage.turn = easeInOutSine((u - IN) / (OUT_AT - IN));
    } else {
      stage.leaving = true;
      stage.presence = Math.max(0, 1 - easeInBack(clamp01((u - OUT_AT) / OUT)));
      stage.turn = 1;
    }
    const caption = u >= CAPTION_AT && u < OUT_AT ? ITEMS[slot].key : null;
    if (caption !== auto.caption) {
      auto.caption = caption;
      auto.onCaption?.(caption);
    }
  };

  // The loop. A long gap (a hidden tab, a stalled frame) resumes where it left off.
  let raf = 0;
  let last = 0;
  let frames = 0;
  let slowSum = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!isReady) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    clock += dt;
    autoplay(dt);
    rig.rotation.y = MathUtils.damp(rig.rotation.y, pointer.x * 0.22, 3, dt);
    rig.rotation.x = MathUtils.damp(rig.rotation.x, pointer.y * 0.08, 3, dt);
    draw();
    // Over its first couple of seconds, a struggling GPU gets fewer pixels.
    frames += 1;
    if (frames > 30 && frames <= 150) {
      slowSum += dt;
      if (frames === 150 && slowSum / 120 > 1 / 40 && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(1);
        fit();
      }
    }
  };
  const setActive = (active: boolean) => {
    if (active && !running && !disposed) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!active && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const lost = (e: Event) => {
    e.preventDefault();
    setActive(false);
    onLost?.();
  };
  canvas.addEventListener("webglcontextlost", lost);

  // Compile every object's shaders and upload every texture before the first one
  // shows, so nothing hitches the first time it appears. `compileAsync` keeps the
  // page responsive meanwhile, where the GPU driver can compile in parallel.
  const ready = (async () => {
    slots.forEach((s) => (s.visible = true));
    const compiling = renderer.compileAsync(scene, camera);
    slots.forEach((s) => (s.visible = false));
    await compiling.catch(() => {});
    if (disposed) return;
    forEachMaterial(scene, (m) => {
      const { map } = m as MeshBasicMaterial;
      if (map) renderer.initTexture(map);
    });
    isReady = true;
    last = performance.now();
    draw();
  })();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    setActive(false);
    resizing.disconnect();
    window.removeEventListener("pointermove", move);
    canvas.removeEventListener("webglcontextlost", lost);
    const textures = new Set<Texture>();
    const geometries = new Set<{ dispose: () => void }>();
    scene.traverse((o: Object3D) => {
      const m = o as Mesh;
      if (m.geometry) geometries.add(m.geometry);
    });
    forEachMaterial(scene, (m) => {
      const { map } = m as MeshBasicMaterial;
      if (map) textures.add(map);
      m.dispose();
    });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    env.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  return {
    stage,
    ready,
    play(onCaption) {
      auto = { t: 0, onCaption };
    },
    setActive,
    dispose,
  };
}

function forEachMaterial(root: Object3D, fn: (m: Material) => void) {
  const seen = new Set<Material>();
  root.traverse((o) => {
    const m = (o as Mesh).material;
    if (!m) return;
    for (const material of Array.isArray(m) ? m : [m]) {
      if (seen.has(material)) continue;
      seen.add(material);
      fn(material);
    }
  });
}
