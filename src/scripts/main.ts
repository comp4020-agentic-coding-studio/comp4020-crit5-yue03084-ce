import { survivesObstacle, toggleElement, type Element } from "./game-logic";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const POINTS_PER_LEVEL = 8;
const WIN_SCORE = 40;
const GROUND_RATIO = 0.72;
const PLAYER_X_RATIO = 0.18;
const PLAYER_SIZE = 34;
const OBSTACLE_WIDTH = 34;
const BASE_SPEED = 260; // px/sec
const SPEED_PER_POINT = 6;
const LEVEL_SPEED_BONUS = 40;
const GAP_MIN = 260;
const GAP_MAX = 420;
const DOUBLE_SPAWN_MIN_LEVEL = 3;
const DOUBLE_SPAWN_CHANCE = 0.28;
const DOUBLE_SPAWN_GAP_MIN = 150;
const DOUBLE_SPAWN_GAP_MAX = 210;
const LEVEL_BANNER_DURATION = 1.2;

const COLORS: Record<Element, { fill: string; glow: string }> = {
  fire: { fill: "#ff6a2b", glow: "#ffcf6a" },
  ice: { fill: "#3fb8ff", glow: "#c9f3ff" },
};

interface Theme {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundLine: string;
  far: string;
  near: string;
}

// Progression through the run: forest day -> dusk -> night -> aurora -> an
// icy dawn for the final stretch, tying the escalating difficulty to a place
// that visibly changes rather than just a faster number.
const LEVEL_THEMES: Theme[] = [
  { skyTop: "#0e2b1e", skyBottom: "#1d4a30", ground: "#122a1a", groundLine: "#3a6b4a", far: "#173a26", near: "#0c2116" },
  { skyTop: "#241a3d", skyBottom: "#4a3868", ground: "#1c1530", groundLine: "#6a5a9f", far: "#2c2350", near: "#16112a" },
  { skyTop: "#0a0e24", skyBottom: "#16204a", ground: "#0a0e1e", groundLine: "#3a5aa0", far: "#121a3a", near: "#080b1c" },
  { skyTop: "#05081a", skyBottom: "#133a2e", ground: "#050c14", groundLine: "#3fd6a0", far: "#0d2b24", near: "#04070f" },
  { skyTop: "#041824", skyBottom: "#0e4a5a", ground: "#041216", groundLine: "#6fe0ff", far: "#0c3440", near: "#041018" },
];

type State = "playing" | "gameover" | "won";

interface Obstacle {
  x: number;
  element: Element;
  resolved: boolean;
}

let width = 0;
let height = 0;
let dpr = 1;

let state: State = "playing";
let playerElement: Element = "fire";
let obstacles: Obstacle[] = [];
let score = 0;
let speed = BASE_SPEED;
let distanceToNextSpawn = 0;
let lastTime = 0;
let flash = 0; // brief highlight when an obstacle is safely passed

let level = 0;
let levelBannerTimer = 0;
let parallaxFar = 0;
let parallaxNear = 0;

function resize() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function currentLevel(forScore: number): number {
  return Math.min(LEVEL_THEMES.length - 1, Math.floor(forScore / POINTS_PER_LEVEL));
}

function reset() {
  state = "playing";
  playerElement = "fire";
  obstacles = [];
  score = 0;
  speed = BASE_SPEED;
  level = 0;
  levelBannerTimer = 0;
  parallaxFar = 0;
  parallaxNear = 0;
  // The first obstacle arrives fast: playtesting the opening screen with
  // the usual random gap left it sitting empty for a beat, which is exactly
  // the dead air the "opening screen invites the first move" spec line
  // rules out. Every later gap still uses randomGap().
  distanceToNextSpawn = 140;
}

function randomGap(): number {
  return GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
}

function act() {
  if (state !== "playing") {
    reset();
    return;
  }
  playerElement = toggleElement(playerElement);
}

