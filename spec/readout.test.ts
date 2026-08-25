import { describe, expect, it } from "vitest";
import { bendFactor, TILT_RANGE_DEG } from "../src/scripts/motion.ts";
import { MAX_FREQ, MIN_FREQ } from "../src/scripts/range.ts";
import { IDLE_READOUT, READOUT_WIDTH, formatHz } from "../src/scripts/readout.ts";

// CLAUDE.md: never show a plausible-looking guess — fail visibly, or show
// nothing. A frequency meter is the easiest place in this prototype to break
// that, because every wrong answer it can give still looks like a reading.

describe("readout: the cabinet's frequency meter", () => {
  it("reports a real frequency to a tenth of a hertz", () => {
    expect(formatHz(440)).toBe("440.0");
    expect(formatHz(110)).toBe("110.0");
    expect(formatHz(880)).toBe("880.0");
    expect(formatHz(261.6255653)).toBe("261.6");
  });

  it("moves on a glide small enough to be inside one semitone", () => {
    // ~0.5 Hz apart, far less than a semitone at this pitch: the meter should
    // still visibly change, or it looks frozen while the note is moving.
    expect(formatHz(440)).not.toBe(formatHz(440.5));
  });

  it("shows dashes when nothing is sounding", () => {
    expect(formatHz(null)).toBe(IDLE_READOUT);
    expect(formatHz(undefined)).toBe(IDLE_READOUT);
  });

  it("shows dashes rather than a number that isn't one", () => {
    // Includes the values that would render the words NaN or Infinity into the
    // cabinet: asserting the exact idle string covers that strictly, so there
    // is no separate weaker "doesn't contain NaN" test to outlive this one.
    for (const bad of [NaN, Infinity, -Infinity, 0, -1, -440]) {
      expect(formatHz(bad)).toBe(IDLE_READOUT);
    }
  });

  it("reserves enough room for the widest reading the instrument can play", () => {
    // Derived, not restated. The old version wrote `110 / 1.5` and `880 * 1.5`,
    // where 1.5 stood in for the real bend of 2 ** (7/12) = 1.4983 and 110/880
    // were copies of MIN_FREQ/MAX_FREQ. Change the bend depth or the range and
    // that test went green against a range the instrument no longer had.
    const fullBend = bendFactor(TILT_RANGE_DEG, 0);
    const widest = Math.max(
      ...[MIN_FREQ / fullBend, MIN_FREQ, MAX_FREQ, MAX_FREQ * fullBend].map(
        (f) => formatHz(f).length,
      ),
    );
    // READOUT_WIDTH is what Instrument.astro reserves on the meter, so this is
    // the one assertion that keeps the reserve and the range in step.
    expect(widest).toBeLessThanOrEqual(READOUT_WIDTH);
  });
});
