import { fmtMoney } from "@/lib/format";

import type { Step } from "./types";

/** The order of the flow, for telling a step forward from a step back. */
export const STEP_ORDER: Step[] = ["branch", "channel", "phone", "location", "menu", "checkout", "done"];

/** fmtMoney for a figure mid-tween (whole piastres only). */
export const fmtMoneyFigure = (n: number) => fmtMoney(Math.round(n));
