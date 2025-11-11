const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

function drawGrid() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      ctx.fillStyle = "green"; // tile color
      ctx.fillRect(x, y, tileSize, tileSize);

      ctx.strokeStyle = "black"; // tile border
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }
}

async function sendDirection(dir) {
  await fetch("/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction: dir }),
  });
}

async function spawnFruit() {
  await fetch("/spawn_fruit", {
    method: "POST",
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w") {
    sendDirection("up");
    console.log("Up");
  }
  if (e.key === "s") {
    sendDirection("down");
    console.log("Down");
  }
  if (e.key === "a") {
    sendDirection("left");
    console.log("Left");
  }
  if (e.key === "d") {
    sendDirection("right");
    console.log("Right");
  }
});

async function drawLoop() {
  const res = await fetch("/position");
  const pos = await res.json();

  const fruitsRes = await fetch("/fruits");
  const fruits = await fruitsRes.json();

  const snakeRes = await fetch("/snake_body");
  const snakeBody = await snakeRes.json();

  ctx.clearRect(0, 0, 400, 400);

  drawGrid();

  // Draw fruits
  fruits.forEach((fruit) => {
    const fruitX = fruit.x * tileSize;
    const fruitY = fruit.y * tileSize;
    ctx.fillStyle = "red";
    ctx.fillRect(fruitX, fruitY, tileSize, tileSize);
  });

  // Draw snake body
  snakeBody.forEach((segment, index) => {
    const segX = segment.x * tileSize;
    const segY = segment.y * tileSize;

    ctx.fillStyle = "lightblue"; // tail color

    ctx.fillRect(
      segX + tileSize * 0.15,
      segY + tileSize * 0.15,
      tileSize * 0.7,
      tileSize * 0.7
    );
  });

  // Snap player to the nearest tile
  const snappedX = Math.floor(pos.x / tileSize) * tileSize;
  const snappedY = Math.floor(pos.y / tileSize) * tileSize;

  const width = tileSize * 0.7;
  const height = tileSize * 0.7;
  ctx.fillStyle = "blue";
  ctx.fillRect(
    snappedX + tileSize * 0.15, // center inside tile
    snappedY + tileSize * 0.15,
    width,
    height
  );

  requestAnimationFrame(drawLoop);
}

// Spawn initial fruit
spawnFruit();

drawLoop();
