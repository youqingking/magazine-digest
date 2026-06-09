import {
  GRID_SIZE,
  TICK_MS,
  advanceState,
  createInitialState,
  queueDirection,
  restartGame,
  startGame,
  togglePause,
  serializePosition,
} from "./snake-logic.js";

const board = document.querySelector("#board");
const score = document.querySelector("#score");
const status = document.querySelector("#status");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = Array.from(document.querySelectorAll("[data-direction]"));

const keyToDirection = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

let state = createInitialState();
let timerId = null;

buildBoard();
render();

startButton.addEventListener("click", () => {
  if (state.isGameOver || state.hasWon) {
    state = restartGame();
    state = startGame(state);
  } else if (state.isRunning) {
    state = togglePause(state);
  } else {
    state = startGame(state);
  }

  syncTimer();
  render();
  board.focus();
});

restartButton.addEventListener("click", () => {
  state = restartGame();
  syncTimer();
  render();
  board.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state = togglePause(state);
    syncTimer();
    render();
    return;
  }

  const nextDirection = keyToDirection[event.key];
  if (!nextDirection) {
    return;
  }

  event.preventDefault();

  if (!state.isRunning && !state.isGameOver && !state.hasWon) {
    state = startGame(state);
  }

  state = queueDirection(state, nextDirection);
  syncTimer();
  render();
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextDirection = button.dataset.direction;
    if (!nextDirection) {
      return;
    }

    if (!state.isRunning && !state.isGameOver && !state.hasWon) {
      state = startGame(state);
    }

    state = queueDirection(state, nextDirection);
    syncTimer();
    render();
    board.focus();
  });
});

function buildBoard() {
  const cells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.position = serializePosition({ x, y });
      cell.setAttribute("role", "gridcell");
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  return cells;
}

function syncTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }

  if (state.isRunning) {
    timerId = window.setInterval(() => {
      state = advanceState(state);
      if (!state.isRunning) {
        syncTimer();
      }
      render();
    }, TICK_MS);
  }
}

function render() {
  const snakeCells = new Set(state.snake.map(serializePosition));
  const headPosition = serializePosition(state.snake[0]);
  const foodPosition = state.food ? serializePosition(state.food) : "";

  Array.from(board.children).forEach((cell) => {
    const position = cell.dataset.position;
    cell.className = "cell";

    if (position === foodPosition) {
      cell.classList.add("food");
    }

    if (snakeCells.has(position)) {
      cell.classList.add("snake");
    }

    if (position === headPosition) {
      cell.classList.add("head");
    }
  });

  score.textContent = String(state.score);
  status.textContent = getStatusText();
  startButton.textContent = getPrimaryActionLabel();
}

function getStatusText() {
  if (state.hasWon) {
    return "Board filled. You win.";
  }

  if (state.isGameOver) {
    return "Game over. Restart to try again.";
  }

  if (state.isRunning) {
    return "Collect food and avoid walls or yourself.";
  }

  return state.score > 0 ? "Paused. Press Space or Start to continue." : "Press Start to begin.";
}

function getPrimaryActionLabel() {
  if (state.isGameOver || state.hasWon) {
    return "Play Again";
  }

  if (state.isRunning) {
    return "Pause";
  }

  return state.score > 0 ? "Resume" : "Start";
}
