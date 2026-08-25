import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The sensor for PROCESS.md moment 8.
//
// The language switch shipped a hand-calculated 5.4:1 and measured 4.10:1 at
// 320px: the colours were fine, the *background* wasn't what the arithmetic
// assumed, because the stage vignette is sized in viewport units so the corner
// the nav sits in is lighter on a phone than on a desktop. Nothing in the CSS
// says that. Without a check, the next person to dim this brass reintroduces a
// sub-4.5:1 fail with `pnpm check` still green.
//
// What this can and cannot do: JSDOM lays nothing out and has no pixels, and
// there is no browser in CI to sample from, so the background here is a
// RECORDED MEASUREMENT rather than a derivation --- the lightest value actually
// sampled behind the nav by /tmp/pwtest/measure-zh.mjs, which hides the
// lettering, screenshots the patch it occupied and averages it. That makes the
// number an input, and an input can go stale. So the stage background it was
// measured against is fingerprinted below: change the gradient and this test
// goes red asking to be re-measured, rather than quietly certifying a ratio
// against a room that has been repainted.
const CSS = readFileSync(resolve("src/styles/global.css"), "utf8");

/**
 * Lightest background actually sampled behind the nav, across 1920x1080,
 * 390x844 and 320x568, on both language pages. 320px was the worst case.
 */
const MEASURED_BACKGROUND: readonly [number, number, number] = [64, 45, 30];

/**
 * The stage background those samples were taken against. If this no longer
 * matches, MEASURED_BACKGROUND describes a room that no longer exists.
 */
const MEASURED_AGAINST = "3be629d78b5d";

/** WCAG 2.1 minimum for text below 18.66px bold / 24px regular. */
const FLOOR = 4.5;

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: readonly [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const [hi, lo] = luminance(a) >= luminance(b) ? [luminance(a), luminance(b)] : [luminance(b), luminance(a)];
  return (hi + 0.05) / (lo + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const full =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(1);
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** The `color` a rule sets, read out of the stylesheet source. */
function colorOf(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = new RegExp(`(?:^|\\})[^{}]*${escaped}\\s*\\{([^}]*)\\}`, "m").exec(CSS);
  if (!rule) throw new Error(`no rule for ${selector} in global.css`);
  const color = /(?:^|;|\s)color:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(rule[1]!);
  if (!color) throw new Error(`${selector} sets no hex color`);
  return color[1]!;
}

describe("contrast: the lettering over the stage", () => {
  it("is still being measured against the background it was measured against", () => {
    const stage = /#stage\s*\{([^}]*)\}/.exec(CSS);
    expect(stage, "no #stage rule found").not.toBeNull();
    const background = /background:([^;]*);/
      .exec(stage![1]!)![1]!
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
    const fingerprint = createHash("sha256").update(background).digest("hex").slice(0, 12);
    expect(
      fingerprint,
      "the stage background changed, so the recorded background behind the nav is stale: " +
        "re-run the contrast measurement at 1920, 390 and 320 and update " +
        "MEASURED_BACKGROUND and MEASURED_AGAINST together",
    ).toBe(MEASURED_AGAINST);
  });

  // Both marks sit in the same corner over the same stage, and both are small
  // text, so both answer to the 4.5 floor.
  for (const selector of [".wordmark", ".lang-switch"]) {
    it(`${selector} clears ${FLOOR}:1 against the lightest background it sits on`, () => {
      const ratio = contrast(hexToRgb(colorOf(selector)), MEASURED_BACKGROUND);
      expect(
        Number(ratio.toFixed(2)),
        `${selector} is ${colorOf(selector)} on rgb(${MEASURED_BACKGROUND.join(",")}) ` +
          `= ${ratio.toFixed(2)}:1. Buy hierarchy with weight and tracking, not brightness.`,
      ).toBeGreaterThanOrEqual(FLOOR);
    });
  }

  it("keeps the mark the brighter of the two", () => {
    // The switch is meant to read as the quieter one. It is allowed to be equal
    // --- what it must not do is out-shout the mark to win the contrast check.
    const mark = luminance(hexToRgb(colorOf(".wordmark")));
    const swtch = luminance(hexToRgb(colorOf(".lang-switch")));
    expect(swtch).toBeLessThanOrEqual(mark);
  });
});
