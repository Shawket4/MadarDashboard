/* eslint-disable */
// @ts-nocheck

export interface StatusInput {
  /**
     * Target line step: "confirmed" | "preparing" | "ready" | "out_for_delivery".
     * The teller may jump to ANY of these from any non-terminal state (forward or
     * back); the landed step is stamped and all other step stamps are cleared, and
     * at most one customer WhatsApp fires (the last newly-crossed step that has one).
     */
  status: string;
}
