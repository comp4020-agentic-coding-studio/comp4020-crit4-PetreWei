import { describe, expect, it } from "vitest";
import {
  BEND_SEMITONES,
  MIN_TILT_GAIN,
  TILT_RANGE_DEG,
  bendFactor,
  tiltGainFactor,
} from "../src/scripts/motion.ts";

// The brief's line is that there should be no way to play it wrong. Tilt is
// the one input the player cannot see a scale for, so it is the one most able
// to break that promise: an unbounded bend, a gain that reaches silence, or a
// mapping that misbehaves at an odd grip would all make the phone feel broken
// rather than expressive. These pin the edges.

const SWEEP = Array.from({ length: 721 }, (_, i) => i - 360);

describe("motion: rolling the device bends the pitch", () => {
  it("does nothing at the reference grip, whatever that grip was", () => {
    for (const ref of [-90, -37.5, 0, 12, 88]) {
      expect(bendFactor(ref, ref)).toBe(1);
    }
  });

  it("bends up to the right and down to the left", () => {
    expect(bendFactor(TILT_RANGE_DEG, 0)).toBeCloseTo(2 ** (BEND_SEMITONES / 12), 10);
    expect(bendFactor(-TILT_RANGE_DEG, 0)).toBeCloseTo(2 ** (-BEND_SEMITONES / 12), 10);
  });

  it("is symmetric, so a wobble returns to the note it left", () => {
    for (const d of [1, 7, 19, 40, 200]) {
      expect(bendFactor(d, 0) * bendFactor(-d, 0)).toBeCloseTo(1, 10);
    }
  });

  it("clamps past full roll instead of running away", () => {
    const full = bendFactor(TILT_RANGE_DEG, 0);
    for (const d of [TILT_RANGE_DEG, 90, 180, 1e6]) {
      expect(bendFactor(d, 0)).toBeCloseTo(full, 10);
    }
  });

  it("stays inside a semitone range across every reading", () => {
    const max = 2 ** (BEND_SEMITONES / 12);
    for (const g of SWEEP) {
      const f = bendFactor(g, 0);
      expect(Number.isFinite(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(1 / max - 1e-12);
      expect(f).toBeLessThanOrEqual(max + 1e-12);
    }
  });

  it("measures from the reference, not from level", () => {
    // Playing while lying on your side must feel the same as sitting upright.
    expect(bendFactor(75, 65)).toBeCloseTo(bendFactor(10, 0), 10);
  });
});

describe("motion: tipping the device damps the volume", () => {
  it("leaves the note alone at the reference grip", () => {
    for (const ref of [-40, 0, 45, 130]) {
      expect(tiltGainFactor(ref, ref)).toBe(1);
    }
  });

  it("damps as the device tips away from the player", () => {
    expect(tiltGainFactor(-TILT_RANGE_DEG, 0)).toBeCloseTo(MIN_TILT_GAIN, 10);
    expect(tiltGainFactor(-TILT_RANGE_DEG / 2, 0)).toBeLessThan(1);
    expect(tiltGainFactor(-TILT_RANGE_DEG / 2, 0)).toBeGreaterThan(MIN_TILT_GAIN);
  });

  it("never damps all the way to silence, which would read as broken", () => {
    for (const b of SWEEP) {
      expect(tiltGainFactor(b, 0)).toBeGreaterThanOrEqual(MIN_TILT_GAIN);
    }
  });

  it("never makes a note louder than the touch asked for", () => {
    for (const b of SWEEP) {
      expect(tiltGainFactor(b, 0)).toBeLessThanOrEqual(1);
    }
  });

  it("is monotonic, so damping feels like one continuous move", () => {
    let previous = tiltGainFactor(-360, 0);
    for (const b of SWEEP) {
      const current = tiltGainFactor(b, 0);
      expect(current).toBeGreaterThanOrEqual(previous - 1e-12);
      previous = current;
    }
  });
});
