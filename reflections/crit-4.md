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
there if you want it: the three bugs that mattered this week were all invisible
to a green `pnpm check`. The link-preview card rendered as a black square, the
drag selected text like a paragraph, and the volume loop hung off the left edge
of a phone screen — none of which any test in `spec/` was ever going to catch,
and all of which I only saw because I looked at a screenshot. The sharper one
is the fifth moment in `PROCESS.md`: I'd written a rule in `CLAUDE.md` about
verifying against the built site rather than a stray dev server, then did it
again anyway, and it was an assertion — not the rule, not my memory of writing
it — that caught me. That's worth deciding something about: whether the lesson
is to trust your own discipline less and your sensors more, or something else
entirely.
