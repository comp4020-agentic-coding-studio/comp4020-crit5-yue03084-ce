# Crit 5: A game

**What was the breakthrough that moved the work forward?**

I started this crit with an idea I liked (a Fireboy-and-Watergirl style co-op
platformer) and about two hours to a hard deadline. The breakthrough wasn't a
technical one --- it was accepting that the idea and the deliverable were two
different sizes, and choosing to build the small mechanic underneath the big
idea instead of a thin slice of the big idea itself. Cutting "two characters
moving through a shared level" down to "one character becoming the element an
obstacle needs" kept everything I actually liked about the original idea
(fire vs. ice, a rule you learn by playing) while making the whole thing
buildable, testable, and playable in the time I had. Writing the rule as a
plain function (`survivesObstacle`) before touching the canvas also mattered:
it turned "does the game work" into something I could assert directly, and it
meant the fix I made after actually playing the game --- the first obstacle
was spawning too slowly, leaving the opening screen dead --- was a one-line
change to a constant, not a rewrite.

**What did this work change about who I want to be as a software developer?**

It sharpened a habit I want to keep: build the smallest true version of the
idea first, and only then decide whether there's time to grow it. I didn't
build two characters and hope one dropped out cleanly under time pressure; I
decided up front which single mechanic carried the idea and built only that,
end to end, so I always had something finished rather than something halfway
toward finished. It also reinforced that reading code and playing the thing it
produces catch different bugs --- the dead opening second was invisible until
I actually clicked through it. I want to keep treating "did I play it" as a
separate, non-optional step from "does it typecheck," not a nice-to-have I
skip when time is short.
