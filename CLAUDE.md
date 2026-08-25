# COMP4020 prototype

This is a static site written in HTML, CSS and TypeScript. It builds to plain HTML, CSS and JS and deploys to GitHub Pages. **The deployed site is what gets marked** — not this repo, and not "it works on my machine". A marker opens the live URL in Chrome at two sizes, 1920×1080 (desktop) and 390×844 (phone). Both count in full.

The course website publishes each deliverable's brief (the open problem) and spec (the fixed contract); this repo's name tells you which applies. Run the course plugin's **start** skill at the beginning of each week — it fetches the right spec and helps turn its checkable lines into tests. Read the brief and spec before planning or building.

## How to work in here

- Keep `pnpm dev` running for the fast loop, but verify with `pnpm build && pnpm preview` before trusting a result — base paths and routing can differ between dev and the built site.
- Open the page in a browser (or use `agent-browser`) rather than imagining it. The rendered page is the truth; your mental model of it isn't.
- A red check is a sensor doing its job: read what it says before changing anything, and never weaken a check just to reach green.
- Commit when checks pass. Never commit a red state.

## The link-preview card

`public/card.png` (1200×630) and the `description`/`og:image` props on `Layout.astro` are what a shared link shows. Update both together whenever you touch a page's content, and pass both props on any new page.

## The checks (your sensors)

`pnpm check` runs typecheck, build, lint and tests; CI repeats that plus links, secrets and the deploy. Green checks fifteen minutes after your crit's cutoff are worth half the week's shipped mark — still running counts as not green.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and say what they're for.

## Rules that came from a specific failure

- **Never edit `.github/workflows/`.** It's the sensor this work has to satisfy, not part of the work. If a check fails for a reason outside the repo, remove the dependency instead.
- **Verify against the built site, not the dev server.** A stray `astro dev` holding the port once made a whole "verification" pass read the dev server by accident, toolbar included.
- **Never show a plausible-looking guess.** A fallback that looks like the real answer is worse than an obvious failure — fail visibly, or show nothing.
- **When asked for an outcome, measure first.** "Make it readable" invites a diff approved by eye. Get the numbers before the diff.
- **JSDOM can't run client scripts or lay out the page.** Keep logic DOM-free and unit-test it directly; check the built HTML for what the script needs to find; verify anything visual or interactive by hand in a real browser.

## This file is yours

Not a rulebook — as you learn what this prototype needs, write it down here. The gap between the boilerplate and your own version is part of what gets read.
