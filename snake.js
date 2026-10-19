(() => {
  "use strict";
  const overlay = document.getElementById("arcade-overlay");
  const board = document.getElementById("snake-board");
  const ctx = board.getContext("2d");
  const message = document.getElementById("arcade-message");
  const messageTitle = document.getElementById("arcade-message-title");
  const messageText = document.getElementById("arcade-message-text");
  const scoreNode = document.getElementById("arcade-score");
  const bestNode = document.getElementById("arcade-best");
  const pauseButton = document.getElementById("arcade-pause");
  const size = 20, cell = board.width / size;
  let snake, food, direction, nextDirection, score, best = 0, timer = null;
  let running = false, paused = false, previousFocus = null;
  const bestKey = "placido-arcade-snake-best";

  try { best = Number(localStorage.getItem(bestKey)) || 0; } catch (_) {}
  bestNode.textContent = best;

  function placeFood() {
    const free = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!snake.some(part => part.x === x && part.y === y)) free.push({x, y});
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  function reset() {
    snake = [{x: 9, y: 10}, {x: 8, y: 10}, {x: 7, y: 10}];
    direction = {x: 1, y: 0};
    nextDirection = {x: 1, y: 0};
    score = 0;
    scoreNode.textContent = "0";
    food = placeFood();
    running = false;
    paused = false;
    pauseButton.textContent = "Pause";
    showMessage("SNAKE", "Press Play or use an arrow key to start");
    render();
  }

  function showMessage(title, description) {
    messageTitle.textContent = title;
    messageText.textContent = description;
    message.hidden = false;
  }
  function hideMessage() { message.hidden = true; }
  function stopTimer() { if (timer !== null) clearInterval(timer); timer = null; }
  function start() {
    stopTimer();
    reset();
    running = true;
    hideMessage();
    timer = setInterval(tick, 115);
    board.focus();
  }
  function finish(won = false) {
    running = false;
    stopTimer();
    showMessage(won ? "YOU WIN!" : "GAME OVER", `Score: ${score} · Press Play to try again`);
  }
  function tick() {
    if (!running || paused) return;
    direction = nextDirection;
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    const eating = food && head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size ||
        body.some(part => part.x === head.x && part.y === head.y)) {
      finish();
      return;
    }
    snake.unshift(head);
    if (eating) {
      score += 10;
      scoreNode.textContent = score;
      if (score > best) {
        best = score;
        bestNode.textContent = best;
        try { localStorage.setItem(bestKey, String(best)); } catch (_) {}
      }
      food = placeFood();
      if (!food) { render(); finish(true); return; }
    } else snake.pop();
    render();
  }
  function render() {
    ctx.clearRect(0, 0, board.width, board.height);
    ctx.fillStyle = "#081027";
    ctx.fillRect(0, 0, board.width, board.height);
    ctx.strokeStyle = "#24345955";
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, board.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(board.width, i * cell); ctx.stroke();
    }
    if (food) {
      ctx.fillStyle = "#fb63ca";
      ctx.shadowColor = "#ff4dbd"; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc((food.x + .5) * cell, (food.y + .5) * cell, cell * .32, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    snake.forEach((part, i) => {
      ctx.fillStyle = i === 0 ? "#9fefff" : (i % 2 ? "#697cff" : "#886aff");
      ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4);
    });
  }
  function steer(key) {
    const dirs = {
      ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1},
      ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0},
      w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}
    };
    const proposed = dirs[key];
    if (!proposed) return false;
    if (!running) start();
    if (proposed.x !== -direction.x || proposed.y !== -direction.y) nextDirection = proposed;
    return true;
  }
  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    if (paused) showMessage("PAUSED", "Press Resume or Space to continue");
    else hideMessage();
  }
  function open() {
    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("arcade-open");
    reset();
    document.getElementById("arcade-close").focus();
  }
  function close() {
    stopTimer();
    running = false;
    overlay.hidden = true;
    document.body.classList.remove("arcade-open");
    if (previousFocus?.focus) previousFocus.focus();
  }
  document.getElementById("arcade-play").addEventListener("click", start);
  pauseButton.addEventListener("click", togglePause);
  document.querySelectorAll(".arcade-dir").forEach(button => {
    button.addEventListener("click", () => steer("Arrow" + button.dataset.dir[0].toUpperCase() + button.dataset.dir.slice(1)));
  });
  document.addEventListener("keydown", e => {
    if (!document.activeElement?.closest(".arcade-embedded") && !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return;
    if (e.key === " " || e.code === "Space") { e.preventDefault(); if (!running) start(); else togglePause(); return; }
    if (document.activeElement?.closest(".arcade-embedded") && steer(e.key)) e.preventDefault();
  });
  let touchStart = null;
  board.addEventListener("touchstart", e => {
    if (e.touches.length === 1) touchStart = {x:e.touches[0].clientX,y:e.touches[0].clientY};
  }, {passive:true});
  board.addEventListener("touchend", e => {
    if (!touchStart || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp"));
  }, {passive:true});
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running && !paused) togglePause();
  });
  reset();
})();
