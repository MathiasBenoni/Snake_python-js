const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

let autoMoveInterval = null;
let currentDirection = "right"; // Start moving right

// ──────────────────────────
// Draw Grid
// ──────────────────────────
function drawGrid() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      ctx.fillStyle = "green";
      ctx.fillRect(x, y, tileSize, tileSize);

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }
}

// ──────────────────────────
// Movement + Fruit
// ──────────────────────────
async function sendDirection(dir) {
  await fetch("/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction: dir }),
  });
}

async function spawnFruit() {
  await fetch("/spawn_fruit", { method: "POST" });
}

// ──────────────────────────
// Auto Movement
// ──────────────────────────
function startAutoMove() {
  if (autoMoveInterval) return;

  autoMoveInterval = setInterval(() => {
    if (currentDirection) {
      sendDirection(currentDirection);
    }
  }, 300);
}

// ──────────────────────────
// Key Input
// ──────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "w") {
    currentDirection = "up";
    startAutoMove();
  }
  if (e.key === "s") {
    currentDirection = "down";
    startAutoMove();
  }
  if (e.key === "a") {
    currentDirection = "left";
    startAutoMove();
  }
  if (e.key === "d") {
    currentDirection = "right";
    startAutoMove();
  }
});

// ──────────────────────────
// Draw Snake with Single Bulge
// ──────────────────────────
function drawSnake(snakeBody, bulgeIndex, headTileX, headTileY) {
  ctx.fillStyle = "lightblue";

  // Draw each segment
  for (let i = 0; i < snakeBody.length; i++) {
    const seg = snakeBody[i];
    const isBulge = i === bulgeIndex;
    const size = isBulge ? tileSize : tileSize * 0.7;
    const offset = (tileSize - size) / 2;

    // Draw the segment square
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

    // Determine sizes for connection width
    const isBulge = i === bulgeIndex;
    const isPrevBulge = i === 0 ? false : i - 1 === bulgeIndex;

    let connectionSize;
    if (isBulge || isPrevBulge) {
      // Use thin connection (0.7) when connecting to/from bulge
      connectionSize = tileSize * 0.7;
    } else {
      // Normal thin connection
      connectionSize = tileSize * 0.7;
    }

    // Draw connecting line
    ctx.fillRect(
      Math.min(segCenterX, prevCenterX) - connectionSize / 2,
      Math.min(segCenterY, prevCenterY) - connectionSize / 2,
      Math.abs(segCenterX - prevCenterX) + connectionSize,
      Math.abs(segCenterY - prevCenterY) + connectionSize
    );
  }
}

// ──────────────────────────
// Draw Loop
// ──────────────────────────
async function drawLoop() {
  const pos = await (await fetch("/position")).json();
  const fruits = await (await fetch("/fruits")).json();
  const snakeData = await (await fetch("/snake_body")).json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Draw fruits
  for (const fruit of fruits) {
    ctx.fillStyle = "red";
    ctx.fillRect(fruit.x * tileSize, fruit.y * tileSize, tileSize, tileSize);
  }

  const headTileX = Math.floor(pos.x / tileSize);
  const headTileY = Math.floor(pos.y / tileSize);

  // Draw connected snake with single bulge
  drawSnake(snakeData.segments, snakeData.bulge_index, headTileX, headTileY);

  // Draw head
  const offset = tileSize * 0.15;
  const size = tileSize * 0.7;
  ctx.fillStyle = "blue";
  ctx.fillRect(
    headTileX * tileSize + offset,
    headTileY * tileSize + offset,
    size,
    size
  );

  requestAnimationFrame(drawLoop);
}

// ──────────────────────────
// Init
// ──────────────────────────
spawnFruit();
drawLoop();
startAutoMove();
