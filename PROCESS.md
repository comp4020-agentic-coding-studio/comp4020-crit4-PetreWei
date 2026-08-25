# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A browser theremin: touch, click, or drag anywhere on the stage and a live
oscillator plays, with the x position mapped to pitch and the y position to
volume. There's no scale to quantize to and no separate "start" control ---
sound starts the instant you touch the stage and tracks continuously wherever
you move, on the theory that the brief's "no way to play it wrong" line is best
answered literally: a real theremin has no wrong note, so this one doesn't
either.

It's dressed as the instrument it imitates: a wood cabinet sits at the bottom
of a dim, lamplit room, with the pitch rod rising from its right end and the
volume loop jutting out of its left. The drawing is decoration only --- it
takes no pointer events --- so the whole viewport stays one continuous field
to play in. A "how it works" plaque in the corner opens a short explanation
for anyone who wants one.

On a phone the device itself is the second hand: while a note is sounding,
rolling it bends the pitch and tipping it away damps the volume, both measured
from however you were holding it when the note began. Desktop fires no
orientation events, so there it is exactly the touch-and-keyboard instrument
it was.

## The moments that mattered

1. **Continuous pitch instead of a quantized scale.** My first pass at the
   design (before any code) reached for snapping touch position to a
   pentatonic scale, the safe choice for "sounds good no matter what a
   stranger does." Re-reading the spec's actual line --- no way to play it
   wrong --- during planning made the snapping look like it was solving the
   wrong problem: a scale still has notes you can miss *between*, it just
   hides them. A theremin's continuous pitch has no such gap, so I dropped
   quantization from the plan entirely and mapped x logarithmically across
   two octaves instead
   ([`bea28b4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/bea28b41835a8e2eaeb7af2910cd4ad0d7c1f8fd)).
   I checked this held by playing it: gliding a finger across the stage never
   produces a "wrong" sound, only a different one.

2. **The link-preview card rendered solid black, and I didn't ship it anyway.**
   My first attempt built `card.png` from an SVG rasterized with ImageMagick's
   `convert`. The output was solid black --- ImageMagick delegates SVG
   gradients to `rsvg-convert`, which wasn't actually installed, so it silently
   fell back to a parser that dropped the gradient and blend mode. CLAUDE.md's
   own rule ("never show a plausible-looking guess... fail visibly, or show
   nothing") is what stopped me from just shipping the black square as "close
   enough" --- I looked at the rendered file with the Read tool before
   committing anything, saw it was wrong, and rebuilt the card from an actual
   HTML/CSS mockup of the real gradient, screenshotted with the same headless
   Chromium already used to verify the page itself
   ([`bea28b4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/bea28b41835a8e2eaeb7af2910cd4ad0d7c1f8fd)).

3. **A real interaction bug only a screenshot caught.** `pnpm check` was green
   and the audio graph worked, but a screenshot taken mid-drag showed the
   browser's native text-selection highlight smeared across the onboarding
   hint --- dragging across text selects it by default, and nothing in the
   type system or the spec tests would ever flag that. CLAUDE.md says JSDOM
   can't lay out or run this page, so I'd already committed to checking
   visually rather than trusting the checks alone; this is the moment that
   justified it. Adding `user-select: none` to the stage
   ([`bea28b4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/bea28b41835a8e2eaeb7af2910cd4ad0d7c1f8fd))
   and re-screenshotting confirmed the highlight was gone.

4. **Explanation text that doesn't undercut the brief.** Wanting to add an
   explanation of what a theremin is put me straight against the brief's own
   line --- a stranger should be able to play it uninstructed. Standing copy on
   the page would have answered the question nobody had asked yet and made
   reading the first move instead of playing. Putting it behind a closed "how
   it works" plaque
   ([`2bdfca4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/2bdfca4c0c01867115fa2ccc0b236d63238d16df))
   keeps the first thing you meet the instrument, and still has an answer
   waiting for the person who wants one. The same commit draws the cabinet and
   antennas, which do the explaining without any words at all.

5. **The verification pass was reading the wrong server, and a check I'd
   written for something else caught it.** My browser script asserted the Tab
   order, so that keyboard reachability couldn't quietly regress. It came back
   `[info-toggle, ASTRO-DEV-TOOLBAR, ASTRO-DEV-TOOLBAR, ...]` --- a toolbar
   that only exists in `astro dev`. A stray dev server held port 4321, so
   `astro preview` had silently moved to 4322 and I'd pointed the script at
   the wrong one. This is the exact failure already written into CLAUDE.md
   from an earlier week; the rule didn't stop me repeating it, but the
   assertion did, and re-running against 4322 is what makes the sizes below
   worth anything.

6. **"Too small" and "too modern" measured rather than eyeballed.** The
   redesign feedback was about how it looked, which is the kind of note
   CLAUDE.md says to answer with numbers rather than a diff approved by eye.
   The screenshot at 390px showed the volume loop clipped off the left edge;
   the measurement said why --- its bounding box started at x = -1.5, because
   a `border` sits *outside* the declared width under the default
   `content-box`, so the stroke pushed it past the viewport. `box-sizing:
   border-box` and a wider-than-tall aspect (no real theremin loop is a
   circle) moved it to x = 9
   ([`eb43abc`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/eb43abc6d2dd01e3ab77924a0f87009cfaeb0428)).
   The same commit answers "too modern" in the palette: warm lamplight instead
   of the blue-purple gradient, and the pointer glow pulled from a full
   rainbow sweep into a red-to-amber valve range, since a hue wheel reads as a
   colour picker no matter what cabinet you put around it.

7. **The brief named a sensor I hadn't used, and using it meant not adding a
   button.** The brief calls mobile fertile "because of touch and motion
   sensors"; I had touch and had quietly skipped motion. Making the device the
   player's second hand is the obvious answer --- roll to bend the pitch, tip
   it away to damp the volume --- but iOS only grants orientation from inside a
   user gesture, and the usual shape for that is an "enable motion" button,
   which is the exact instruction-before-sound the brief warns against. The
   resolution was that the first touch on the stage *is* a user gesture, so the
   permission ask rides on it and there is still nothing to read first; a
   refusal costs only the tilt
   ([`93d65dd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-PetreWei/commit/93d65dda09fbdca28220a548e582146d5327a235)).
   The same commit is where I finally followed my own `CLAUDE.md` rule about
   keeping logic DOM-free: tilt is the one input with no visible scale, so the
   mapping moved into its own module with unit tests, and one of them
   immediately failed --- the damping floor came out a float hair *below* its
   own minimum. I fixed the formula to interpolate up from the floor rather
   than down from one, because loosening the assertion would have been
   weakening a check to reach green.

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: whether one renders is visible the moment you look. Open
this file on GitHub and look at it before you ship.
