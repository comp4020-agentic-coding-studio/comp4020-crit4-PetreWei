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

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: whether one renders is visible the moment you look. Open
this file on GitHub and look at it before you ship.
