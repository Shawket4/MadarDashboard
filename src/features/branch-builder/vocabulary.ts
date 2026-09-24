/**
 * The builder's words and glyphs, in one place so the canvas, the inspector
 * and the problems list call each piece the same thing.
 */
import type { TFunction } from "i18next";
import {
  ChefHat, LayoutGrid, Monitor, Printer, ReceiptText, TabletSmartphone, type LucideIcon,
} from "lucide-react";

import type { DeviceKind, LinkKind, Plan, PieceRef, Problem, Setup } from "./plan";

export const DEVICE_ICON: Record<DeviceKind, LucideIcon> = {
  pos: Monitor,
  waiter: TabletSmartphone,
  kitchen: LayoutGrid,
};

export const PRINTER_ICON = { receipt: ReceiptText, kitchen: Printer } as const;
export const SECTION_ICON = ChefHat;

export const deviceKindLabel = (t: TFunction, kind: DeviceKind): string =>
  ({
    pos: t("builder.kind.pos", "POS"),
    waiter: t("builder.kind.waiter", "Waiter tablet"),
    kitchen: t("builder.kind.kitchen", "Kitchen screen"),
  })[kind];

export const printerRoleLabel = (t: TFunction, role: "receipt" | "kitchen"): string =>
  role === "receipt" ? t("builder.kind.receiptPrinter", "Receipt printer") : t("builder.kind.kitchenPrinter", "Kitchen printer");

export const connectionLabel = (t: TFunction, c: string): string =>
  ({
    network: t("builder.connection.network", "Network"),
    usb: t("builder.connection.usb", "USB"),
    bluetooth: t("builder.connection.bluetooth", "Bluetooth"),
  })[c] ?? c;

export const linkLabel = (t: TFunction, kind: LinkKind): string =>
  ({
    shows: t("builder.link.shows", "Shows on"),
    prints: t("builder.link.prints", "Prints on"),
    receipt: t("builder.link.receipt", "Receipts"),
    host: t("builder.link.host", "Plugged into"),
  })[kind];

export const setupLabel = (t: TFunction, s: Setup): { title: string; body: string } =>
  ({
    till: {
      title: t("builder.setup.till", "Till only"),
      body: t("builder.setup.tillBody", "A POS and its receipt printer. Kitchen chits, if any, print on the same printer."),
    },
    till_printer: {
      title: t("builder.setup.tillPrinter", "Till and kitchen printer"),
      body: t("builder.setup.tillPrinterBody", "Every order prints on one printer in the kitchen."),
    },
    till_screen: {
      title: t("builder.setup.tillScreen", "Till and kitchen screen"),
      body: t("builder.setup.tillScreenBody", "Every order shows on one kitchen screen that holds all categories."),
    },
    sections: {
      title: t("builder.setup.sections", "Kitchen sections"),
      body: t("builder.setup.sectionsBody", "The kitchen is split into sections. Each gets only its own items, on its own screens or printers."),
    },
  })[s];

/** A piece's name as the plan holds it, for sentences about it. */
export const pieceName = (plan: Plan, ref: PieceRef | null): string => {
  if (!ref) return "";
  const list = ref.kind === "device" ? plan.devices : ref.kind === "printer" ? plan.printers : plan.sections;
  return (list as { id: string; name: string }[]).find((x) => x.id === ref.id)?.name.trim() ?? "";
};

export const problemText = (t: TFunction, plan: Plan, p: Problem): string => {
  const name = pieceName(plan, p.piece) || t("builder.unnamed", "Unnamed");
  switch (p.code) {
    case "section_no_output":
      return t("builder.problem.sectionNoOutput", "{{name}} has no screen or printer, so its orders would go nowhere.", { name });
    case "section_no_name":
      return t("builder.problem.sectionNoName", "A section needs a name.");
    case "section_duplicate_name":
      return t("builder.problem.sectionDuplicate", "Two sections are called {{name}}.", { name });
    case "no_default_section":
      return t("builder.problem.noDefault", "One section must take the items no other section claims.");
    case "printer_no_host":
      return t("builder.problem.printerNoHost", "{{name}} is plugged in, but not into a device. Link it to the device it is plugged into.", { name });
    case "printer_no_address":
      return t("builder.problem.printerNoAddress", "{{name}} is on the network but has no IP address.", { name });
    case "piece_no_name":
      return t("builder.problem.pieceNoName", "Every device and printer needs a name.");
    case "pos_no_receipt_printer":
      return t("builder.problem.posNoReceipt", "{{name}} has no receipt printer.", { name });
    case "screen_no_section":
      return t("builder.problem.screenNoSection", "{{name}} shows no section yet, so it will stay empty.", { name });
    case "kitchen_printer_unused":
      return t("builder.problem.printerUnused", "{{name}} is not linked to a section, so nothing prints on it.", { name });
    case "no_pos":
      return t("builder.problem.noPos", "The branch has no POS to take orders.");
  }
};
