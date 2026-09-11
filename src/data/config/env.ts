import { z } from "zod";

/**
 * Where the API lives: either an absolute origin
 * (`https://api.madar-pos.cloud`) or a ROOT-RELATIVE path (`/api`).
 *
 * The relative form is not a convenience. The two `:shop` bundles are ONE
 * artifact served from EVERY branded shop's hostname, so there is no single
 * origin to bake into them — the shop vhost proxies `/api/` to the backend and
 * the bundle asks its own origin.
 *
 * This used to be `z.string().url()`, which rejects `/api`. The deploy has
 * always passed `/api` for those two builds, so they shipped with an env var
 * that failed validation at boot: the bundle threw before rendering anything,
 * while nginx served it with a perfectly good `200 text/html`. Every check that
 * looked at the response passed. The page was blank.
 *
 * Protocol-relative (`//somewhere.else`) is excluded deliberately — it reads as
 * a path and behaves as a different origin.
 */
const apiBase = z.union([
  z.string().url(),
  z
    .string()
    .regex(/^\/(?!\/)\S*$/, "a root-relative API base looks like /api"),
]);

const envSchema = z.object({
  VITE_API_URL: apiBase.default("http://localhost:8080"),
  VITE_APP_NAME: z.string().default("Madar"),
  // Origin of the management dashboard. The standalone landing (get.madar-pos.cloud)
  // links its "Sign in" / "Get started" CTAs here, cross-origin — so this one is
  // absolute always; a relative path would point at whatever host is serving.
  VITE_DASHBOARD_URL: z.string().url().default("https://madar-pos.cloud"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see console.");
}

export const env = parsed.data;

/** The schema, exported so a test can check what the deploy actually passes. */
export const __envSchema = envSchema;
