// The motion mapping, kept out of the DOM so it can be tested directly.
//
// On a phone the hand holding the device is the hand a theremin player waves.
// Rolling it bends the pitch; tipping it away damps the volume, the way moving
// a hand toward the volume loop does. Both are measured as a deviation from a
// reference reading taken when the note started, so any grip is neutral.

/** Bend depth at full roll, either side of centre. */
export const BEND_SEMITONES = 7;

/** Degrees of tilt that reach full effect. Beyond this it clamps. */
export const TILT_RANGE_DEG = 40;

/** Quietest a full tip-away can get. Not zero: silence reads as broken. */
export const MIN_TILT_GAIN = 0.08;

export function clampUnit(n: number): number {
  return Math.min(Math.max(n, -1), 1);
}

/**
 * Multiplier on the touch-set frequency. 1 at centre, rising as the device
 * rolls right and falling as it rolls left, clamped to +/- BEND_SEMITONES.
 */
export function bendFactor(liveGamma: number, refGamma: number): number {
  const offset = clampUnit((liveGamma - refGamma) / TILT_RANGE_DEG);
  return 2 ** ((offset * BEND_SEMITONES) / 12);
}

/**
 * Multiplier on the touch-set gain. Tipping the device away from you (beta
 * falling below the reference) damps toward MIN_TILT_GAIN; tipping it back
 * does nothing, so tilt can only ever quieten a note, never overdrive one.
 */
export function tiltGainFactor(liveBeta: number, refBeta: number): number {
  const offset = clampUnit((liveBeta - refBeta) / TILT_RANGE_DEG);
  if (offset >= 0) return 1;
  // Interpolating up from the floor rather than down from 1: algebraically the
  // same, but it lands on exactly MIN_TILT_GAIN at full tip instead of a float
  // hair below it, so the floor is a floor.
  return MIN_TILT_GAIN + (1 + offset) * (1 - MIN_TILT_GAIN);
}
