import { survivesObstacle, toggleElement, type Element } from "./game-logic";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const WIN_SCORE = 20;
const GROUND_RATIO = 0.72;
const PLAYER_X_RATIO = 0.18;
const PLAYER_SIZE = 34;
const OBSTACLE_WIDTH = 34;
const BASE_SPEED = 260; // px/sec
const SPEED_PER_POINT = 6;
const GAP_MIN = 260;
const GAP_MAX = 420;

const COLORS: Record<Element, { fill: string; glow: string }> = {
  fire: { fill: "#ff6a2b", glow: "#ffcf6a" },
  ice: { fill: "#3fb8ff", glow: "#c9f3ff" },
};

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

function reset() {
  state = "playing";
  playerElement = "fire";
  obstacles = [];
  score = 0;
  speed = BASE_SPEED;
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

  speed = BASE_SPEED + score * SPEED_PER_POINT;
  const dx = speed * dt;

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

function draw() {
  ctx.clearRect(0, 0, width, height);

  const groundY = height * GROUND_RATIO;

  // forest backdrop
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#0e2b1e");
  sky.addColorStop(1, "#1d4a30");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  ctx.fillStyle = "#122a1a";
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.strokeStyle = "#3a6b4a";
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
