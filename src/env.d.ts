/// <reference types="vite/client" />

// Typed view over the Vite env vars this app reads. `vite/client` falls back to
// `any` for unknown keys, so declaring them keeps typos visible.
interface ImportMetaEnv {
  /** Self-hosted Sentry DSN. Unset/blank ⇒ Sentry is disabled entirely. */
  readonly VITE_SENTRY_DSN?: string;
  /** Overrides the release injected at build time (`madar-dashboard@<version>`). */
  readonly VITE_SENTRY_RELEASE?: string;
  /** Overrides the Sentry environment (defaults to Vite's `MODE`). */
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** `0`..`1`. Defaults to 0.1. */
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  /** `0`..`1`. Defaults to 0.1. */
  readonly VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  /** `0`..`1`. Defaults to 1.0 — always keep the replay of an erroring session. */
  readonly VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string;
}
