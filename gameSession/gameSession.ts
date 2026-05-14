import type { ColumnsCoreModule, GameState, Piece } from "../runtime-types";

type GameConfig = {
  timing: {
    matchFlashMs: number;
    minDropIntervalMs: number;
    dropIntervalStartMs: number;
    dropIntervalLevelStepMs: number;
  };
  scoring: {
    hardDropPerCell: number;
    softDropPerCell: number;
    clearedGemPoints: number;
    bonusGemPoints: number;
    cascadeBonusPoints: number;
  };
  progression: {
    gemsPerLevel: number;
  };
};

type BoardConfig = {
  spawnRow: number;
  spawnColRatio: number;
};

type SessionOptions = {
  boardConfig: BoardConfig;
  gameConfig: GameConfig;
  core: ColumnsCoreModule;
  onGameOver?: (state: GameState) => void;
  onHudChange?: (state: GameState) => void;
  onLevelUp?: () => void;
  onMatch?: (match: { matchedCount: number; cascadeDepth: number }) => void;
  onPlace?: () => void;
  onPreviewChange?: (piece: Piece) => void;
};

type GameSessionApi = {
  awardSoftDrop: () => void;
  endGame: () => void;
  getState: () => GameState;
  hardDrop: () => number;
  initialize: () => void;
  move: (direction: number) => boolean;
  rotate: () => boolean;
  softDrop: () => boolean;
  start: () => void;
  tick: (timestamp: number) => void;
  togglePause: () => boolean | null;
};

