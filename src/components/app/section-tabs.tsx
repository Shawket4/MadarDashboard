/**
 * Section-level route tabs (Access: Users · Roles & Permissions).
 *
 * Tabs are rendered by the page's own PageHeader in its `below` row, so the
 * title sits at the same position as on every other page. A section layout
 * wraps its <Outlet/> in <SectionTabsProvider>.
 */
export { SectionTabsProvider, SectionTabBar, type SectionTab } from "@/components/app/page";
