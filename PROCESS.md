# Process overview

## What I built

A browser theremin. Touch, drag or hold an arrow key anywhere and a live oscillator sounds: x is pitch, y is volume, both continuous, with no scale to quantize to. It's dressed as the instrument it imitates --- wood cabinet, pitch rod, volume loop, a lit meter reading the frequency you play --- and the drawing takes no pointer events, so the whole viewport stays one field. On a phone the device is your second hand: roll to bend the pitch, tip it away to damp the volume. It ships in English and Simplified Chinese as two real documents.

## The moments that mattered

1. **Continuous pitch instead of a quantized scale.** My first design snapped touch position to a pentatonic scale --- the safe answer to "sounds good whatever a stranger does". The brief's actual line, *no way to play it wrong*, showed that solving the wrong problem: a scale still has notes you can miss *between*, it just hides them. So I dropped quantization, mapping x logarithmically across two octaves ([`bea28b4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/bea28b41835a8e2eaeb7af2910cd4ad0d7c1f8fd)). I checked by playing it: gliding never produces a wrong sound, only a different one.

2. **A sensor I'd written was certifying the bug.** `og:image` and `hreflang` shipped relative, which silently means no link card and no alternate cluster --- invisible from a page that looks perfect. The obvious fix was adding the missing check, but it existed: my spec asserted `toBe(strings.card)`, the *relative* string, so it had locked in the wrong answer and would have gone red on the fix. A test that encodes current output instead of intent doesn't miss a bug, it defends one. I rewrote it to assert the absolute URL, added a rule that nothing a scraper reads may be relative, and confirmed both by reintroducing the bug and watching them fail ([`cddbc47`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/cddbc4727c693e825a43fe15ebcbc624d1371ff6)).
