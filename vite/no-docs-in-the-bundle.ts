import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * Keep documentation out of the deployed bundle.
 *
 * Vite copies `publicDir` VERBATIM — every file, whatever it is — so the
 * `README.md` sitting beside the screenshots to explain what they are was
 * published at `/order/screenshots/README.md` on every shop's own hostname.
 * Harmless content, but it is a build artifact on a customer-facing origin, and
 * the next note anyone writes next to an asset ships the same way.
 *
 * Deleting after the copy rather than moving the files: a README belongs beside
 * what it documents, and asking everyone to remember that `public/` is
 * world-readable is the arrangement that already failed once.
 *
 * The compression plugin runs over the same directory, so `.md.br` and `.md.gz`
 * go too — otherwise nginx's `gzip_static` would happily serve the compressed
 * copy of a file that is no longer there.
 */
/** A documentation file, including whatever the compressor made of it. */
export const isDoc = (name: string): boolean =>
  /\.(md|markdown)(\.br|\.gz)?$/i.test(name);

export function noDocsInTheBundle(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "no-docs-in-the-bundle",
    // Never in dev: `publicDir` is served from source there, and nothing is
    // being written that could be deleted.
    apply: "build",
    // After the compression plugin, so its output is swept too.
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const root = path.resolve(config.root, config.build.outDir);
      const walk = async (dir: string): Promise<void> => {
        let entries;
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch {
          // No output directory means nothing to clean, which is not an error
          // worth failing a build over.
          return;
        }
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) await walk(full);
          else if (isDoc(e.name)) await rm(full, { force: true });
        }
      };
      await walk(root);
    },
  };
}
