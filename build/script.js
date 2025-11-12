const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

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
// Key Input
// ──────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "w") sendDirection("up");
  if (e.key === "s") sendDirection("down");
  if (e.key === "a") sendDirection("left");
  if (e.key === "d") sendDirection("right");
});

// ──────────────────────────
// Draw Snake Connected
// ──────────────────────────
function drawSnake(snakeBody, headTileX, headTileY) {
  const offset = tileSize * 0.15;
  const size = tileSize * 0.7;
  const center = offset + size / 2;

  ctx.fillStyle = "lightblue";

  // Draw each segment
  for (let i = 0; i < snakeBody.length; i++) {
    const seg = snakeBody[i];

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

    const segCenterX = seg.x * tileSize + center;
    const segCenterY = seg.y * tileSize + center;
    const prevCenterX = prev.x * tileSize + center;
    const prevCenterY = prev.y * tileSize + center;

    // Draw connecting line
    ctx.fillRect(
      Math.min(segCenterX, prevCenterX) - size / 2,
      Math.min(segCenterY, prevCenterY) - size / 2,
      Math.abs(segCenterX - prevCenterX) + size,
      Math.abs(segCenterY - prevCenterY) + size
    );
  }
}

// ──────────────────────────
// Draw Loop
// ──────────────────────────
async function drawLoop() {
  const pos = await (await fetch("/position")).json();
  const fruits = await (await fetch("/fruits")).json();
  const snakeBody = await (await fetch("/snake_body")).json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Draw fruits
  for (const fruit of fruits) {
    ctx.fillStyle = "red";
    ctx.fillRect(fruit.x * tileSize, fruit.y * tileSize, tileSize, tileSize);
  }

  const headTileX = Math.floor(pos.x / tileSize);
  const headTileY = Math.floor(pos.y / tileSize);

  // Draw connected snake
  drawSnake(snakeBody, headTileX, headTileY);

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