export function createGameSession(options: SessionOptions): GameSessionApi {
  const {
    boardConfig,
    gameConfig,
    core,
    onGameOver,
    onHudChange,
    onLevelUp,
    onMatch,
    onPlace,
    onPreviewChange,
  } = options;
  const {
    createBoard,
    createPiece,
    clonePiece,
    rotateGems,
    isValidPosition,
    lockPiece,
    findMatches,
    markMatches,
    clearMarkedMatches,
  } = core;

  let state = createInitialState();
  let cascadeDepth = 0;

  function createInitialState(): GameState {
    return {
      board: createBoard(),
      active: null,
      next: createPiece(),
      started: false,
      score: 0,
      level: 1,
      clears: 0,
      dropTimer: 0,
      lastTime: 0,
      paused: false,
      gameOver: false,
      resolving: false,
      matchFlash: 0,
      flashMatches: [],
    };
  }

  function getState(): GameState {
    return state;
  }

  function initialize(): void {
    state = createInitialState();
    cascadeDepth = 0;
    notifyHudChange();
    notifyPreviewChange();
  }

  function start(): void {
    state = createInitialState();
    cascadeDepth = 0;
    state.started = true;
    spawnPiece();
    notifyHudChange();
  }

  function move(direction: number): boolean {
    if (!canControlPiece() || !state.active) {
      return false;
    }

    const nextCol = state.active.col + direction;
    if (!isValidPosition(state.board, nextCol, state.active.row, state.active.gems)) {
      return false;
    }

    state.active.col = nextCol;
    return true;
  }

  function rotate(): boolean {
    if (!canControlPiece() || !state.active) {
      return false;
    }

    state.active.gems = rotateGems(state.active.gems);
    return true;
  }

  function softDrop(): boolean {
    if (!canControlPiece() || !state.active) {
      return false;
    }

    const nextRow = state.active.row + 1;
    if (isValidPosition(state.board, state.active.col, nextRow, state.active.gems)) {
      state.active.row = nextRow;
      return true;
    }

    lockActivePiece();
    return false;
  }

  function hardDrop(): number {
    if (!canControlPiece()) {
      return 0;
    }

    let distance = 0;
    while (softDrop()) {
      distance += 1;
    }

    if (distance > 0) {
      state.score += distance * gameConfig.scoring.hardDropPerCell;
      notifyHudChange();
    }

    return distance;
  }

  function togglePause(): boolean | null {
    if (state.gameOver || !state.started) {
      return null;
    }

    state.paused = !state.paused;
    return state.paused;
  }

  function tick(timestamp: number): void {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const delta = timestamp - state.lastTime;
    state.lastTime = timestamp;

    if (!isRunActive()) {
      return;
    }

    if (state.resolving) {
      state.matchFlash -= delta;
      if (state.matchFlash <= 0) {
        clearMatches();
      }
      return;
    }

    state.dropTimer += delta;
    if (state.dropTimer >= getDropInterval()) {
      state.dropTimer = 0;
      softDrop();
    }
  }

  function awardSoftDrop(): void {
    state.score += gameConfig.scoring.softDropPerCell;
    notifyHudChange();
  }

  function endGame(): void {
    state.gameOver = true;
    state.active = null;
    cascadeDepth = 0;
    onGameOver?.(state);
  }

  function spawnPiece(): void {
    state.active = clonePiece(state.next ?? createPiece());
    state.active.col = Math.floor(core.DEFAULT_COLS * boardConfig.spawnColRatio);
    state.active.row = boardConfig.spawnRow;
    state.next = createPiece();
    notifyPreviewChange();

    if (!isValidPosition(state.board, state.active.col, state.active.row, state.active.gems)) {
      endGame();
    }
  }

  function lockActivePiece(): void {
    if (!state.active) {
      return;
    }

    lockPiece(state.board, state.active);
    state.active = null;
    onPlace?.();
    beginResolution();
  }

  function beginResolution(): void {
    cascadeDepth = 0;
    const matches = findMatches(state.board);

    if (matches.length === 0) {
      spawnPiece();
      return;
    }

    state.resolving = true;
    state.flashMatches = matches;
    state.matchFlash = gameConfig.timing.matchFlashMs;
    markMatches(state.board, matches);
    onMatch?.({ matchedCount: matches.length, cascadeDepth });
  }

  function clearMatches(): void {
    const { removed } = clearMarkedMatches(state.board, state.flashMatches);
    state.flashMatches = [];

    if (removed > 0) {
      const previousLevel = state.level;
      state.clears += removed;
      state.score += getMatchScore(removed, cascadeDepth);
      state.level = 1 + Math.floor(state.clears / gameConfig.progression.gemsPerLevel);
      notifyHudChange();

      if (state.level > previousLevel) {
        onLevelUp?.();
      }
    }

    const cascaded = findMatches(state.board);
    if (cascaded.length > 0) {
      cascadeDepth += 1;
      state.flashMatches = cascaded;
      state.matchFlash = gameConfig.timing.matchFlashMs;
      markMatches(state.board, cascaded);
      onMatch?.({ matchedCount: cascaded.length, cascadeDepth });
      return;
    }

    state.resolving = false;
    cascadeDepth = 0;
    spawnPiece();
  }

  function getDropInterval(): number {
    return Math.max(
      gameConfig.timing.minDropIntervalMs,
      gameConfig.timing.dropIntervalStartMs -
        (state.level - 1) * gameConfig.timing.dropIntervalLevelStepMs
    );
  }

  function getMatchScore(removed: number, activeCascadeDepth: number): number {
    const basePoints = removed * gameConfig.scoring.clearedGemPoints;
    const bonusPoints = Math.max(0, removed - 3) * gameConfig.scoring.bonusGemPoints;
    const cascadePoints = removed * activeCascadeDepth * gameConfig.scoring.cascadeBonusPoints;
    return basePoints + bonusPoints + cascadePoints;
  }

  function canControlPiece(): boolean {
    return Boolean(state.active) && isRunActive() && !state.resolving;
  }

  function isRunActive(): boolean {
    return state.started && !state.paused && !state.gameOver;
  }

  function notifyHudChange(): void {
    onHudChange?.(state);
  }

  function notifyPreviewChange(): void {
    onPreviewChange?.(state.next);
  }

  return {
    awardSoftDrop,
    endGame,
    getState,
    hardDrop,
    initialize,
    move,
    rotate,
    softDrop,
    start,
    tick,
    togglePause,
  };
}
