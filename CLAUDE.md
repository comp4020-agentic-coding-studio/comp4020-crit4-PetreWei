# COMP4020 prototype

This is a static site written in HTML, CSS and TypeScript. It builds to plain HTML, CSS and JS and deploys to GitHub Pages. **The deployed site is what gets marked** — not this repo, and not "it works on my machine". A marker opens the live URL in Chrome at two sizes, 1920×1080 (desktop) and 390×844 (phone). Both count in full, so the site has to be good at both, and the checks below are how you find out whether it is.

The course website publishes each deliverable's brief and spec. The brief poses the problem; the spec is the fixed contract every answer must meet. This repo's name tells you which deliverable applies. Run the course plugin's **start** skill at the beginning of each week: it fetches the right spec, carries last week's harness forward, and helps turn the spec's checkable lines into your own tests. Read the brief and spec before planning or building, and see `spec/README.md` for how the checks relate to them.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push. It runs most of what CI runs — typecheck, build, lint and the tests — so you find those problems in seconds instead of waiting for the pipeline. The link check, the evidence check, the secrets scan and the deploy only run in CI. For the link check without waiting, run `pnpm dlx linkinator ./dist --silent` against a fresh `pnpm build`.
- To see what the page really looks like, open it in a browser rather than imagining it. The `agent-browser` CLI, documented on [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth), works well. The rendered page is the truth; your mental picture of it is not.
- When a check fails, read its output before changing anything. The failure message names the file, the line or the contract, and that is the instruction. A red check is right until proven otherwise: the page is wrong until the check is green, not until you decide it should be.
- Commit when the checks pass. Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; the page's head points at it via `Layout.astro`'s `description`/`og:image` props. Replace the image and the description text, and pass both props on any new page. The card URL resolves against the page that names it, like any link — `./card.png` is wrong one directory down, and nothing in CI checks it, so look at the deployed head when you add pages.

## The checks (your sensors)

CI runs these on every push once the repo is public. GitHub shows two jobs, `check` and `deploy`, rather than one status per item below. Inside `check` the steps run in order, because `pnpm check` chains typecheck, build, lint and the tests with `&&`, so an early failure such as a broken build stops the later steps from running at all; fix it and push again to see the rest. While the repo is private the CI jobs stay skipped, and `pnpm check` is the same list on your machine anyway, which is the faster loop. These are not hoops. Each one is a way of finding out something true about the site that you cannot reliably see by looking at it.

They also carry marks at a crit. The automated sweep runs fifteen minutes after your cutoff, and green checks at that moment are worth half the week's shipped mark. Still running counts as not green, so ship with time for CI to finish.

- **typecheck** — `astro check` runs first, so a type error stops everything before the build starts. A red here is the compiler saying a claim in the code is false.
- **build** — the site must build (`pnpm build`). If it does not, the deployed site is broken or stale and nothing else matters until this is green.
- **deploy / online** — the live GitHub Pages URL must load and return the page you expect. An asset that 404s on the live URL counts as broken even if it loads locally.
- **spec** — `spec/invariants.test.ts` checks what should be true of any decent website, whatever the brief asks. The tests you write for the week run alongside it; any `spec/*.test.ts` is picked up. A failure names the contract you have not met yet.
- **lint** — `stylelint` for CSS and `oxlint` for TypeScript. They flag code that is wrong, fragile or unusual. Read the rule they name.
- **tests** — any other tests you write, anywhere you put them, must pass. Vitest runs these and the spec suite together in one `vitest run`, the last step of `pnpm check`. A failing test is a claim about the site that is no longer true.
- **evidence** (`pnpm check:evidence`) — checks the process files: that every commit `PROCESS.md` cites really exists, that the right reflection for this deliverable is in `reflections/` (worked out from the repo name against the course API), and that `CLAUDE.md` is present. This gates the deploy, since `deploy` needs `check` to pass, so missing evidence blocks the deploy like anything else.
- **links** — internal links must resolve. A broken link is a dead end you did not mean to ship.
- **secrets** — the repo is scanned for committed credentials. Never put a key, token or password in a tracked file, and rotate it if one leaks. A local pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also blocks any commit containing something shaped like an API key. By the time CI sees a key it is already pushed, so the hook is the sensor that matters.

