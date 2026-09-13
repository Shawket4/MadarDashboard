import type { ReactNode } from "react";

import { SectionHeader } from "@/components/app/section-header";

/**
 * A settings pane's heading. The shell owns the page title ("Settings"), so a
 * pane opens with a section header — never a second h1-sized title.
 */
export function PaneHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <SectionHeader
      title={title}
      description={description}
      trailing={actions}
      className="items-start"
    />
  );
}