function update(dt: number) {
  if (state !== "playing") return;

  speed = BASE_SPEED + score * SPEED_PER_POINT + level * LEVEL_SPEED_BONUS;
  const dx = speed * dt;

  parallaxFar += dx * 0.15;
  parallaxNear += dx * 0.35;

  for (const obstacle of obstacles) {
    obstacle.x -= dx;
  }
  obstacles = obstacles.filter((o) => o.x + OBSTACLE_WIDTH > -10);

  distanceToNextSpawn -= dx;
  if (distanceToNextSpawn <= 0) {
    obstacles.push({
      x: width + OBSTACLE_WIDTH,
      element: Math.random() < 0.5 ? "fire" : "ice",
      resolved: false,
    });
    // From level 3, obstacles occasionally arrive in a fast pair: the gap is
    // a fixed distance rather than a fixed time, so it stays a real reaction
    // test as speed climbs rather than getting easier.
    if (level >= DOUBLE_SPAWN_MIN_LEVEL && Math.random() < DOUBLE_SPAWN_CHANCE) {
      const gap = DOUBLE_SPAWN_GAP_MIN + Math.random() * (DOUBLE_SPAWN_GAP_MAX - DOUBLE_SPAWN_GAP_MIN);
      obstacles.push({
        x: width + OBSTACLE_WIDTH + gap,
        element: Math.random() < 0.5 ? "fire" : "ice",
        resolved: false,
      });
    }
    distanceToNextSpawn = randomGap();
  }

  const playerX = width * PLAYER_X_RATIO;
  for (const obstacle of obstacles) {
    if (obstacle.resolved) continue;
    const overlaps = obstacle.x <= playerX + PLAYER_SIZE / 2 && obstacle.x + OBSTACLE_WIDTH >= playerX - PLAYER_SIZE / 2;
    if (!overlaps) continue;
    obstacle.resolved = true;
    if (survivesObstacle(playerElement, obstacle.element)) {
      score += 1;
      flash = 0.15;
      if (score >= WIN_SCORE) state = "won";
    } else {
      state = "gameover";
    }
  }

  const newLevel = currentLevel(score);
  if (newLevel !== level) {
    level = newLevel;
    levelBannerTimer = LEVEL_BANNER_DURATION;
  }
  if (levelBannerTimer > 0) levelBannerTimer = Math.max(0, levelBannerTimer - dt);
  if (flash > 0) flash = Math.max(0, flash - dt);
}

function drawShape(x: number, y: number, size: number, element: Element, lit: boolean) {
  const { fill, glow } = COLORS[element];
  ctx.save();
  ctx.translate(x, y);
  if (lit) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 24;
  }
  ctx.fillStyle = fill;
  if (element === "fire") {
    // flame: a rounded body with a spike on top
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.65, -size * 0.2, size * 0.5, size * 0.4);
    ctx.quadraticCurveTo(size * 0.3, size, 0, size);
    ctx.quadraticCurveTo(-size * 0.3, size, -size * 0.5, size * 0.4);
    ctx.quadraticCurveTo(-size * 0.65, -size * 0.2, 0, -size);
    ctx.closePath();
    ctx.fill();
  } else {
    // ice: a crystal diamond
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.75, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawParallax(theme: Theme, groundY: number) {
  const tileFar = 220;
  const farBumpTop = groundY - 80;
  ctx.fillStyle = theme.far;
  const offsetFar = parallaxFar % tileFar;
  for (let x = -tileFar - offsetFar; x < width + tileFar; x += tileFar) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.quadraticCurveTo(x + tileFar / 2, farBumpTop, x + tileFar, groundY);
    ctx.closePath();
    ctx.fill();
  }

  const tileNear = 140;
  ctx.fillStyle = theme.near;
  const offsetNear = parallaxNear % tileNear;
  for (let x = -tileNear - offsetNear; x < width + tileNear; x += tileNear) {
    const cx = x + tileNear * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, groundY - 70);
    ctx.lineTo(cx - 26, groundY);
    ctx.lineTo(cx + 26, groundY);
    ctx.closePath();
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  const theme = LEVEL_THEMES[level];
  const groundY = height * GROUND_RATIO;

  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  drawParallax(theme, groundY);

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.strokeStyle = theme.groundLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  const playerX = width * PLAYER_X_RATIO;
  for (const obstacle of obstacles) {
    drawShape(obstacle.x, groundY, OBSTACLE_WIDTH * 0.6, obstacle.element, false);
  }

  drawShape(playerX, groundY, PLAYER_SIZE * (flash > 0 ? 0.75 : 0.6), playerElement, true);

  ctx.fillStyle = "#eafff1";
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(String(score), width - 24, 40);

  if (levelBannerTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, levelBannerTimer / LEVEL_BANNER_DURATION);
    ctx.fillStyle = "#eafff1";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL ${level + 1}`, width / 2, 56);
    ctx.restore();
  }

  if (state === "gameover") {
    overlay("GAME OVER", "#ff6a2b");
  } else if (state === "won") {
    overlay("YOU WIN", "#3fb8ff");
  }
}

function overlay(text: string, color: string) {
  ctx.fillStyle = "rgba(6, 16, 10, 0.72)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText(text, width / 2, height / 2);
}

function loop(time: number) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    act();
  }
});
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  act();
});

resize();
reset();
requestAnimationFrame(loop);
