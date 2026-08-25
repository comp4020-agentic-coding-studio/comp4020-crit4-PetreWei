import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";

// Shared reading of the BUILT site, because every contract in here checks what
// actually ships rather than the source. Three spec files had grown their own
// identical copy of this walk; they had already drifted cosmetically, and the
// next change to it (an ignored directory, a different path shape) would have
// had to land in all three or silently diverge.
//
// Not named *.test.ts on purpose, so vitest doesn't collect it as a suite.

export const DIST = resolve("dist");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Everything the build emitted, as dist-relative POSIX paths. */
export const shipped: readonly string[] = walk(DIST).map((path) =>
  relative(DIST, path).split(sep).join("/"),
);

export interface Page {
  /** dist-relative POSIX path, e.g. "index.html" or "zh.html". */
  name: string;
  doc: Document;
}

/** Every HTML page the build emitted, parsed once. */
export const pages: readonly Page[] = shipped
  .filter((name) => name.endsWith(".html"))
  .map((name) => ({
    name,
    doc: new JSDOM(readFileSync(join(DIST, name), "utf8")).window.document,
  }));

/** One page by its dist-relative name, or null if the build didn't emit it. */
export function pageNamed(name: string): Document | null {
  return pages.find((page) => page.name === name)?.doc ?? null;
}
