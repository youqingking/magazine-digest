export const GRID_SIZE = 16;
export const TICK_MS = 140;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const INITIAL_SNAKE = [
  { x: 2, y: 8 },
  { x: 1, y: 8 },
  { x: 0, y: 8 },
];

export function createInitialState(random = Math.random) {
  const snake = INITIAL_SNAKE.map((segment) => ({ ...segment }));

  return {
    gridSize: GRID_SIZE,
    snake,
    direction: "right",
    nextDirection: "right",
    food: placeFood(GRID_SIZE, snake, random),
    score: 0,
    isRunning: false,
    isGameOver: false,
    hasWon: false,
  };
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state;
  }

  const activeDirection = state.nextDirection ?? state.direction;
  if (state.snake.length > 1 && isOppositeDirection(activeDirection, nextDirection)) {
    return state;
  }

  if (activeDirection === nextDirection) {
    return state;
  }

  return {
    ...state,
    nextDirection,
  };
}

export function startGame(state) {
  if (state.hasWon) {
    return createInitialState();
  }

  return {
    ...state,
    isRunning: !state.isGameOver,
  };
}

export function togglePause(state) {
  if (state.isGameOver || state.hasWon) {
    return state;
  }

  return {
    ...state,
    isRunning: !state.isRunning,
  };
}

export function restartGame(random = Math.random) {
  return createInitialState(random);
}

export function advanceState(state, random = Math.random) {
  if (!state.isRunning || state.isGameOver || state.hasWon) {
    return state;
  }

  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const nextHead = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };

  if (isOutOfBounds(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      isRunning: false,
      isGameOver: true,
    };
  }

  const willGrow = positionsEqual(nextHead, state.food);
  const bodyToCheck = willGrow ? state.snake : state.snake.slice(0, -1);

  if (bodyToCheck.some((segment) => positionsEqual(segment, nextHead))) {
    return {
      ...state,
      direction,
      isRunning: false,
      isGameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) {
    nextSnake.pop();
  }

  const hasWon = nextSnake.length === state.gridSize * state.gridSize;

  return {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
    food: willGrow && !hasWon ? placeFood(state.gridSize, nextSnake, random) : state.food,
    score: willGrow ? state.score + 1 : state.score,
    isRunning: hasWon ? false : state.isRunning,
    isGameOver: false,
    hasWon,
  };
}

export function placeFood(gridSize, snake, random = Math.random) {
  const occupied = new Set(snake.map(serializePosition));
  const emptyCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = { x, y };
      if (!occupied.has(serializePosition(cell))) {
        emptyCells.push(cell);
      }
    }
  }

  if (emptyCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * emptyCells.length);
  return emptyCells[index];
}

export function serializePosition(position) {
  return `${position.x},${position.y}`;
}

function isOutOfBounds(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

function isOppositeDirection(current, next) {
  const currentVector = DIRECTIONS[current];
  const nextVector = DIRECTIONS[next];

  return (
    currentVector.x + nextVector.x === 0 &&
    currentVector.y + nextVector.y === 0
  );
}

function positionsEqual(a, b) {
  return Boolean(a) && Boolean(b) && a.x === b.x && a.y === b.y;
}
