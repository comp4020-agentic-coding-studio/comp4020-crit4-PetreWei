import { describe, expect, it } from "vitest";
import { IDLE_READOUT, formatHz } from "../src/scripts/readout.ts";

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
    for (const bad of [NaN, Infinity, -Infinity, 0, -440]) {
      expect(formatHz(bad)).toBe(IDLE_READOUT);
    }
  });

  it("never renders NaN or Infinity into the page", () => {
    const samples = [NaN, Infinity, -Infinity, 0, -1, 1e-9, 1e9, 12345.6789];
    for (const s of samples) {
      const out = formatHz(s);
      expect(out).not.toMatch(/NaN|Infinity/);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  it("stays narrow enough not to jog the cabinet's layout", () => {
    // The full played range, bent as far as the tilt allows either way.
    const bent = [110 / 1.5, 110, 440, 880, 880 * 1.5];
    for (const f of bent) {
      expect(formatHz(f).length).toBeLessThanOrEqual(7);
    }
  });
});
