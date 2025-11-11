const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");

const tileSize = 40;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

let gameState = {
  snake: [],
  fruits: [],
  score: 0,
  gameOver: false,
};

function drawGrid() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      // Checkerboard pattern
      ctx.fillStyle = (row + col) % 2 === 0 ? "#2a9d4f" : "#2ecc71";
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
}

function drawSnake() {
  gameState.snake.forEach((segment, i) => {
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;

    // Head is different color
    if (i === 0) {
      ctx.fillStyle = "#1e3799";
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Eyes
      ctx.fillStyle = "white";
      ctx.fillRect(x + 8, y + 10, 6, 6);
      ctx.fillRect(x + 26, y + 10, 6, 6);
    } else {
      ctx.fillStyle = "#3742fa";
      ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
    }
  });
}

function drawFruits() {
  gameState.fruits.forEach((fruit) => {
    const x = fruit.x * tileSize;
    const y = fruit.y * tileSize;

    ctx.fillStyle = "#ff4757";
    ctx.beginPath();
    ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
    ctx.fill();

    // Shine effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x + tileSize / 2 - 5, y + tileSize / 2 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function sendDirection(dir) {
  await fetch("/direction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction: dir }),
  });
}

async function updateGame() {
  const res = await fetch("/update", { method: "POST" });
  const data = await res.json();

  if (data.gameOver) {
    gameState.gameOver = true;
    gameOverEl.style.display = "block";
    finalScoreEl.textContent = gameState.score;
    return;
  }

  gameState = data;
  scoreEl.textContent = `Score: ${gameState.score}`;
}

async function resetGame() {
  await fetch("/reset", { method: "POST" });
  gameOverEl.style.display = "none";

  const res = await fetch("/state");
  gameState = await res.json();
  scoreEl.textContent = `Score: ${gameState.score}`;
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "w" || key === "arrowup") {
    sendDirection("up");
    e.preventDefault();
  } else if (key === "s" || key === "arrowdown") {
    sendDirection("down");
    e.preventDefault();
  } else if (key === "a" || key === "arrowleft") {
    sendDirection("left");
    e.preventDefault();
  } else if (key === "d" || key === "arrowright") {
    sendDirection("right");
    e.preventDefault();
  }
});

function draw() {
  ctx.clearRect(0, 0, 400, 400);
  drawGrid();
  drawFruits();
  drawSnake();
  requestAnimationFrame(draw);
}

// Game loop - update every 150ms
setInterval(() => {
  if (!gameState.gameOver) {
    updateGame();
  }
}, 150);

// Initial load
(async () => {
  await resetGame();
  draw();
})();
