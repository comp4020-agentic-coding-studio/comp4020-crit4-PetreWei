# Crit 4 reflection

## What was the breakthrough that moved the work forward?

The breakthrough was rejecting my own first design. Going in, "quantize touch
position to a pentatonic scale" felt like the safe way to satisfy the brief's
"no way to play it wrong" — a scale can't hit a bad note. But sitting with that
line during planning, quantizing still leaves gaps between the notes; it just
hides them behind a snap. A real theremin has no such gap: pitch is continuous,
so there is no "wrong" position to land on in the first place. Dropping the
scale and mapping x straight to frequency is what actually made the instrument
match the spec instead of just resembling one that would.

The same instinct came back when I dressed the thing up. Adding an explanation
of what a theremin is runs straight against the brief's own line about a
stranger playing it uninstructed, and the honest resolution was not to write
better copy but to put the copy behind a closed plaque, so the first thing
anyone meets is still the instrument. Drawing the cabinet and the two antennas
did more explaining than the paragraph does — it tells you what you're holding
before you've read anything.

## What did this work change about who I want to be as a software developer?

*Draft — this one needs your own words before you submit it.* The material is
there if you want it. The three bugs that mattered this week were all invisible
to a green `pnpm check`: the link-preview card rendered as a black square, the
drag selected text like a paragraph, and the volume loop hung off the left edge
of a phone screen. No test in `spec/` was ever going to catch any of them; I
only saw them because I looked at a screenshot.

The sharper one is the fifth moment in `PROCESS.md`. The rule was already
written in `CLAUDE.md` — verify against the built site, not a stray dev server
— and I broke it anyway, and what caught me was an assertion I'd written for an
unrelated reason. Week 4's lecture supplies the vocabulary for why. `CLAUDE.md`
is read every turn, so every line in it competes for attention with the actual
task, and a rule that is always on is a rule that is easy to stop seeing. An
assertion isn't always on: it fires once, at the moment the thing it guards is
wrong. Which suggests the answer to a correction I keep repeating isn't another
line in `CLAUDE.md` — it's a sensor, or a skill. What I still have to decide is
whether that's a claim about tooling or a claim about me.
