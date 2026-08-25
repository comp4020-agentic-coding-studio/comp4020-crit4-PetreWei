# Crit 4 reflection

## What was the breakthrough that moved the work forward?

Rejecting my own first design. Quantizing touch position to a pentatonic scale felt like the safe way to satisfy *no way to play it wrong* — a scale can't hit a bad note. But quantizing doesn't remove the wrong notes, it hides them behind a snap; a real theremin has no gap to land in because pitch is continuous. Dropping the scale is what made the instrument match the brief instead of resembling something that would. The same move settled the copy: explaining a theremin fights the brief's own line about a stranger playing it uninstructed, so it went behind a closed plaque and the drawn cabinet did the explaining instead.

## What did this work change about who I want to be as a software developer?

I came in assuming the answer to a repeated mistake is a better rule. But `CLAUDE.md` is read every turn, so every line competes with the actual task, and a rule that is always on is one you stop seeing. I broke my own *verify against the built site* rule with that rule sitting in context, and what caught me was an assertion I'd written for something else. A check isn't always on — it fires once, at the moment the thing it guards is wrong.

Then the reverse. One of my tests asserted the *relative* `og:image` string, so it had certified the bug and would have gone red on the fix. And two rules in `CLAUDE.md` named a lint step and props that no longer existed. Instructions and tests rot like code, and nothing announces it. This entry ran to 465 words before I checked the brief asks for 150–300.

So I'd rather prune my own guidance and audit my own sensors than add another line and trust it. Knowing what to leave out is half of it; checking that what's left is still true is the rest.
