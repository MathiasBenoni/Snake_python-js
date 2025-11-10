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

  ctx.clearRect(0, 0, 400, 400);

  const width = 40;
  const height = 40;
  ctx.fillStyle = "blue";
  ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);

  requestAnimationFrame(drawLoop);
}
drawLoop();
