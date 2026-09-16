/* eslint-disable */
// @ts-nocheck
import type { GrantView } from './grantView';

export interface RoleView {
  /** The owner role holds everything and is not editable. */
  editable: boolean;
  grants: GrantView[];
  id: string;
  is_system: boolean;
  key: string;
  /** What the role behaves like on older tablets, and its core grants. */
  kind: string;
  members: number;
  name_ar: string;
  name_en: string;
}
