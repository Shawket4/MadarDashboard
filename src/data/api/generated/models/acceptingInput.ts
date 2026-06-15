/* eslint-disable */
// @ts-nocheck

export interface AcceptingInput {
  branch_id: string;
  /** "in_mall" | "outside" */
  channel: string;
  /** "auto" | "open" | "closed". Named `mode` (not `override`) because a bare
   * `override` field is a reserved word in Dart and breaks the POS client
   * code generator. */
  mode: string;
}
