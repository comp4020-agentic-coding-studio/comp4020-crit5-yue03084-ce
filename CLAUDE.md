# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- **Don't `cd`.** Put the directory in the command instead --- `pnpm -C <repo>`,
  `git -C <repo>` --- and give scripts absolute paths. The shell's working
  directory persists between tool calls, so one `cd` elsewhere silently
  pollutes every command after it, and a relative path can happen to resolve
  somewhere you didn't intend.
- **Before trusting a measurement, know which build it read.** A probe that
  reuses a stale `dist/` or a stale browser tab will report "nothing changed"
  when something did, and that's the worst kind of bug: it argues for editing
  code that's already correct. Any probe you write should print what it
  measured (e.g. the `mtime` of the `dist/index.html` it read) and open a
  fresh tab per measurement. If a probe says nothing changed, suspect the
  probe before the code.
- **Anything with a fixed height has to be measured, not looked at.** If text
  goes into a box whose height the content doesn't get to set, check
  `scrollHeight` against `clientHeight` before you say it fits --- and check it
  at both viewports (1920 and 390), because the box shrinks and the sentence
  doesn't. Overflow like this is invisible in a screenshot and obvious the
  moment you measure.
- **One fact, one piece of code.** If the page states the same fact in two
  places (a computed value and a sentence describing it, say), compute it once
  and have both places read from that one function or constant. Two sources
  for one fact isn't duplication you can clean up later --- it's a page that
  will eventually contradict itself in front of a reader.
- **Default to incremental.** Unless the task says otherwise: don't restructure
  the page, don't rewrite copy that's already there, don't break an
  interaction that already works. Attach the new thing to what exists. For
  each new feature, say back two things before building it --- **when it
  updates** and **what must not change**.
- **stylelint here is mostly about where a rule sits, not what it says.**
  Three of its rules have cost a build-and-retry more than once: a less
  specific selector may not come after a more specific one matching the same
  element (`no-descending-specificity`); a blank line before a declaration
  that follows another declaration is an error unless a comment sits between
  them (`declaration-empty-line-before`); a comment needs a blank line before
  it (`comment-empty-line-before`). None of these show up until `pnpm check`
  reaches lint, which is after the build.
- Two CSS facts that fail *silently*. An `opacity` below 1 forces
  `transform-style: flat` on that element's subtree, so a fade put on a 3-D
  container flattens the thing it was meant to fade --- put it on the leaf.
  And `calc(a + -0.5 * b)` is a parse most of the way to nonsense: emit the
  sign explicitly. A gradient that fails to parse doesn't warn, it just
  doesn't paint.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
