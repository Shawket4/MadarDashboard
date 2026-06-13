# Sufrix Design System (rebuild v2)

A token-driven system defined entirely in `src/styles/globals.css` via Tailwind v4
`@theme`. Brand hues are kept; everything else was reimagined.

## Brand
- Navy `#0A2540` · Terracotta `#C25B3F` · Cream `#F4F1EC` · Leaf `#2A4D3E`
- Expressed in **OKLCH** for perceptual consistency and smooth dark-mode ramps.

## Color tokens (semantic)
Use the Tailwind classes, never raw hex:
- Surfaces: `bg-background` / `text-foreground`, `bg-card`, `bg-popover`, `bg-muted`
- Actions: `bg-primary` (navy; terracotta in dark), `bg-secondary`, `bg-accent`
- Brand accent / CTA: `bg-brand` (terracotta), focus `ring-ring` (terracotta)
- Status: `bg-destructive`, `bg-success`, `bg-warning`, `bg-info` (+ `-foreground`)
- Charts: `var(--chart-1..6)` via `CHART_COLORS` / `chartColor(i)` (theme-aware → fixes dark charts)
- Sidebar: `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary`, … (deep navy rail, terracotta active)

Dark mode = `.dark` class on `<html>`, driven by `lib/theme.ts` (`useTheme`), persisted at `sufrix.theme`.

## Typography
- Latin: **Inter Variable**; Arabic: **IBM Plex Sans Arabic** (self-hosted via fontsource, offline-ready).
- One stack (`font-sans`) — Arabic glyphs fall through automatically; RTL also sets `font-arabic`.
- Metrics/tables use `.tabular` (tabular-nums).

## Spacing / radius / motion
- Radius scale from `--radius` (0.75rem): `rounded-sm/md/lg/xl`.
- Motion vocabulary in `lib/motion.ts` (`fadeIn`, `fadeInUp`, `scaleIn`, `staggerContainer`, `listItem`).
  App is wrapped in `<MotionConfig reducedMotion="user">` — all motion respects OS preference.

## RTL (first-class)
- `dir` is set once on `<html>` from i18n (`applyHtmlDir`). **No per-component `dir=` ternaries.**
- Use **logical properties**: `ps/pe`, `ms/me`, `start/end`, `text-start/text-end`.

## Components
- **Primitives** (`components/ui/*`): canonical shadcn/ui on the unified `radix-ui` package.
  `Button` is extended with a `loading` prop and a `brand` variant.
- **Composites** (`components/app/*`):
  - `Page` (centered, padded, fade-in) + `PageHeader` (title/description/actions)
  - `StatCard` (icon + value + trend, motion), `ChartCard` (themed Recharts wrapper)
  - `EmptyState`, `ComingSoon` (phase placeholder)
- **Layout** (`components/layout/*`): `AppSidebar`, `AppHeader`, `ScopeBar`, `CommandPalette`,
  `ThemeToggle`, `LanguageToggle`, `UserMenu`.

## Density (Balanced)
Compact, efficient tables/analytics; comfortable spacing for dashboard, settings, onboarding.

## Responsiveness
Mobile-first. Sidebar collapses to icons on desktop and becomes a Sheet on mobile.
Target breakpoints: 360 / 768 / 1280. (Tables degrade to cards — added with `DataTable` in Phase 1.)

## Adding tokens
Add the CSS var in `:root` (+ `.dark`) and map it under `@theme inline` so a utility class is generated.
