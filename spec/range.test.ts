import { describe, expect, it } from "vitest";
import { MAX_FREQ, MIN_FREQ, clamp01, freqForX, gainForY, hueForFreq } from "../src/scripts/range.ts";

// These maps were unreachable from any test until they moved out of main.ts's
// DOM guard — so the tilt mapping had twelve assertions on it and the pitch
// mapping, which is the instrument, had none. The spec lines they answer are
// "expressive: the player's choices shape what they hear" and "no way to play
// it wrong", and both are properties of the curve rather than of any one value.

describe("range: position to pitch", () => {
  it("spans exactly the stated range, edge to edge", () => {
    expect(freqForX(0, 1000)).toBeCloseTo(MIN_FREQ, 6);
    expect(freqForX(1000, 1000)).toBeCloseTo(MAX_FREQ, 6);
  });

  it("is continuous: no two nearby positions snap to the same pitch", () => {
    // The brief's "no way to play it wrong" is why there is no scale here. A
    // quantized mapping would return equal values across a step; this asserts
    // the absence of steps, which is the property a scale would break.
    let previous = freqForX(0, 1000);
    for (let x = 1; x <= 1000; x++) {
      const next = freqForX(x, 1000);
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
  });

  it("is logarithmic, so the same distance is the same interval anywhere", () => {
    // Equal thirds of the stage should be equal musical intervals, which is
    // what makes a glide feel even rather than bunched at one end.
    const a = freqForX(0, 900) / freqForX(300, 900);
    const b = freqForX(300, 900) / freqForX(600, 900);
    const c = freqForX(600, 900) / freqForX(900, 900);
    expect(a).toBeCloseTo(b, 10);
    expect(b).toBeCloseTo(c, 10);
    // ...and the whole stage is the range the constants claim. This assertion
    // is why PROCESS.md said "two octaves" for a week: 110 to 880 is three.
    expect(MAX_FREQ / MIN_FREQ).toBe(8);
  });

  it("holds the edges rather than running off them", () => {
    // A pointer captured outside the stage still reports coordinates, so an
    // unclamped map would sound a pitch the instrument does not have.
    expect(freqForX(-500, 1000)).toBe(MIN_FREQ);
    expect(freqForX(5000, 1000)).toBe(MAX_FREQ);
  });
});

describe("range: position to volume", () => {
  it("is silent-ish at the floor and loudest at the top", () => {
    const bottom = gainForY(1000, 1000);
    const top = gainForY(0, 1000);
    expect(top).toBeGreaterThan(bottom);
    expect(bottom).toBeGreaterThan(0); // never exactly zero: silence reads as broken
  });

  it("rises without a step, and holds outside the stage", () => {
    let previous = gainForY(1000, 1000);
    for (let y = 999; y >= 0; y--) {
      const next = gainForY(y, 1000);
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
    expect(gainForY(-500, 1000)).toBe(gainForY(0, 1000));
    expect(gainForY(5000, 1000)).toBe(gainForY(1000, 1000));
  });
});

describe("range: pitch to colour", () => {
  it("stays inside the warm end of the wheel at every playable pitch", () => {
    // A rainbow sweep reads as a colour picker and fights the cabinet. Checked
    // across the bent range too, since hueForFreq is given the sounding pitch.
    for (const freq of [MIN_FREQ / 2, MIN_FREQ, 440, MAX_FREQ, MAX_FREQ * 2]) {
      const hue = hueForFreq(freq);
      expect(hue).toBeGreaterThanOrEqual(6);
      expect(hue).toBeLessThanOrEqual(52);
    }
  });

  it("warms as the pitch rises", () => {
    expect(hueForFreq(MAX_FREQ)).toBeGreaterThan(hueForFreq(MIN_FREQ));
  });
});

describe("range: clamp01", () => {
  it("passes the unit interval through and pins everything outside it", () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(9)).toBe(1);
    expect(clamp01(Number.NaN)).toBeNaN();
  });
});
