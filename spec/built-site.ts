import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";

// Shared reading of the BUILT site, because every contract in here checks what
// actually ships rather than the source. Three spec files had grown their own
// identical copy of this walk; they had already drifted cosmetically, and the
// next change to it (an ignored directory, a different path shape) would have
// had to land in all three or silently diverge.
//
// Not named *.test.ts on purpose, so vitest doesn't collect it as a suite.

const DIST = resolve("dist");

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
  /** Every script the page runs, inline or linked, concatenated. */
  scripts: string;
}

/**
 * Every script a page runs, inline or linked, concatenated. Lives here rather
 * than in a spec file because resolving a `src` against dist is exactly the
 * "how you read the built site" knowledge this module exists to hold --- it was
 * the last thing reaching for the raw DIST path from outside.
 */
function scriptTextFor(name: string, doc: Document): string {
  return [...doc.querySelectorAll("script")]
    .map((script) => {
      const src = script.getAttribute("src");
      if (!src) return script.textContent ?? "";
      try {
        return readFileSync(resolve(dirname(join(DIST, name)), src), "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");
}

/** Every HTML page the build emitted, parsed once. */
export const pages: readonly Page[] = shipped
  .filter((name) => name.endsWith(".html"))
  .map((name) => ({
    name,
    doc: new JSDOM(readFileSync(join(DIST, name), "utf8")).window.document,
  }))
  .map((page) => ({ ...page, scripts: scriptTextFor(page.name, page.doc) }));

/** One page by its dist-relative name, or null if the build didn't emit it. */
export function pageNamed(name: string): Document | null {
  return pages.find((page) => page.name === name)?.doc ?? null;
}
