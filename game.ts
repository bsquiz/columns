import {
  playCascadeMatchSound,
  isMusicMuted,
  pauseGameplayMusic,
  playBonusMatchSound,
  playGameOverSound,
  playLevelUpSound,
  playMatchSound,
  playPlaceSound,
  playRotateSound,
  startGameplayMusic,
  stopGameplayMusic,
  toggleMusicMuted,
} from "./audio/audio";
import { BOARD, GAME } from "./constants";
import * as core from "./columns-core";
import { getGameElements } from "./dom";
import { createGameSession } from "./gameSession/gameSession";
import { createRenderer, drawPreviewGem } from "./graphics/gameboyGraphics";
import { createHighScoreService } from "./highScores/highScores";
import { createHud } from "./hud/hud";
import { bindGameInput } from "./input/input";
import { createOverlayController } from "./overlays/overlays";
import type { Board, GameState, HighScoreEntry, HighScoreRow, Piece } from "./runtime-types";

const elements = getGameElements();
const renderer = createRenderer(elements.canvas, {
  cols: core.DEFAULT_COLS,
  rows: core.DEFAULT_ROWS,
});
const highScores = createHighScoreService({
  storageKey: GAME.highScores.storageKey,
  maxEntries: GAME.highScores.maxEntries,
  text: GAME.text,
});
const hud = createHud({
  scoreEl: elements.scoreEl,
  levelEl: elements.levelEl,
  clearsEl: elements.clearsEl,
  nextPieceEl: elements.nextPieceEl,
  musicToggleEl: elements.musicToggleEl,
  drawPreviewGem,
});
const overlays = createOverlayController({
  overlayEl: elements.overlayEl,
  text: GAME.text,
});
const session = createGameSession({
  boardConfig: BOARD,
  gameConfig: GAME,
  core,
  onGameOver: handleGameOver,
  onHudChange: syncHud,
  onLevelUp: handleLevelUp,
  onMatch: handleMatchFeedback,
  onPlace: handlePlace,
  onPreviewChange: handlePreviewChange,
});

type PendingPostFillAction = () => void;

type GameOverFillAnimation = {
  board: Board;
  empties: Array<[number, number]>;
  elapsedMs: number;
  lastTimestamp: number | null;
  totalEmpties: number;
  onComplete: PendingPostFillAction;
};

let gameOverFillAnimation: GameOverFillAnimation | null = null;

function syncHud(state: GameState): void {
  hud.renderStats(state);
  hud.updateMusicToggleLabel(isMusicMuted());
}

function handleLevelUp(): void {
  playLevelUpSound();
}

function handleMatchFeedback(match: { matchedCount: number; cascadeDepth: number }): void {
  if (match.cascadeDepth > 0) {
    playCascadeMatchSound(1.22 + match.cascadeDepth * 0.08);
    return;
  }

  if (match.matchedCount > 3) {
    playBonusMatchSound();
    return;
  }

  playMatchSound();
}

function handlePlace(): void {
  playPlaceSound();
}

function handlePreviewChange(piece: Piece): void {
  hud.renderNextPiece(piece);
}

function restartGame(): void {
  gameOverFillAnimation = null;
  session.start();
  overlays.hide();
  startGameplayMusic();
}

function initializeStartScreen(): void {
  gameOverFillAnimation = null;
  session.initialize();
  stopGameplayMusic();
  overlays.showStartScreen();
}

function startGame(): void {
  restartGame();
}

function handleGameOver(state: GameState): void {
  stopGameplayMusic();
  playGameOverSound();

  const entry: HighScoreEntry = {
    score: state.score,
    level: state.level,
    gems: state.clears,
  };
  const currentHighScores = highScores.load();

  if (highScores.qualifies(entry, currentHighScores)) {
    queueGameOverFillAnimation(state, () => {
      overlays.showNameEntryScreen(entry, {
        defaultName: GAME.text.highScoreName,
        normalizeName: highScores.normalizeName,
        onSubmit: (name) => {
          overlays.showSavingHighScoreScreen();
          window.setTimeout(() => {
            const savedHighScores = highScores.save({ ...entry, name });
            overlays.showGameOverScreen(state, savedHighScores);
          }, GAME.timing.highScoreSaveDelayMs);
        },
      });
    });
    return;
  }

  queueGameOverFillAnimation(state, () => {
    overlays.showGameOverScreen(state, highScores.fill(currentHighScores));
  });
}

function togglePause(): void {
  const paused = session.togglePause();
  if (paused === null) {
    return;
  }

  if (paused) {
    pauseGameplayMusic();
    overlays.showText(GAME.text.paused);
  } else {
    startGameplayMusic();
    overlays.hide();
  }
}

