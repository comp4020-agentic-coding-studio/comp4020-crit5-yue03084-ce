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

**Ember & Frost**: a one-mechanic browser game. You are a small flame or ice
crystal running along the ground; a stream of fire and ice obstacles comes at
you, and a tap or Space toggles which element you currently are. Match the
obstacle's element and you pass through it and score a point; mismatch it and
the run ends. Reach 40 points and you win. No instructions on screen or off ---
the opening screen puts a single obstacle in front of you fast enough that
tapping it is the obvious first move. Five levels carry the run from a forest
day through dusk, night, and aurora to an icy dawn, each one faster than the
last and, from level 3, occasionally throwing obstacles in fast pairs.

## The moments that mattered

1. **Scoping the idea down.** I came in wanting something like Fireboy and
   Watergirl --- two characters, co-op movement, a shared level. With roughly
   two hours to a hard deadline, a second character and level geometry was the
   part of that idea most likely to leave me with nothing playable. Instead of
   building toward the full co-op idea, I cut it to the one mechanic underneath
   it (become the element the obstacle needs) and built that end to end. The
   scoping decision is recorded as the choice between two directions before any
   code existed:
   [`68ce602`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-yue03084-ce/commit/68ce602)
   is the spec turned into tests for that scoped-down mechanic, written before
   the game itself.

2. **Making the one rule testable meant keeping it out of the canvas.** The
   spec asks for one rule of the game to carry a focused automated test. A
   canvas game loop is awkward to unit-test directly (no DOM, no easy way to
   assert on pixels), so the actual rule --- same element survives, opposite
   element ends the run, toggling always flips --- lives in a small DOM-free
   module (`src/scripts/game-logic.ts`) that both the game and
   `spec/game.test.ts` import. That's what let the rule tests run without any
   canvas or browser mocking:
   [`4001aec`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-yue03084-ce/commit/4001aec).

3. **A bug that only playing the game surfaced.** Reading `main.ts`, spawning
   the first obstacle at a random gap looked fine --- it's the same code path
   as every later obstacle. Playing the built game showed the actual effect:
   the opening screen sat empty for close to a second before anything arrived,
   which is exactly the dead air the spec's "the opening screen invites the
   first move" line rules out. I fixed it by giving only the first spawn a
   short, fixed distance and leaving every later gap randomised, in
   [`4001aec`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-yue03084-ce/commit/4001aec)
   (see the comment on `reset()` in `src/scripts/main.ts`). This is the kind of
   change that doesn't show up from reading the code --- only from watching the
   first second of play.

4. **Checking both viewports before calling it done.** `CLAUDE.md`'s rule to
   check layouts at both a wide and a narrow viewport isn't specific to boxes
   with fixed heights --- it applies here too, since the canvas is sized from
   `window.innerWidth/innerHeight` and the score/header sit in fixed corners.
   I played the built game in the browser at both a ~1500px window and a
   420x800 window and confirmed the flame, ground line, score, and header all
   render without overlap or clipping at either size before committing
   [`4001aec`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-yue03084-ce/commit/4001aec).

5. **Extending the run without touching the tested rule.** Playing the
   20-point version end to end showed the real problem: a run was over in
   under a minute, before the difficulty had anywhere to go. The fix was a
   level system (five palettes, a per-level speed increase, faster obstacle
   pairs from level 3) layered entirely inside `main.ts`'s canvas drawing and
   spawn logic --- `game-logic.ts` and `spec/game.test.ts` are untouched, so
   the one rule the spec asks to be tested still is, unchanged, in
   [`0ad9980`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-yue03084-ce/commit/0ad9980).

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
