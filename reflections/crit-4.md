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

## What did this work change about who I want to be as a software developer?

*Draft — replace with your own answer before submitting.* The prompt on the
card.png bug and the drag-selects-text bug is a fair prompt for this one: both
were things a green `pnpm check` had nothing to say about, and both only showed
up because I looked at a screenshot instead of trusting the checks. That's a
habit worth naming for yourself here — whether "look before you ship" is
already how you work, or something this crit talked you into.
