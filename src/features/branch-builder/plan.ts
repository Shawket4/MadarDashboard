/**
 * The branch plan: what hardware a branch has and how it talks.
 *
 * Pure data and pure functions, no React and no API. The builder page edits a
 * `Plan` locally (with undo), checks it with `checkPlan`, and saves the whole
 * thing in one request, because a plan is only coherent as a whole: a section
 * whose screen was removed but whose replacement was not yet added would lose
 * orders in between. See `madar/docs/specs/kitchen-target-spec.md` (BB-*, CH-*).
 *
 * Pieces carry their own canvas position, in the same unbounded plane the floor
 * editor uses, so the viewport maths in `features/floor/util.ts` applies as is.
 */

export const DEVICE_KINDS = ["pos", "waiter", "kitchen"] as const;
export type DeviceKind = (typeof DEVICE_KINDS)[number];

export const PRINTER_ROLES = ["receipt", "kitchen"] as const;
export type PrinterRole = (typeof PRINTER_ROLES)[number];

export const CONNECTIONS = ["network", "usb", "bluetooth"] as const;
export type Connection = (typeof CONNECTIONS)[number];

export const PAPER_WIDTHS = [58, 80] as const;

export interface PlanDevice {
  id: string;
  kind: DeviceKind;
  name: string;
  /** For a POS or waiter device: where its receipts print. */
  receipt_printer_id: string | null;
  /** The real device that claimed this slot, if any. Read-only here. */
  device_id: string | null;
  x: number;
  y: number;
}

export interface PlanPrinter {
  id: string;
  role: PrinterRole;
  name: string;
  connection: Connection;
  brand: string | null;
  ip: string | null;
  port: number | null;
  paper_mm: number;
  /** For a USB or Bluetooth printer: the device it is plugged into. */
  host_device_id: string | null;
  x: number;
  y: number;
}

export interface PlanSection {
  id: string;
  name: string;
  is_default: boolean;
  category_ids: string[];
  /** Kitchen screens this section's items show on. */
  screen_ids: string[];
  /** Kitchen printers this section's items print on. */
  printer_ids: string[];
  x: number;
  y: number;
}

export interface Plan {
  devices: PlanDevice[];
  printers: PlanPrinter[];
  sections: PlanSection[];
  /** Case 1: the till's receipt printer also prints kitchen chits. */
  till_prints_kitchen: boolean;
}

export const EMPTY_PLAN: Plan = { devices: [], printers: [], sections: [], till_prints_kitchen: false };

// ── Geometry ────────────────────────────────────────────────────────────────

/** Footprint of a piece on the canvas, in canvas units. */
export const NODE_W = 216;
export const NODE_H = 76;
export const SECTION_H = 104;

export type PieceKind = "device" | "printer" | "section";
export interface PieceRef {
  kind: PieceKind;
  id: string;
}

export const pieceKey = (p: PieceRef) => `${p.kind}:${p.id}`;
export const parsePieceKey = (key: string): PieceRef => {
  const i = key.indexOf(":");
  return { kind: key.slice(0, i) as PieceKind, id: key.slice(i + 1) };
};