Nothing here measures **performance**. Wiring that up (Lighthouse, or whatever you choose) is your work, and later in the course the spec will ask how you tested it. When you do, read a green result honestly: it is one lab measurement on a CI machine, not proof the site is fast for real people.

## Rules that came from a specific failure

Each of these is here because something went wrong once. They are guides, not sensors — the checks cannot enforce most of them — so they only work if they are read.

- **Never edit `.github/workflows/`.** The course CI is the sensor this work has to satisfy, not a part of the work you get to adjust. When a check went red because Wikipedia rate-limited a shared CI machine, the one-line fix was to tell the link check to skip that host. That turns a real signal into a green light. It was drafted and thrown away. When a check fails for a reason outside this repo, remove the dependency instead.
- **Verify against the built site, not the dev server.** A leftover `astro dev` was still holding port 4321, so `serve dist` quietly took a random port and a whole session of "verification" was actually reading the dev server, including the toolbar it injects, which got mistaken for a layout bug. Run `pnpm build && pnpm preview --port <port>` and read the port the tool actually printed, not the one you asked for.
- **Never show a plausible-looking guess.** A lookup used to fall back to the nearest known value when the real one wasn't found, so a wrong answer looked exactly like a right one. A wrong answer that looks right is worse than no answer: fail visibly, or show nothing.
- **When a change is asked for as an outcome, measure first.** "Make the labels readable" or "add accessibility" invites a plausible-looking diff that gets approved by eye. Produce the numbers before the diff — that is what found 9 of 24 wedge labels below the WCAG AA contrast minimum on last week's prototype, one of them at 1.57:1, after every one of them had looked fine.

## Testing interactive client scripts

Tests in `spec/*.test.ts` run against the **built** files in `dist/`, parsed with plain JSDOM. JSDOM does not reliably run `<script type="module">`, so a test cannot click something and then check what the client script did to the page. It also has no layout engine at all, so it cannot measure contrast, focus rings, or whether something overflows at 390px. Do not try to test those things this way — it will look like it should work and then quietly not run the script, or quietly not measure the thing you cared about.

What gets real coverage instead: keep the actual logic — data, derivations, state transitions — in plain modules with no DOM in them, and unit-test those by importing them directly. Separately, check against the built HTML that the elements and attributes the browser script needs are really there. Client-side glue script stays thin, with nothing worth unit-testing on its own. For anything the DOM genuinely cannot tell you — does a control respond within a real frame budget, does the layout hold at 320px — do two things: write a test for the *structure* that makes the property possible, with a comment saying it cannot verify the rendered result, and check the rendered result by hand in a real browser at both marking viewports before the commit that claims it works.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: the commit history, the agent files, and the decisions visible across them. The checks cannot see any of that, so a person reads it directly, which makes building legibly part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work came together, and that record is read, not just the final state. A trail that grew alongside the code is the strongest evidence; one big dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading guide, not an essay: what you built, and the moments that mattered, each pointing at a commit, a `CLAUDE.md` change, or a prompt and the commit it produced. It points a marker at the evidence; it does not stand in for it, and claims the history does not back do not count. Cite with the commit hash or range as the link text and the GitHub commit or compare URL as the target; `pnpm check:evidence` confirms they resolve. Markers follow those citations and do not go hunting for evidence you did not cite.
- **Write the reflection in `reflections/`** — a short markdown file named for the deliverable it answers, so the number in the filename matches the number in the repo name (`crit-1.md` in `comp4020-crit1-<you>`, `assignment-1.md` in `comp4020-ass1-<you>`). `reflections/README.md` has the full rule, and `pnpm check:evidence` checks the exact name against the course API rather than just the presence of some well-named file. It answers two standing questions: the breakthrough that moved the work forward, and what this work changed about the developer you want to be. It stays out of the deployed site. It is due at the cutoff, and if it is not in the repo by then the week does not count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent, meaning this `CLAUDE.md` and any `AGENTS.md`, is read as part of how you worked. Keep it honest and current.

You do not need a name, a student number or any identity file in the repo: we know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md started as a template and is not a fixed rulebook. As you learn what the prototype needs — a convention to hold the agent to, a sensor that keeps catching you out, a fact about the stack the agent keeps getting wrong — write it down here. Growing this file is the work of harness engineering, and the gap between the boilerplate and your own version is part of what the prototype says about the developer you are becoming.
