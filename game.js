// game.js — state, game loop, resize, and boot
// draw() is defined in render.js; input listeners are set up in input.js

var COLS = 20;
var ROWS = 20;
var FPS  = 9;
var CELL; // pixels per cell, computed in resize()

// ── State ─────────────────────────────────────────────────────────────────

var snake, dir, nextDir, food, score, best, phase, loopTimer;
// phase: 'idle' | 'running' | 'dead'

function init() {
  snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  placeFood();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(function(s) { return s.x === food.x && s.y === food.y; }));
}

function start() {
  if (loopTimer) clearInterval(loopTimer);
  init();
  phase     = 'running';
  loopTimer = setInterval(tick, 1000 / FPS);
}

// ── Game loop ──────────────────────────────────────────────────────────────

function tick() {
  dir = nextDir;

  var head = { x: (snake[0].x + dir.x + COLS) % COLS,
               y: (snake[0].y + dir.y + ROWS) % ROWS };

  if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
    phase = 'dead';
    best  = Math.max(best, score);
    clearInterval(loopTimer);
    draw();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

// ── Resize ────────────────────────────────────────────────────────────────

function resize() {
  var size  = Math.min(window.innerWidth, window.innerHeight);
  CELL      = Math.floor(size / COLS);
  var px    = CELL * COLS;
  canvas.width  = px;
  canvas.height = px;
  draw();
}

window.addEventListener('resize', resize);

// ── Boot ──────────────────────────────────────────────────────────────────

best  = 0;
phase = 'idle';
init();
resize();
