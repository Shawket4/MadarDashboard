/**
 * What a scanned or typed string is: a whole member card, a phone (in its
 * canonical form), or not yet either. The rule is madar-shared's
 * `madar_ids::scan::classify`, the one the POS till runs, called through
 * WebAssembly; scan.test.ts runs it against the shared `scan_vectors.json`.
 */
import { rules } from "@/lib/rules";

export type ScanKind = "token" | "phone" | "partial";
export interface Scan {
  kind: ScanKind;
  /** The cleaned value to look up; empty while `partial`. */
  value: string;
}

export const classifyScan = (raw: string): Scan => rules.scan_classify(raw);
