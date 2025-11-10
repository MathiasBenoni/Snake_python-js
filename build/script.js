const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

async function sendDirection(dir) {
  await fetch("/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction: dir }),
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") sendDirection("up");
  if (e.key === "ArrowDown") sendDirection("down");
  if (e.key === "ArrowLeft") sendDirection("left");
  if (e.key === "ArrowRight") sendDirection("right");
});

async function drawLoop() {
  const res = await fetch("/position");
  const pos = await res.json();

  ctx.clearRect(0, 0, 400, 400);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.closePath();

  requestAnimationFrame(drawLoop);
}
drawLoop();
