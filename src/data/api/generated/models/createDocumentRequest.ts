/* eslint-disable */
// @ts-nocheck

export interface CreateDocumentRequest {
  /** @nullable */
  expires_on?: string | null;
  /** A path returned by the existing `/uploads` endpoints. */
  file_url: string;
  /** @nullable */
  kind?: string | null;
  title: string;
}
