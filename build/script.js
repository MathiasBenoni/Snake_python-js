const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

let autoMoveInterval = null;
let currentDirection = null;
let isGameOver = false;
let gameStarted = false;
let hasWon = false;

const FRAME_RATE = 1000 / 60; // 60 FPS
const MOVE_INTERVAL = 300; // milliseconds between moves
let lastMoveTime = 0;
let lastFrameTime = 0;

// ──────────────────────────
// Draw Grid
// ──────────────────────────
function drawGrid() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      ctx.fillStyle = "black";
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

// ──────────────────────────
// Movement + Fruit
// ──────────────────────────
async function sendDirection(dir) {
  const response = await fetch("/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction: dir }),
  });
  const data = await response.json();

  if (data.game_over) {
    hasWon = data.won;
    handleGameOver();
  }
}

async function spawnFruit() {
  await fetch("/spawn_fruit", { method: "POST" });
}

async function setFruitCount(count) {
  await fetch("/set_fruit_count", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: parseInt(count) }),
  });
}

async function resetGame() {
  await fetch("/reset", { method: "POST" });
  isGameOver = false;
  hasWon = false;
  currentDirection = null;
  gameStarted = false;
  lastMoveTime = 0;
}

function handleGameOver() {
  isGameOver = true;

  // Draw game over message on next frame
  setTimeout(() => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (hasWon) {
      ctx.fillStyle = "gold";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 40);

      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText(
        "Board completely filled!",
        canvas.width / 2,
        canvas.height / 2 + 10
      );
    } else {
      ctx.fillStyle = "red";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText("You crashed!", canvas.width / 2, canvas.height / 2 + 10);
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "lightgreen";
    ctx.fillText(
      "Press SPACE to restart",
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }, 50);
}

// ──────────────────────────
// Auto Movement with consistent timing
// ──────────────────────────
function updateGame(currentTime) {
  if (currentDirection && !isGameOver && gameStarted) {
    if (currentTime - lastMoveTime >= MOVE_INTERVAL) {
      sendDirection(currentDirection);
      lastMoveTime = currentTime;
    }
  }
}

// ──────────────────────────
// Key Input
// ──────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === " " && isGameOver) {
    e.preventDefault();
    resetGame();
    return;
  }

  if (isGameOver) return;

  let newDirection = null;

  if (e.key === "w" || e.keyCode == 38) {
    newDirection = "up";
  }
  if (e.key === "s" || e.keyCode == 40) {
    newDirection = "down";
  }
  if (e.key === "a" || e.keyCode == 37) {
    newDirection = "left";
  }
  if (e.key === "d" || e.keyCode == 39) {
    newDirection = "right";
  }

  // If a valid direction key was pressed
  if (newDirection) {
    // Prevent starting with opposite direction
    if (!gameStarted) {
      const opposites = {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
      };
      const initialDirection = "right";

      if (opposites[initialDirection] === newDirection) {
        return;
      }

      gameStarted = true;
      currentDirection = newDirection;
      lastMoveTime = performance.now();
    } else {
      currentDirection = newDirection;
    }
  }
});

// ──────────────────────────
// Draw Snake with Single Bulge
// ──────────────────────────
function drawSnake(snakeBody, bulgeIndex, headTileX, headTileY) {
  ctx.fillStyle = "white";

  // Draw each segment
  for (let i = 0; i < snakeBody.length; i++) {
    const seg = snakeBody[i];
    const isBulge = i === bulgeIndex;
    const size = isBulge ? tileSize : tileSize * 0.7;
    const offset = (tileSize - size) / 2;

    ctx.fillRect(
      seg.x * tileSize + offset,
      seg.y * tileSize + offset,
      size,
      size
    );
  }

  // Draw connections between segments
  for (let i = 0; i < snakeBody.length; i++) {
    const seg = snakeBody[i];
    const prev = i === 0 ? { x: headTileX, y: headTileY } : snakeBody[i - 1];

    const segCenterX = seg.x * tileSize + tileSize / 2;
    const segCenterY = seg.y * tileSize + tileSize / 2;
    const prevCenterX = prev.x * tileSize + tileSize / 2;
    const prevCenterY = prev.y * tileSize + tileSize / 2;

    const connectionSize = tileSize * 0.7;

    ctx.fillRect(
      Math.min(segCenterX, prevCenterX) - connectionSize / 2,
      Math.min(segCenterY, prevCenterY) - connectionSize / 2,
      Math.abs(segCenterX - prevCenterX) + connectionSize,
      Math.abs(segCenterY - prevCenterY) + connectionSize
    );
  }
}

// ──────────────────────────
// Draw Loop with consistent framerate
// ──────────────────────────
async function drawLoop(currentTime) {
  // Throttle to consistent frame rate
  if (currentTime - lastFrameTime < FRAME_RATE) {
    requestAnimationFrame(drawLoop);
    return;
  }
  lastFrameTime = currentTime;

  // Update game logic
  updateGame(currentTime);

  if (isGameOver) {
    requestAnimationFrame(drawLoop);
    return;
  }

  const pos = await (await fetch("/position")).json();
  const fruits = await (await fetch("/fruits")).json();
  const snakeData = await (await fetch("/snake_body")).json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Draw fruits
  for (const fruit of fruits) {
    ctx.fillStyle = "white";
    ctx.fillRect(
      fruit.x * tileSize + tileSize * 0.25,
      fruit.y * tileSize + tileSize * 0.25,
      tileSize * 0.5,
      tileSize * 0.5
    );
  }

  const headTileX = Math.floor(pos.x / tileSize);
  const headTileY = Math.floor(pos.y / tileSize);

  drawSnake(snakeData.segments, snakeData.bulge_index, headTileX, headTileY);

  // Draw head
  const offset = tileSize * 0.15;
  const size = tileSize * 0.7;
  ctx.fillStyle = "white";
  ctx.fillRect(
    headTileX * tileSize + offset,
    headTileY * tileSize + offset,
    size,
    size
  );

  // Draw start message
  if (!gameStarted) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press any arrow key to start",
      canvas.width / 2,
      canvas.height / 2
    );
  }

  requestAnimationFrame(drawLoop);
}

// ──────────────────────────
// Fruit Count Control
// ──────────────────────────
const fruitInput = document.getElementById("fruitCount");
const fruitButton = document.getElementById("setFruitCount");

fruitButton.addEventListener("click", async () => {
  const count = fruitInput.value;
  await setFruitCount(count);
  await resetGame();
});

// ──────────────────────────
// Init
// ──────────────────────────
spawnFruit();
requestAnimationFrame(drawLoop);
