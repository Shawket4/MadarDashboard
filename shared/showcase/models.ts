import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  BackSide,
  Euler,
  FrontSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  AdditiveBlending,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import type { BufferGeometry, Material, Texture, WebGLRenderer } from "three";

import { roundedPlane, receiptGeometry, slab } from "./geometry";
import { C } from "./palette";
import {
  DAWAM_SCREEN,
  KITCHEN_SCREEN,
  paintTexture,
  RECEIPT_BACK,
  RECEIPT_FRONT,
  RECEIPT_PAPER,
  REWARDS_SCREEN,
  SLEEVE,
  TILL_SCREEN,
  type Painter,
} from "./screens";

/**
 * The showcase's six objects, modelled in code: rounded slabs for the devices,
 * lathes for the cup, a bent plane for the receipt. Each builder returns a group
 * ~2.2 units tall, centred on the origin, front toward +z (the engine moves a
 * group around each, so a model's own offsets stay put). Whoever adds one to a
 * scene disposes of it: the engine walks its scene for geometries, materials, maps.
 */

// ── Finishes ──────────────────────────────────────────────────────────────────

/** Satin graphite aluminium: device frames and stands. */
const metal = () => new MeshStandardMaterial({ color: C.graphite, metalness: 0.8, roughness: 0.34 });

/** The black glass around a screen (and a device's back), with a clear-coat sheen. */
const glass = () =>
  new MeshPhysicalMaterial({ color: C.glass, metalness: 0, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 });

/** A lit display: the artwork shown exactly as painted (unlit, no tone mapping). */
const display = (map: Texture) => new MeshBasicMaterial({ map, toneMapped: false });

/**
 * The cover glass over a display: adds only the studio's reflections (black
 * diffuse, additive), so the softboxes glint across the screen as it turns
 * without washing out the artwork underneath.
 */
const coverGlass = () =>
  new MeshStandardMaterial({
    color: "#000000",
    roughness: 0.07,
    metalness: 0,
    envMapIntensity: 0.16,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

const mesh = (geometry: BufferGeometry, material: Material | Material[], position?: [number, number, number]) => {
  const m = new Mesh(geometry, material);
  if (position) m.position.set(...position);
  return m;
};

/**
 * A device: its body (glass faces, metal band: the slab's two groups), and the
 * screen with its cover glass, the screen's artwork painted from `painter`.
 */
function device(
  renderer: WebGLRenderer,
  painter: Painter,
  size: { w: number; h: number; d: number; r: number; bezel: number; edge: number; screenRadius: number },
) {
  const group = new Group();
  const map = paintTexture(painter, renderer);
  const sw = size.w - size.bezel * 2;
  const sh = sw * (painter.height / painter.width);
  const screen = roundedPlane(sw, sh, size.screenRadius);
  const frame = metal();
  group.add(mesh(slab(size.w, size.h, size.d, size.r, size.edge), [glass(), frame]));
  group.add(mesh(screen, display(map), [0, 0, size.d / 2 + 0.0015]));
  group.add(mesh(screen, coverGlass(), [0, 0, size.d / 2 + 0.003]));
  return { group, frame };
}

/** A cylinder spanning two points (a stand's neck). */
function column(a: Vector3, b: Vector3, r1: number, r2: number, material: Material) {
  const dir = new Vector3().subVectors(b, a);
  const m = new Mesh(new CylinderGeometry(r1, r2, dir.length(), 32), material);
  m.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()));
  m.position.addVectors(a, b).multiplyScalar(0.5);
  return m;
}

// ── The till: an iPad on a counter stand ─────────────────────────────────────

const TILL = { w: 2.36, h: 1.66, d: 0.07, r: 0.13, bezel: 0.08, y: 0.2, tilt: -0.24 };

export function buildTill(renderer: WebGLRenderer): Group {
  const root = new Group();
  const { group: tablet, frame } = device(renderer, TILL_SCREEN, { ...TILL, edge: 0.022, screenRadius: 0.07 });
  const mount = mesh(new CylinderGeometry(0.25, 0.25, 0.05, 48), frame, [0, -0.14, -TILL.d / 2 - 0.025]);
  mount.rotation.x = Math.PI / 2;
  tablet.add(mount);
  tablet.position.y = TILL.y;
  tablet.rotation.x = TILL.tilt;
  root.add(tablet);
  // Where the neck meets the mount on the tablet's back, in the model's space.
  const mountAt = new Vector3(0, -0.14, -TILL.d / 2 - 0.05).applyEuler(new Euler(TILL.tilt, 0, 0)).add(new Vector3(0, TILL.y, 0));
  root.add(column(new Vector3(0, -0.98, -0.04), mountAt, 0.068, 0.085, frame));
  root.add(mesh(new CylinderGeometry(0.46, 0.5, 0.06, 64), frame, [0, -1.01, -0.04]));
  return root;
}

