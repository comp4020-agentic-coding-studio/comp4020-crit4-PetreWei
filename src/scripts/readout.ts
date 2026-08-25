// Formatting for the cabinet's frequency meter, kept out of the DOM so it can
// be tested directly.
//
// The meter reads out the pitch actually being sounded, bend included. When
// nothing is sounding it shows dashes rather than the last value or a resting
// number: CLAUDE.md's rule is that a plausible-looking guess is worse than an
// obvious blank, and a meter reading 440 Hz in silence is exactly that.

/** Shown whenever there is no live pitch to report. */
export const IDLE_READOUT = "–––";

/**
 * Characters the meter holds open, so a reading gaining a digit doesn't shove
 * the cabinet's layout. Instrument.astro passes this to the CSS and
 * spec/readout.test.ts checks the played range still fits it --- it used to be
 * exported, imported by nothing, and contradicted by a `min-width: 4.6ch` that
 * was narrower than the widest reading it claimed to reserve.
 */
export const READOUT_WIDTH = 6;

/**
 * One decimal place, so a slow glide visibly moves the last digit instead of
 * sitting still through most of a semitone. Anything that isn't a real,
 * positive frequency reads as idle rather than as `NaN` or `Infinity`.
 */
export function formatHz(freq: number | null | undefined): string {
  if (typeof freq !== "number" || !Number.isFinite(freq) || freq <= 0) {
    return IDLE_READOUT;
  }
  return freq.toFixed(1);
}
