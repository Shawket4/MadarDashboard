# Claude Code Conventions: Madar Dashboard

## Project Overview
This is the MadarDashboard frontend project. It is a React 19 web application built with Vite and packaged as a desktop application using Tauri. It provides the management interface for the Madar ecosystem.

## Core Technology Stack
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Desktop Packaging**: Tauri (`@tauri-apps/api`, `@tauri-apps/plugin-http`)
- **State Management**: Zustand (global state) & TanStack React Query (server state)
- **Routing**: React Router (`react-router-dom` v7)
- **API Client Generation**: Orval (generates hooks from OpenAPI) & Axios

## UI & Styling
- **Styling**: Tailwind CSS with `tailwindcss-animate`
- **Components**: Radix UI Primitives (headless components)
- **Icons & Animations**: Lucide React, Lottie (`@lottiefiles/dotlottie-react`)
- **Tables & Charts**: TanStack React Table, Recharts
- **Forms & Validation**: React Hook Form, Zod

## Internationalization (i18n)
- Uses `i18next` and `react-i18next`. Always wrap UI strings in translation hooks `useTranslation()`.

## Development Commands
- **Run Web Dev Server**: `npm run dev`
- **Run Tauri Desktop Server**: `npm run tauri:dev`
- **Type Check & Build Web**: `npm run build`
- **Build Tauri App**: `npm run tauri:build`
- **Run Tests**: `npm run test` (Vitest)
- **Lint**: `npm run lint`
- **Generate API Client**: `npm run generate:api` (Uses Orval)

## Architecture Guidelines
1. **API Integration**: Do not write manual fetch calls. Use `npm run generate:api` to update the React Query hooks via Orval when the backend OpenAPI schema changes.
2. **Components**: Use Radix UI primitives as the foundation for accessible components, styled with Tailwind via `clsx` and `tailwind-merge`.
3. **Forms**: All forms must be strictly typed using Zod schemas and controlled via React Hook Form.

## Related Projects (Ecosystem)
When working on API integrations, data fetching, or checkout flows, you may need to reference the backend or POS system. You can find them at:
- **Madar Backend**: `/Users/shawket/Desktop/MadarRust` (Actix-Web Rust backend)
- **Madar POS**: `/Users/shawket/Desktop/madar_pos` (Flutter Point of Sale)
You can use file read commands or `cd` into these directories to analyze backend endpoints, OpenAPI schemas, or POS behavior.

## Design Context
Strategic design intent lives in [`PRODUCT.md`](PRODUCT.md); the visual system lives in [`DESIGN.md`](DESIGN.md) (tokens) and `src/styles/globals.css` (source of truth). Key facts for any UI work:
- **Register is split.** The authenticated dashboard is **product** (design serves the task — quiet, precise, restrained). The customer surfaces (`landing`, `/order/:orgId`, `/track/:id`) are **brand** (design is the product — bold, editorial, hospitable). Match the register to the surface.
- **Personality:** trustworthy, hospitable, precise. Navy = trust, terracotta = warmth/CTA, cream = hospitality. Bilingual EN/AR with first-class RTL.
- **Accessibility bar:** WCAG 2.1 AAA where feasible (AA floor). RTL parity and `prefers-reduced-motion` are correctness requirements, not extras.
- **Anti-references (never):** generic SaaS-cream template, loud delivery-app neon, enterprise-grey snoozefest, consumer toy-like.