// ── The kitchen display: a screen on a stand ─────────────────────────────────

const KDS = { w: 2.74, h: 1.62, d: 0.075, r: 0.06, bezel: 0.07, y: 0.24 };

export function buildKitchen(renderer: WebGLRenderer): Group {
  const root = new Group();
  const { group: screen, frame } = device(renderer, KITCHEN_SCREEN, { ...KDS, edge: 0.02, screenRadius: 0.02 });
  screen.position.y = KDS.y;
  root.add(screen);
  root.add(mesh(slab(0.2, 0.9, 0.05, 0.03, 0.012), frame, [0, -0.6, -KDS.d / 2 - 0.03]));
  const foot = mesh(slab(1.0, 0.48, 0.05, 0.08, 0.016), frame, [0, -1.04, -0.06]);
  foot.rotation.x = -Math.PI / 2;
  root.add(foot);
  return root;
}

// ── Phones: the rewards card, and Dawam ──────────────────────────────────────

const PHONE = { w: 0.84, h: 1.74, d: 0.082, r: 0.15, bezel: 0.03 };

function buildPhone(renderer: WebGLRenderer, painter: Painter): Group {
  const { group, frame } = device(renderer, painter, { ...PHONE, edge: 0.024, screenRadius: PHONE.r - PHONE.bezel * 0.9 });
  const x = PHONE.w / 2 + 0.004;
  const side = new BoxGeometry(0.014, 0.24, 0.03);
  const volume = new BoxGeometry(0.014, 0.15, 0.03);
  group.add(mesh(side, frame, [x, 0.34, 0]));
  group.add(mesh(volume, frame, [-x, 0.44, 0]));
  group.add(mesh(volume, frame, [-x, 0.24, 0]));
  return group;
}

export const buildRewardsPhone = (renderer: WebGLRenderer) => buildPhone(renderer, REWARDS_SCREEN);
export const buildDawamPhone = (renderer: WebGLRenderer) => buildPhone(renderer, DAWAM_SCREEN);

// ── The receipt ──────────────────────────────────────────────────────────────

export function buildReceipt(renderer: WebGLRenderer): Group {
  const root = new Group();
  const geometry = receiptGeometry(1, 2.3);
  const paper = { color: RECEIPT_PAPER, roughness: 0.94, metalness: 0, alphaTest: 0.5 };
  // Printed on the front; blank thermal paper behind, in the same torn outline.
  root.add(new Mesh(geometry, new MeshStandardMaterial({ ...paper, map: paintTexture(RECEIPT_FRONT, renderer), side: FrontSide })));
  root.add(new Mesh(geometry, new MeshStandardMaterial({ ...paper, map: paintTexture(RECEIPT_BACK, renderer), side: BackSide })));
  root.position.y = 0.12;
  return root;
}

// ── The takeaway cup: ordering ───────────────────────────────────────────────

/** The cup's wall radius at height y (it tapers toward the base). */
const wallRadius = (y: number) => 0.395 + (y + 0.77) * ((0.53 - 0.395) / (0.66 + 0.77));

const lathe = (points: [number, number][]) => new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), 112);

export function buildCup(renderer: WebGLRenderer): Group {
  const root = new Group();
  const body = lathe([
    [0, -0.8],
    [0.355, -0.8],
    [0.383, -0.792],
    [0.395, -0.77],
    [0.53, 0.66],
    [0.546, 0.685],
    [0.552, 0.7],
  ]);
  const lid = lathe([
    [0.535, 0.695],
    [0.56, 0.705],
    [0.568, 0.73],
    [0.562, 0.758],
    [0.545, 0.775],
    [0.5, 0.785],
    [0.39, 0.8],
    [0.365, 0.83],
    [0.335, 0.852],
    [0.3, 0.86],
    [0, 0.862],
  ]);
  // The sleeve wraps the taper; its seam faces away, the mark faces the viewer.
  const bottom = -0.42;
  const top = 0.3;
  const sleeve = new CylinderGeometry(wallRadius(top) + 0.007, wallRadius(bottom) + 0.007, top - bottom, 128, 1, true, Math.PI);
  sleeve.translate(0, (top + bottom) / 2, 0);
  root.add(new Mesh(body, new MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.3, side: DoubleSide })));
  root.add(new Mesh(lid, new MeshPhysicalMaterial({ color: "#F3F5F5", roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18, side: DoubleSide })));
  root.add(new Mesh(sleeve, new MeshStandardMaterial({ map: paintTexture(SLEEVE, renderer), roughness: 0.82, metalness: 0 })));
  root.position.y = 0.05;
  return root;
}
