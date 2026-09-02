// Pure rules, kept free of the canvas/DOM so they can be unit-tested
// directly (see spec/game.test.ts) without a browser environment.

export type Element = "fire" | "ice";

export function toggleElement(current: Element): Element {
  return current === "fire" ? "ice" : "fire";
}

// The one rule under focused test: an obstacle only kills you when your
// current element doesn't match its own. Same element, you pass straight
// through it.
export function survivesObstacle(player: Element, obstacle: Element): boolean {
  return player === obstacle;
}
