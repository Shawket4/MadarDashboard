/* eslint-disable */
// @ts-nocheck

export interface ProcessingGroupRef {
  /**
     * Always null while processing.
     * @nullable
     */
  group_id?: string | null;
  job_id: string;
  /** `processing` */
  status: string;
}
