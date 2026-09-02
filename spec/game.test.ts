import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { survivesObstacle, toggleElement } from "../src/scripts/game-logic";

// This week's brief (crit 5, "A game"): a small browser game with rules,
// stakes, and an ending, that teaches itself with no instructions anywhere.
// Only the mechanically-checkable spec lines are here — see
// https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/
// for the full spec. Left to the crit, because only a person can judge them:
// whether the opening screen actually makes the first move obvious, and
// whether a stranger reaches an ending inside five minutes.
//
// The build-level checks below start red until the game exists; the rule
// tests at the bottom exercise the actual mechanic (Ember & Frost: an
// obstacle only kills you when your current element doesn't match its own).

const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files();
const htmlFiles = shipped.filter((path) => path.endsWith(".html"));
const scriptFiles = shipped.filter((path) => path.endsWith(".js"));

// A build can ship a page's script either as an external .js file or, for a
// small enough bundle, inlined straight into the HTML — scan both so this
// test tracks what the page actually does, not how the bundler packaged it.
const htmlDocs = htmlFiles.map((path) => new JSDOM(readFileSync(path, "utf8")).window.document);
const inlineScripts = htmlDocs.flatMap((doc) =>
  Array.from(doc.querySelectorAll("script:not([src])")).map((script) => script.textContent ?? ""),
);
const scriptSource = [...scriptFiles.map((path) => readFileSync(path, "utf8")), ...inlineScripts].join(
  "\n",
);

const home = htmlFiles.find((path) => path.endsWith("index.html"));
const homeDoc = home ? new JSDOM(readFileSync(home, "utf8")).window.document : undefined;
const bodyText = homeDoc?.body.textContent?.toLowerCase() ?? "";

describe("game: teaches itself", () => {
  it("has no how-to-play instructions on screen", () => {
    // The spec bans a tutorial anywhere, on screen or off — this only checks
    // the "on screen" half; the off-screen half (a README standing in for
    // one) is left to the crit.
    expect(homeDoc, "dist/index.html not found — build the game's home page").toBeTruthy();
    for (const phrase of ["how to play", "instructions", "controls:", "click to start playing"]) {
      expect(
        bodyText.includes(phrase),
        `found "${phrase}" on the page — the spec asks the opening screen to teach itself, not narrate itself`,
      ).toBe(false);
    }
  });

  it("has no dedicated instructions element", () => {
    expect(
      homeDoc?.querySelector('[role="dialog"], .instructions, .how-to-play, .tutorial, dialog'),
      "found a dialog/instructions/tutorial element — the spec wants the first move to be obvious from the opening screen alone",
    ).toBeFalsy();
  });
});

describe("game: can be lost", () => {
  it("defines a terminal state the game can reach", () => {
    // Loose on purpose — the spec leaves the mechanic open, so this checks
    // only that *some* ending is wired up (win, loss, or finish), not which
    // one or how it's presented. Whatever signal the student picks for their
    // ending should show up here; if none of these match, widen the pattern
    // to whatever language the game actually uses.
    const endingSignal =
      /game[\s-]?over/i.test(scriptSource) ||
      /you\s+(win|won|lose|lost)/i.test(scriptSource) ||
      /\b(finish(ed)?|complete[d]?)\b/i.test(scriptSource) ||
      /\btry\s+again\b/i.test(scriptSource) ||
      /data-(game-)?state\s*=\s*["'](won|lost|over|finished)["']/i.test(scriptSource);
    expect(
      endingSignal,
      "no win/loss/finish signal found in the shipped script — the spec asks for play that ends somewhere",
    ).toBe(true);
  });
});

describe("game rule: matching your element to an obstacle is what keeps you alive", () => {
  it("survives an obstacle of the same element", () => {
    expect(survivesObstacle("fire", "fire")).toBe(true);
    expect(survivesObstacle("ice", "ice")).toBe(true);
  });

  it("dies to an obstacle of the opposite element", () => {
    expect(survivesObstacle("fire", "ice")).toBe(false);
    expect(survivesObstacle("ice", "fire")).toBe(false);
  });

  it("toggling always flips fire and ice, never holds or skips", () => {
    expect(toggleElement("fire")).toBe("ice");
    expect(toggleElement("ice")).toBe("fire");
  });
});
