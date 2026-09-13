/* eslint-disable */
// @ts-nocheck

/**
 * Upload accepted: the picture is converted by the background asset worker.
 * `image_url` is the row's current legacy URL (unchanged until the job is
 * done); poll `GET /assets/jobs/{asset_job_id}`.
 */
export interface UploadResponse {
  asset_job_id: string;
  /** @nullable */
  image_url?: string | null;
  /** `processing` */
  status: string;
}