export interface PieceBox {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const boxesOf = (plan: Plan): PieceBox[] => [
  ...plan.devices.map((d) => ({ key: pieceKey({ kind: "device", id: d.id }), x: d.x, y: d.y, w: NODE_W, h: NODE_H })),
  ...plan.printers.map((p) => ({ key: pieceKey({ kind: "printer", id: p.id }), x: p.x, y: p.y, w: NODE_W, h: NODE_H })),
  ...plan.sections.map((s) => ({ key: pieceKey({ kind: "section", id: s.id }), x: s.x, y: s.y, w: NODE_W, h: SECTION_H })),
];

/** Move pieces by key. Unknown keys are ignored. */
export const movePieces = (plan: Plan, moves: Map<string, { x: number; y: number }>): Plan => {
  const at = <T extends { id: string; x: number; y: number }>(kind: PieceKind, list: T[]) =>
    list.map((it) => {
      const m = moves.get(pieceKey({ kind, id: it.id }));
      return m ? { ...it, x: m.x, y: m.y } : it;
    });
  return {
    ...plan,
    devices: at("device", plan.devices),
    printers: at("printer", plan.printers),
    sections: at("section", plan.sections),
  };
};

// ── Links ───────────────────────────────────────────────────────────────────

export type LinkKind = "receipt" | "host" | "shows" | "prints";

export interface PlanLink {
  kind: LinkKind;
  /** The piece the line starts at. */
  from: PieceRef;
  to: PieceRef;
}

/** Every line the canvas draws, derived from the plan. */
export const linksOf = (plan: Plan): PlanLink[] => {
  const out: PlanLink[] = [];
  for (const d of plan.devices) {
    if (d.receipt_printer_id) {
      out.push({ kind: "receipt", from: { kind: "device", id: d.id }, to: { kind: "printer", id: d.receipt_printer_id } });
    }
  }
  for (const p of plan.printers) {
    if (p.connection !== "network" && p.host_device_id) {
      out.push({ kind: "host", from: { kind: "printer", id: p.id }, to: { kind: "device", id: p.host_device_id } });
    }
  }
  for (const s of plan.sections) {
    for (const id of s.screen_ids) out.push({ kind: "shows", from: { kind: "section", id: s.id }, to: { kind: "device", id } });
    for (const id of s.printer_ids) out.push({ kind: "prints", from: { kind: "section", id: s.id }, to: { kind: "printer", id } });
  }
  return out;
};

/**
 * What a line dragged from `from` may connect to, and what it would mean.
 * Returns null when the pair makes no sense (a POS to a section, say).
 */
export const linkKindFor = (plan: Plan, from: PieceRef, to: PieceRef): LinkKind | null => {
  const dev = (id: string) => plan.devices.find((d) => d.id === id);
  const prn = (id: string) => plan.printers.find((p) => p.id === id);
  if (from.kind === "section") {
    if (to.kind === "device" && dev(to.id)?.kind === "kitchen") return "shows";
    if (to.kind === "printer" && prn(to.id)?.role === "kitchen") return "prints";
    return null;
  }
  if (from.kind === "device") {
    const d = dev(from.id);
    if (!d) return null;
    // A POS to a receipt printer: where its receipts print.
    if ((d.kind === "pos" || d.kind === "waiter") && to.kind === "printer" && prn(to.id)?.role === "receipt") return "receipt";
    // A kitchen screen to a section, drawn backwards: same link.
    if (d.kind === "kitchen" && to.kind === "section") return "shows";
    return null;
  }
  // A printer: plugged into a device, or (a kitchen printer) fed by a section.
  const p = prn(from.id);
  if (!p) return null;
  if (to.kind === "device" && p.connection !== "network") return "host";
  if (to.kind === "section" && p.role === "kitchen") return "prints";
  if (to.kind === "device" && p.role === "receipt") {
    const d = dev(to.id);
    if (d && (d.kind === "pos" || d.kind === "waiter")) return "receipt";
  }
  return null;
};

/** Add a link. Idempotent; a receipt or host link replaces the previous one. */
export const addLink = (plan: Plan, from: PieceRef, to: PieceRef): Plan => {
  const kind = linkKindFor(plan, from, to);
  if (!kind) return plan;
  // Normalise direction: section → output, device → receipt printer, printer → host.
  const sectionId = from.kind === "section" ? from.id : to.kind === "section" ? to.id : null;
  const deviceId = from.kind === "device" ? from.id : to.kind === "device" ? to.id : null;
  const printerId = from.kind === "printer" ? from.id : to.kind === "printer" ? to.id : null;
  switch (kind) {
    case "shows":
      return {
        ...plan,
        sections: plan.sections.map((s) =>
          s.id === sectionId && deviceId && !s.screen_ids.includes(deviceId)
            ? { ...s, screen_ids: [...s.screen_ids, deviceId] }
            : s,
        ),
      };
    case "prints":
      return {
        ...plan,
        sections: plan.sections.map((s) =>
          s.id === sectionId && printerId && !s.printer_ids.includes(printerId)
            ? { ...s, printer_ids: [...s.printer_ids, printerId] }
            : s,
        ),
      };
    case "receipt":
      return {
        ...plan,
        devices: plan.devices.map((d) => (d.id === deviceId ? { ...d, receipt_printer_id: printerId } : d)),
      };
    case "host":
      return {
        ...plan,
        printers: plan.printers.map((p) => (p.id === printerId ? { ...p, host_device_id: deviceId } : p)),
      };
  }
};

export const removeLink = (plan: Plan, link: PlanLink): Plan => {
  switch (link.kind) {
    case "shows":
      return {
        ...plan,
        sections: plan.sections.map((s) =>
          s.id === link.from.id ? { ...s, screen_ids: s.screen_ids.filter((x) => x !== link.to.id) } : s,
        ),
      };
    case "prints":
      return {
        ...plan,
        sections: plan.sections.map((s) =>
          s.id === link.from.id ? { ...s, printer_ids: s.printer_ids.filter((x) => x !== link.to.id) } : s,
        ),
      };
    case "receipt":
      return {
        ...plan,
        devices: plan.devices.map((d) => (d.id === link.from.id ? { ...d, receipt_printer_id: null } : d)),
      };
    case "host":
      return {
        ...plan,
        printers: plan.printers.map((p) => (p.id === link.from.id ? { ...p, host_device_id: null } : p)),
      };
  }
};

/** Remove pieces and every link that pointed at them. */
export const removePieces = (plan: Plan, keys: Set<string>): Plan => {
  const gone = (kind: PieceKind, id: string) => keys.has(pieceKey({ kind, id }));
  const sections = plan.sections.filter((s) => !gone("section", s.id));
  // Keep one default: if it was removed, the first remaining section inherits it.
  if (sections.length > 0 && !sections.some((s) => s.is_default)) {
    sections[0] = { ...sections[0], is_default: true };
  }
  return {
    ...plan,
    devices: plan.devices
      .filter((d) => !gone("device", d.id))
      .map((d) => (d.receipt_printer_id && gone("printer", d.receipt_printer_id) ? { ...d, receipt_printer_id: null } : d)),
    printers: plan.printers
      .filter((p) => !gone("printer", p.id))
      .map((p) => (p.host_device_id && gone("device", p.host_device_id) ? { ...p, host_device_id: null } : p)),
    sections: sections.map((s) => ({
      ...s,
      screen_ids: s.screen_ids.filter((id) => !gone("device", id)),
      printer_ids: s.printer_ids.filter((id) => !gone("printer", id)),
    })),
  };
};

/** Give a category to one section, taking it from any other (one section per category). */
export const routeCategory = (plan: Plan, categoryId: string, sectionId: string | null): Plan => ({
  ...plan,
  sections: plan.sections.map((s) => {
    const rest = s.category_ids.filter((c) => c !== categoryId);
    return s.id === sectionId ? { ...s, category_ids: [...rest, categoryId] } : { ...s, category_ids: rest };
  }),
});

export const setDefaultSection = (plan: Plan, sectionId: string): Plan => ({
  ...plan,
  sections: plan.sections.map((s) => ({ ...s, is_default: s.id === sectionId })),
});

// ── Setups (the four branch cases) ──────────────────────────────────────────

export const SETUPS = ["till", "till_printer", "till_screen", "sections"] as const;
export type Setup = (typeof SETUPS)[number];

/** Which of the four cases a plan is, for the header and the setup picker. */
export const setupOf = (plan: Plan): Setup | null => {
  if (plan.devices.length === 0 && plan.printers.length === 0 && plan.sections.length === 0) return null;
  if (plan.sections.length === 0) return "till";
  if (plan.sections.length > 1) return "sections";
  const s = plan.sections[0];
  if (s.screen_ids.length > 0 && s.printer_ids.length === 0) return "till_screen";
  if (s.printer_ids.length > 0 && s.screen_ids.length === 0) return "till_printer";
  return "sections";
};

type NewId = () => string;

/** Canvas columns: front of house, kitchen sections, kitchen outputs. */
export const COLUMN_X = { front: 0, sections: 340, outputs: 680 } as const;
const ROW = 120;

/**
 * A new plan for one of the four cases. Names are passed in so they arrive in
 * the viewer's language; categories all go to the one section (cases 2 and 3)
 * or the default section (case 4).
 */
export const planForSetup = (
  setup: Setup,
  names: {
    till: string;
    receiptPrinter: string;
    kitchen: string;
    kitchenPrinter: string;
    kitchenScreen: string;
    sectionA: string;
    sectionB: string;
    screenA: string;
    screenB: string;
  },
  categoryIds: string[],
  newId: NewId,
): Plan => {
  const tillId = newId();
  const receiptId = newId();
  const devices: PlanDevice[] = [
    { id: tillId, kind: "pos", name: names.till, receipt_printer_id: receiptId, device_id: null, x: COLUMN_X.front, y: 0 },
  ];
  const printers: PlanPrinter[] = [
    {
      id: receiptId, role: "receipt", name: names.receiptPrinter, connection: "usb", brand: null, ip: null,
      port: null, paper_mm: 80, host_device_id: tillId, x: COLUMN_X.front, y: ROW * 1.5,
    },
  ];
  const sections: PlanSection[] = [];

  if (setup === "till") {
    return { devices, printers, sections, till_prints_kitchen: true };
  }

  if (setup === "till_printer" || setup === "till_screen") {
    const sectionId = newId();
    const outId = newId();
    if (setup === "till_printer") {
      printers.push({
        id: outId, role: "kitchen", name: names.kitchenPrinter, connection: "network", brand: null,
        ip: null, port: 9100, paper_mm: 80, host_device_id: null, x: COLUMN_X.outputs, y: 0,
      });
    } else {
      devices.push({ id: outId, kind: "kitchen", name: names.kitchenScreen, receipt_printer_id: null, device_id: null, x: COLUMN_X.outputs, y: 0 });
    }
    sections.push({
      id: sectionId, name: names.kitchen, is_default: true, category_ids: [...categoryIds],
      screen_ids: setup === "till_screen" ? [outId] : [],
      printer_ids: setup === "till_printer" ? [outId] : [],
      x: COLUMN_X.sections, y: 0,
    });
    return { devices, printers, sections, till_prints_kitchen: false };
  }

  // Case 4: two sections, each with its own screen.
  const [a, b, sa, sb] = [newId(), newId(), newId(), newId()];
  devices.push(
    { id: sa, kind: "kitchen", name: names.screenA, receipt_printer_id: null, device_id: null, x: COLUMN_X.outputs, y: 0 },
    { id: sb, kind: "kitchen", name: names.screenB, receipt_printer_id: null, device_id: null, x: COLUMN_X.outputs, y: ROW * 1.5 },
  );
  sections.push(
    { id: a, name: names.sectionA, is_default: true, category_ids: [...categoryIds], screen_ids: [sa], printer_ids: [], x: COLUMN_X.sections, y: 0 },
    { id: b, name: names.sectionB, is_default: false, category_ids: [], screen_ids: [sb], printer_ids: [], x: COLUMN_X.sections, y: ROW * 1.5 },
  );
  return { devices, printers, sections, till_prints_kitchen: false };
};

// ── Checks (BB-7) ───────────────────────────────────────────────────────────

export type ProblemCode =
  | "section_no_output"
  | "section_no_name"
  | "section_duplicate_name"
  | "no_default_section"
  | "printer_no_host"
  | "printer_no_address"
  | "piece_no_name"
  | "pos_no_receipt_printer"
  | "screen_no_section"
  | "kitchen_printer_unused"
  | "no_pos";

export interface Problem {
  code: ProblemCode;
  /** Blocking problems would lose orders or can't be set up; saving waits for them. */
  blocking: boolean;
  piece: PieceRef | null;
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
export const isIpv4 = (s: string | null | undefined): boolean => !!s && IPV4.test(s.trim());

/**
 * Every problem with a plan, blocking first. The server runs the same blocking
 * checks and refuses the save; these are here so the person sees them while
 * drawing, next to the piece, rather than as a refusal after.
 */
export const checkPlan = (plan: Plan): Problem[] => {
  const out: Problem[] = [];
  const add = (code: ProblemCode, blocking: boolean, piece: PieceRef | null) => out.push({ code, blocking, piece });

  const names = new Map<string, number>();
  for (const s of plan.sections) {
    const n = s.name.trim().toLowerCase();
    if (n) names.set(n, (names.get(n) ?? 0) + 1);
  }
  for (const s of plan.sections) {
    const ref = { kind: "section" as const, id: s.id };
    if (!s.name.trim()) add("section_no_name", true, ref);
    else if ((names.get(s.name.trim().toLowerCase()) ?? 0) > 1) add("section_duplicate_name", true, ref);
    if (s.screen_ids.length === 0 && s.printer_ids.length === 0) add("section_no_output", true, ref);
  }
  if (plan.sections.length > 0 && plan.sections.filter((s) => s.is_default).length !== 1) {
    add("no_default_section", true, null);
  }
  for (const p of plan.printers) {
    const ref = { kind: "printer" as const, id: p.id };
    if (!p.name.trim()) add("piece_no_name", true, ref);
    if (p.connection === "network" && !isIpv4(p.ip)) add("printer_no_address", true, ref);
    if (p.connection !== "network" && !p.host_device_id) add("printer_no_host", true, ref);
    if (p.role === "kitchen" && !plan.sections.some((s) => s.printer_ids.includes(p.id))) {
      add("kitchen_printer_unused", false, ref);
    }
  }
  for (const d of plan.devices) {
    const ref = { kind: "device" as const, id: d.id };
    if (!d.name.trim()) add("piece_no_name", true, ref);
    if (d.kind === "pos" && !d.receipt_printer_id) add("pos_no_receipt_printer", false, ref);
    if (d.kind === "kitchen" && !plan.sections.some((s) => s.screen_ids.includes(d.id))) {
      add("screen_no_section", false, ref);
    }
  }
  if (!plan.devices.some((d) => d.kind === "pos") && (plan.printers.length > 0 || plan.sections.length > 0)) {
    add("no_pos", false, null);
  }
  return out.sort((a, b) => Number(b.blocking) - Number(a.blocking));
};

/** Categories no section claims; they go to the default section. */
export const unroutedCategories = (plan: Plan, categoryIds: string[]): string[] => {
  const routed = new Set(plan.sections.flatMap((s) => s.category_ids));
  return categoryIds.filter((c) => !routed.has(c));
};

// ── Changes (CH-4) ──────────────────────────────────────────────────────────

export interface PlanChange {
  added: PieceRef[];
  removed: PieceRef[];
  changed: PieceRef[];
}

/** What saving `next` over `prev` adds, removes and changes, for the review step. */
export const diffPlans = (prev: Plan, next: Plan): PlanChange => {
  const added: PieceRef[] = [];
  const removed: PieceRef[] = [];
  const changed: PieceRef[] = [];
  const compare = <T extends { id: string; x: number; y: number }>(kind: PieceKind, a: T[], b: T[]) => {
    const before = new Map(a.map((it) => [it.id, it]));
    const after = new Map(b.map((it) => [it.id, it]));
    for (const [id, it] of after) {
      const was = before.get(id);
      if (!was) added.push({ kind, id });
      else if (JSON.stringify({ ...was, x: 0, y: 0 }) !== JSON.stringify({ ...it, x: 0, y: 0 })) changed.push({ kind, id });
    }
    for (const id of before.keys()) if (!after.has(id)) removed.push({ kind, id });
  };
  compare("device", prev.devices, next.devices);
  compare("printer", prev.printers, next.printers);
  compare("section", prev.sections, next.sections);
  return { added, removed, changed };
};

export const samePlan = (a: Plan, b: Plan): boolean => JSON.stringify(a) === JSON.stringify(b);

// ── Routing mode (KS-8) ─────────────────────────────────────────────────────

export type RoutingMode = "off" | "till" | "kds" | "both";

/** The kitchen routing mode a plan implies — the server's `routing_mode_for`. */
export const routingModeFor = (plan: Plan): RoutingMode => {
  if (plan.sections.length === 0) return plan.till_prints_kitchen ? "till" : "off";
  if (!plan.sections.some((s) => s.screen_ids.length > 0)) return "till";
  return plan.till_prints_kitchen ? "both" : "kds";
};
