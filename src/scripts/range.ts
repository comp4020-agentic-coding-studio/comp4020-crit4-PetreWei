// The played range, and the maps from a position on the stage to a pitch, a
// volume and a colour. Kept out of the DOM for the same reason motion.ts and
// readout.ts are: these are number-to-number functions, and they are the ones
// most likely to be retuned by ear.
//
// They used to live inside main.ts's `if (stage)` block, which made them
// unreachable from any test --- so the tilt mapping had twelve assertions on it
// and the pitch mapping, the instrument's whole point, had none. The played
// range was also restated as literals in spec/readout.test.ts, where it could
// disagree with the real one.

/** Lowest pitch, at the left edge of the stage. */
export const MIN_FREQ = 110;
/** Highest pitch, at the right edge. Three octaves up: 110 → 220 → 440 → 880. */
export const MAX_FREQ = 880;

const MIN_GAIN = 0.0001;
const MAX_GAIN = 0.3;

/** Hoisted: constant for the life of the page, and both maps run per event. */
const FREQ_RATIO = MAX_FREQ / MIN_FREQ;
const LOG_FREQ_RATIO = Math.log(FREQ_RATIO);

export function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

/**
 * Pitch from a horizontal position, logarithmically so that a given distance
 * moved is the same musical interval anywhere across the stage. Continuous on
 * purpose: there is no scale to snap to, so there is no position between two
 * notes to land wrong on.
 */
export function freqForX(x: number, width: number): number {
  return MIN_FREQ * FREQ_RATIO ** clamp01(x / width);
}

/** Volume from a vertical position: higher on the stage is louder. */
export function gainForY(y: number, height: number): number {
  return MIN_GAIN + clamp01(1 - y / height) * (MAX_GAIN - MIN_GAIN);
}

/**
 * Warm valve-glow, deep red up to lamp yellow: a rainbow sweep reads as a
 * modern colour picker, which fights the cabinet the instrument sits in.
 *
 * Takes a frequency rather than the ratio freqForX already computed, because it
 * hues the pitch actually sounding --- bend included --- which the pre-bend
 * ratio does not describe.
 */
export function hueForFreq(freq: number): number {
  const ratio = Math.log(freq / MIN_FREQ) / LOG_FREQ_RATIO;
  return 6 + clamp01(ratio) * 46;
}