function drawFrame(): void {
  const state = session.getState();
  if (gameOverFillAnimation) {
    renderer.render(gameOverFillAnimation.board, null);
    return;
  }

  renderer.render(state.board, state.active);
}

function update(timestamp: number): void {
  updateGameOverFillAnimation(timestamp);
  session.tick(timestamp);
  drawFrame();
  requestAnimationFrame(update);
}

function handleMusicToggle(): void {
  toggleMusicMuted();
  hud.updateMusicToggleLabel(isMusicMuted());
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function bindControls(): void {
  bindGameInput({
    onHardDrop: handleHardDrop,
    onMoveLeft: handleMoveLeft,
    onMoveRight: handleMoveRight,
    onPause: handlePause,
    onRestart: handleRestart,
    onRotate: handleRotate,
    onSoftDrop: handleSoftDrop,
    onStart: handleStart,
    shouldIgnoreTarget: isTextEntryTarget,
  });

  elements.musicToggleEl?.addEventListener("click", handleMusicToggle);
}

function handleHardDrop(): void {
  session.hardDrop();
}

function handleMoveLeft(): void {
  session.move(-1);
}

function handleMoveRight(): void {
  session.move(1);
}

function handlePause(): void {
  togglePause();
}

function handleRestart(): void {
  restartGame();
}

function handleRotate(): void {
  if (session.rotate()) {
    playRotateSound();
  }
}

function handleSoftDrop(): void {
  if (session.softDrop()) {
    session.awardSoftDrop();
  }
}

function handleStart(): boolean {
  if (!session.getState().started) {
    startGame();
    return true;
  }

  return false;
}

function queueGameOverFillAnimation(state: GameState, onComplete: PendingPostFillAction): void {
  const board = cloneBoard(state.board);
  const empties = getEmptyCells(board);

  if (empties.length === 0) {
    onComplete();
    return;
  }

  overlays.hide();
  gameOverFillAnimation = {
    board,
    empties,
    elapsedMs: 0,
    lastTimestamp: null,
    totalEmpties: empties.length,
    onComplete,
  };
}

function updateGameOverFillAnimation(timestamp: number): void {
  if (!gameOverFillAnimation) {
    return;
  }

  if (gameOverFillAnimation.lastTimestamp === null) {
    gameOverFillAnimation.lastTimestamp = timestamp;
    return;
  }

  const delta = timestamp - gameOverFillAnimation.lastTimestamp;
  gameOverFillAnimation.lastTimestamp = timestamp;
  const previousElapsedMs = gameOverFillAnimation.elapsedMs;
  const nextElapsedMs = Math.min(
    previousElapsedMs + delta,
    GAME.timing.gameOverFillDurationMs
  );
  gameOverFillAnimation.elapsedMs = nextElapsedMs;
  const previousFilledCount = Math.floor(
    (previousElapsedMs / GAME.timing.gameOverFillDurationMs) * gameOverFillAnimation.totalEmpties
  );
  const nextFilledCount = Math.floor(
    (nextElapsedMs / GAME.timing.gameOverFillDurationMs) * gameOverFillAnimation.totalEmpties
  );
  const fillCount = nextFilledCount - previousFilledCount;

  if (fillCount <= 0) {
    return;
  }

  fillEmptyCells(gameOverFillAnimation.board, gameOverFillAnimation.empties, fillCount);

  if (gameOverFillAnimation.empties.length > 0) {
    return;
  }

  const { onComplete } = gameOverFillAnimation;
  gameOverFillAnimation = null;
  onComplete();
}

function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell ? { color: cell.color, clearing: cell.clearing } : null))
  );
}

function getEmptyCells(board: Board): Array<[number, number]> {
  const empties: Array<[number, number]> = [];

  for (let row = board.length - 1; row >= 0; row -= 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (!board[row][col]) {
        empties.push([row, col]);
      }
    }
  }

  return empties;
}

function fillEmptyCells(board: Board, empties: Array<[number, number]>, count: number): void {
  for (let index = 0; index < count && empties.length > 0; index += 1) {
    const [row, col] = empties.shift() as [number, number];
    const colorIndex = (row * core.DEFAULT_COLS + col) % BOARD.colors.length;
    board[row][col] = core.createCell(BOARD.colors[colorIndex]);
  }
}

function bootstrapGame(): void {
  bindControls();
  initializeStartScreen();
  requestAnimationFrame(update);
}

bootstrapGame();
