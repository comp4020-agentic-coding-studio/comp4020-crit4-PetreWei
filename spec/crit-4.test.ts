import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DIST, pages } from "./built-site.ts";

// This week's brief: turn the page into a playable instrument. The published
// spec (comp.anu.edu.au/.../crits/04-instrument/) has lines no test can hold —
// "expressive", "a stranger can play it uninstructed", "no way to play it
// wrong" — those are judged live at the crit, by ear and by hand. What follows
// covers only the lines with a mechanical answer.
// Reading dist/ lives in ./built-site.ts, shared with the other spec files.

// A script counts whether it's inlined or linked — read both so the check
// survives a build that bundles differently.
function scriptTextFor(name: string, doc: Document): string {
  const scripts = [...doc.querySelectorAll("script")];
  return scripts
    .map((script) => {
      if (script.src) {
        const path = resolve(dirname(join(DIST, name)), script.getAttribute("src") ?? "");
        try {
          return readFileSync(path, "utf8");
        } catch {
          return "";
        }
      }
      return script.textContent ?? "";
    })
    .join("\n");
}

describe("crit 4: an instrument", () => {
  for (const { name, doc } of pages) {
    describe(name, () => {
      it("makes sound live, rather than playing a recording", () => {
        // "the browser is the instrument — sound is made live in the page by
        // the player, not played back". A shipped <audio>/<video> element
        // with a source is a played-back track; the Web Audio API is how you
        // synthesize live instead.
        const playback = doc.querySelectorAll("audio[src], video[src], source");
        expect(
          playback.length,
          "an <audio>/<video> element with a source plays back a recording — synthesize the sound instead",
        ).toBe(0);
      });

      it("uses the Web Audio API to synthesize sound", () => {
        const script = scriptTextFor(name, doc);
        expect(
          /AudioContext/.test(script),
          "no reference to (Audio|webkitAudio)Context found — this checks for live synthesis, not any particular sound",
        ).toBe(true);
      });

      it("exposes its controls as real, keyboard-reachable elements", () => {
        // "playable with whatever is at hand — mouse, keyboard or touch".
        // A real <button> (or a link with an href) is reachable by Tab and
        // announced by a screen reader; a bare div/span with only a click
        // handler is mouse- or touch-only.
        const clickableNonInteractive = [...doc.querySelectorAll("[onclick], .btn, .button")].filter(
          (el) => !["BUTTON", "A", "INPUT"].includes(el.tagName),
        );
        expect(
          clickableNonInteractive.length,
          "found a clickable-looking element that isn't a real <button>/<a>/<input> — it won't be keyboard- or touch-reachable",
        ).toBe(0);
      });
    });
  }
});
