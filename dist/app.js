"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // gameSession/gameSession.ts
  function createGameSession(options) {
    const {
      boardConfig,
      gameConfig,
      core,
      onGameOver,
      onHudChange,
      onLevelUp,
      onMatch,
      onPlace,
      onPreviewChange
    } = options;
    const {
      createBoard: createBoard2,
      createPiece: createPiece2,
      clonePiece: clonePiece2,
      rotateGems: rotateGems2,
      isValidPosition: isValidPosition2,
      lockPiece: lockPiece2,
      findMatches: findMatches2,
      markMatches: markMatches2,
      clearMarkedMatches: clearMarkedMatches2
    } = core;
    let state = createInitialState();
    let cascadeDepth = 0;
    function createInitialState() {
      return {
        board: createBoard2(),
        active: null,
        next: createPiece2(),
        started: false,
        score: 0,
        level: 1,
        clears: 0,
        elapsedGameplayMs: 0,
        dropTimer: 0,
        lastTime: 0,
        paused: false,
        gameOver: false,
        resolving: false,
        matchFlash: 0,
        flashMatches: []
      };
    }
    function getState() {
      return state;
    }
    function initialize() {
      state = createInitialState();
      cascadeDepth = 0;
      notifyHudChange();
      notifyPreviewChange();
    }
    function start() {
      state = createInitialState();
      cascadeDepth = 0;
      state.started = true;
      spawnPiece();
      notifyHudChange();
    }
    function move(direction) {
      if (!canControlPiece() || !state.active) {
        return false;
      }
      const nextCol = state.active.col + direction;
      if (!isValidPosition2(state.board, nextCol, state.active.row, state.active.gems)) {
        return false;
      }
      state.active.col = nextCol;
      return true;
    }
    function rotate() {
      if (!canControlPiece() || !state.active) {
        return false;
      }
      state.active.gems = rotateGems2(state.active.gems);
      return true;
    }
    function softDrop() {
      if (!canControlPiece() || !state.active) {
        return false;
      }
      const nextRow = state.active.row + 1;
      if (isValidPosition2(state.board, state.active.col, nextRow, state.active.gems)) {
        state.active.row = nextRow;
        return true;
      }
      lockActivePiece();
      return false;
    }
    function hardDrop() {
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
    function togglePause2() {
      if (state.gameOver || !state.started) {
        return null;
      }
      state.paused = !state.paused;
      return state.paused;
    }
    function tick(timestamp) {
      if (!state.lastTime) {
        state.lastTime = timestamp;
      }
      const delta = timestamp - state.lastTime;
      state.lastTime = timestamp;
      if (!isRunActive()) {
        return;
      }
      advanceLevelProgress(delta);
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
    function awardSoftDrop() {
      state.score += gameConfig.scoring.softDropPerCell;
      notifyHudChange();
    }
    function endGame() {
      state.gameOver = true;
      state.active = null;
      cascadeDepth = 0;
      onGameOver == null ? void 0 : onGameOver(state);
    }
    function spawnPiece() {
      var _a4;
      state.active = clonePiece2((_a4 = state.next) != null ? _a4 : createPiece2());
      state.active.col = Math.floor(core.DEFAULT_COLS * boardConfig.spawnColRatio);
      state.active.row = boardConfig.spawnRow;
      state.next = createPiece2();
      notifyPreviewChange();
      if (!isValidPosition2(state.board, state.active.col, state.active.row, state.active.gems)) {
        endGame();
      }
    }
    function lockActivePiece() {
      if (!state.active) {
        return;
      }
      lockPiece2(state.board, state.active);
      state.active = null;
      onPlace == null ? void 0 : onPlace();
      beginResolution();
    }
    function beginResolution() {
      cascadeDepth = 0;
      const matches = findMatches2(state.board);
      if (matches.length === 0) {
        spawnPiece();
        return;
      }
      state.resolving = true;
      state.flashMatches = matches;
      state.matchFlash = gameConfig.timing.matchFlashMs;
      markMatches2(state.board, matches);
      onMatch == null ? void 0 : onMatch({ matchedCount: matches.length, cascadeDepth });
    }
    function clearMatches() {
      const { removed } = clearMarkedMatches2(state.board, state.flashMatches);
      state.flashMatches = [];
      if (removed > 0) {
        state.clears += removed;
        state.score += getMatchScore(removed, cascadeDepth);
        notifyHudChange();
      }
      const cascaded = findMatches2(state.board);
      if (cascaded.length > 0) {
        cascadeDepth += 1;
        state.flashMatches = cascaded;
        state.matchFlash = gameConfig.timing.matchFlashMs;
        markMatches2(state.board, cascaded);
        onMatch == null ? void 0 : onMatch({ matchedCount: cascaded.length, cascadeDepth });
        return;
      }
      state.resolving = false;
      cascadeDepth = 0;
      spawnPiece();
    }
    function getDropInterval() {
      return Math.max(
        gameConfig.timing.minDropIntervalMs,
        gameConfig.timing.dropIntervalStartMs - (state.level - 1) * gameConfig.timing.dropIntervalLevelStepMs
      );
    }
    function getMatchScore(removed, activeCascadeDepth) {
      const basePoints = removed * gameConfig.scoring.clearedGemPoints;
      const bonusPoints = Math.max(0, removed - 3) * gameConfig.scoring.bonusGemPoints;
      const cascadePoints = removed * activeCascadeDepth * gameConfig.scoring.cascadeBonusPoints;
      return basePoints + bonusPoints + cascadePoints;
    }
    function canControlPiece() {
      return Boolean(state.active) && isRunActive() && !state.resolving;
    }
    function isRunActive() {
      return state.started && !state.paused && !state.gameOver;
    }
    function notifyHudChange() {
      onHudChange == null ? void 0 : onHudChange(state);
    }
    function advanceLevelProgress(delta) {
      if (delta <= 0) {
        return;
      }
      const previousLevel = state.level;
      state.elapsedGameplayMs += delta;
      state.level = 1 + Math.floor(state.elapsedGameplayMs / gameConfig.progression.levelDurationMs);
      if (state.level > previousLevel) {
        notifyHudChange();
        onLevelUp == null ? void 0 : onLevelUp();
      }
    }
    function notifyPreviewChange() {
      onPreviewChange == null ? void 0 : onPreviewChange(state.next);
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
      togglePause: togglePause2
    };
  }

  // input/input.ts
  var GAMEPAD_REPEAT_START_MS = 180;
  var GAMEPAD_REPEAT_INTERVAL_MS = 90;
  var GAMEPAD_AXIS_THRESHOLD = 0.55;
  function bindGameInput(options) {
    const {
      onHardDrop,
      onMoveLeft,
      onMoveRight,
      onPause,
      onRestart,
      onRotate,
      onSoftDrop,
      onStart,
      shouldIgnoreTarget,
      target = document
    } = options;
    const repeatStates = {
      moveLeft: { active: false, nextTriggerAt: 0 },
      moveRight: { active: false, nextTriggerAt: 0 },
      softDrop: { active: false, nextTriggerAt: 0 }
    };
    const previousButtons = {
      hardDrop: false,
      pause: false,
      restart: false,
      rotate: false,
      start: false
    };
    let animationFrameId = 0;
    function handleKeydown(event) {
      if (shouldIgnoreTarget == null ? void 0 : shouldIgnoreTarget(event.target)) {
        return;
      }
      if (onStart && (event.code === "Enter" || event.code === "Space")) {
        const handledStart = onStart();
        if (handledStart) {
          event.preventDefault();
          return;
        }
      }
      switch (event.code) {
        case "ArrowLeft":
          event.preventDefault();
          onMoveLeft == null ? void 0 : onMoveLeft();
          break;
        case "ArrowRight":
          event.preventDefault();
          onMoveRight == null ? void 0 : onMoveRight();
          break;
        case "ArrowUp":
          event.preventDefault();
          onRotate == null ? void 0 : onRotate();
          break;
        case "ArrowDown":
          event.preventDefault();
          onSoftDrop == null ? void 0 : onSoftDrop();
          break;
        case "Space":
          event.preventDefault();
          onHardDrop == null ? void 0 : onHardDrop();
          break;
        case "KeyP":
          onPause == null ? void 0 : onPause();
          break;
        case "KeyR":
          onRestart == null ? void 0 : onRestart();
          break;
        default:
          break;
      }
    }
    target.addEventListener("keydown", handleKeydown);
    function updateRepeatState(now, pressed, state, action) {
      if (!pressed) {
        state.active = false;
        state.nextTriggerAt = 0;
        return;
      }
      if (!state.active) {
        state.active = true;
        state.nextTriggerAt = now + GAMEPAD_REPEAT_START_MS;
        action == null ? void 0 : action();
        return;
      }
      if (now < state.nextTriggerAt) {
        return;
      }
      state.nextTriggerAt = now + GAMEPAD_REPEAT_INTERVAL_MS;
      action == null ? void 0 : action();
    }
    function fireOnRisingEdge(pressed, previous, action) {
      if (pressed && !previous) {
        return Boolean(action == null ? void 0 : action());
      }
      return false;
    }
    function isGamepadButtonPressed(gamepad, buttonIndex) {
      var _a4;
      return Boolean((_a4 = gamepad.buttons[buttonIndex]) == null ? void 0 : _a4.pressed);
    }
    function getActiveGamepad() {
      var _a4;
      if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
        return null;
      }
      return (_a4 = [...navigator.getGamepads()].find((gamepad) => Boolean(gamepad))) != null ? _a4 : null;
    }
    function pollGamepad(timestamp) {
      var _a4, _b, _c, _d;
      const activeTarget = typeof document !== "undefined" ? document.activeElement : null;
      if (shouldIgnoreTarget == null ? void 0 : shouldIgnoreTarget(activeTarget)) {
        animationFrameId = requestAnimationFrame(pollGamepad);
        return;
      }
      const gamepad = getActiveGamepad();
      if (gamepad) {
        const leftPressed = isGamepadButtonPressed(gamepad, 14) || ((_a4 = gamepad.axes[0]) != null ? _a4 : 0) <= -GAMEPAD_AXIS_THRESHOLD;
        const rightPressed = isGamepadButtonPressed(gamepad, 15) || ((_b = gamepad.axes[0]) != null ? _b : 0) >= GAMEPAD_AXIS_THRESHOLD;
        const downPressed = isGamepadButtonPressed(gamepad, 13) || ((_c = gamepad.axes[1]) != null ? _c : 0) >= GAMEPAD_AXIS_THRESHOLD;
        const rotatePressed = isGamepadButtonPressed(gamepad, 0) || isGamepadButtonPressed(gamepad, 12) || ((_d = gamepad.axes[1]) != null ? _d : 0) <= -GAMEPAD_AXIS_THRESHOLD;
        const hardDropPressed = isGamepadButtonPressed(gamepad, 1) || isGamepadButtonPressed(gamepad, 3);
        const pausePressed = isGamepadButtonPressed(gamepad, 9);
        const restartPressed = isGamepadButtonPressed(gamepad, 8);
        const startPressed = isGamepadButtonPressed(gamepad, 9) || isGamepadButtonPressed(gamepad, 0);
        updateRepeatState(timestamp, leftPressed, repeatStates.moveLeft, onMoveLeft);
        updateRepeatState(timestamp, rightPressed, repeatStates.moveRight, onMoveRight);
        updateRepeatState(timestamp, downPressed, repeatStates.softDrop, onSoftDrop);
        fireOnRisingEdge(rotatePressed, previousButtons.rotate, onRotate);
        fireOnRisingEdge(hardDropPressed, previousButtons.hardDrop, onHardDrop);
        fireOnRisingEdge(pausePressed, previousButtons.pause, onPause);
        fireOnRisingEdge(restartPressed, previousButtons.restart, onRestart);
        fireOnRisingEdge(startPressed, previousButtons.start, onStart);
        previousButtons.rotate = rotatePressed;
        previousButtons.hardDrop = hardDropPressed;
        previousButtons.pause = pausePressed;
        previousButtons.restart = restartPressed;
        previousButtons.start = startPressed;
      } else {
        updateRepeatState(timestamp, false, repeatStates.moveLeft);
        updateRepeatState(timestamp, false, repeatStates.moveRight);
        updateRepeatState(timestamp, false, repeatStates.softDrop);
        previousButtons.rotate = false;
        previousButtons.hardDrop = false;
        previousButtons.pause = false;
        previousButtons.restart = false;
        previousButtons.start = false;
      }
      animationFrameId = requestAnimationFrame(pollGamepad);
    }
    if (typeof requestAnimationFrame === "function") {
      animationFrameId = requestAnimationFrame(pollGamepad);
    }
    return () => {
      target.removeEventListener("keydown", handleKeydown);
      if (animationFrameId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }

  // constants.ts
  var BOARD = {
    cols: 6,
    rows: 13,
    spawnRow: -2,
    spawnColRatio: 0.5,
    magicColor: "#fff07a",
    magicWeight: 0.35,
    colors: ["#ff5d8f", "#55f7ff", "#ffd166", "#7bff87", "#a883ff", "#ff8c42", "#fff07a"]
  };
  var GAME = {
    scoring: {
      hardDropPerCell: 2,
      softDropPerCell: 1,
      clearedGemPoints: 25,
      bonusGemPoints: 15,
      cascadeBonusPoints: 20
    },
    timing: {
      matchFlashMs: 260,
      minDropIntervalMs: 160,
      dropIntervalStartMs: 820,
      dropIntervalLevelStepMs: 65,
      gameOverFillDurationMs: 1e3,
      highScoreSaveDelayMs: 300
    },
    progression: {
      levelDurationMs: 6e4
    },
    highScores: {
      storageKey: "columns-gameboy-high-scores",
      maxEntries: 5
    },
    text: {
      startTitle: "GEM COLUMNS",
      startBody: "Line up falling gems in rows, columns, and diagonals of three or more. Diamond wildcard gems match with any color.",
      startHint: "Press Enter or Space to begin",
      nameEntryTitle: "NEW HIGH SCORE",
      nameEntryBody: "Enter your name",
      nameEntryButton: "Save Score",
      savingHighScoreTitle: "SAVING SCORE",
      savingHighScoreBody: "Updating records...",
      gameOverTitle: "GAME OVER",
      gameOverSubtitle: "Top Scores",
      gameOverHint: "Press R to play again",
      highScoreName: "AAA",
      highScoreEmpty: "---",
      paused: "PAUSED\n\nPress P to resume"
    }
  };
  var AUDIO = {
    place: {
      type: "triangle",
      startFrequency: 520,
      endFrequency: 240,
      rampTime: 0.08,
      stopAfter: 0.13,
      filter: { type: "lowpass", frequency: 1400, q: 2 },
      gain: [
        [0, 1e-4],
        [0.01, 0.08],
        [0.12, 1e-4]
      ]
    },
    match: {
      type: "sine",
      frequencies: [
        [0, 680],
        [0.06, 980],
        [0.14, 1320]
      ],
      stopAfter: 0.17,
      filter: { type: "bandpass", frequency: 1200, q: 3 },
      gain: [
        [0, 1e-4],
        [0.01, 0.06],
        [0.09, 0.02],
        [0.16, 1e-4]
      ]
    },
    bonusMatch: {
      type: "triangle",
      frequencies: [
        [0, 763.29],
        [0.05, 1099.99],
        [0.11, 1481.98]
      ],
      stopAfter: 0.2,
      filter: { type: "bandpass", frequency: 1500, q: 4 },
      gain: [
        [0, 1e-4],
        [0.01, 0.075],
        [0.08, 0.04],
        [0.19, 1e-4]
      ]
    },
    rotate: {
      type: "square",
      frequencies: [
        [0, 760],
        [0.035, 1040]
      ],
      stopAfter: 0.07,
      gain: [
        [0, 1e-4],
        [8e-3, 0.035],
        [0.06, 1e-4]
      ]
    },
    levelUp: {
      masterGain: [
        [0, 1e-4],
        [0.02, 0.07],
        [0.42, 1e-4]
      ],
      notes: [
        { frequency: 660, start: 0, duration: 0.1, type: "triangle", frequencyMultiplier: 1.06 },
        { frequency: 880, start: 0.08, duration: 0.1, type: "triangle", frequencyMultiplier: 1.06 },
        { frequency: 1320, start: 0.16, duration: 0.18, type: "sine", frequencyMultiplier: 1.06 }
      ],
      noteAttack: 0.015,
      notePeakGain: 0.9,
      noteStopPadding: 0.02
    },
    gameOver: {
      masterGain: [
        [0, 1e-4],
        [0.03, 0.055],
        [1.08, 0.055],
        [1.18, 1e-4]
      ],
      notes: [
        { frequency: 523.25, start: 0, duration: 0.24, type: "triangle", frequencyMultiplier: 0.97 },
        { frequency: 392, start: 0.22, duration: 0.24, type: "triangle", frequencyMultiplier: 0.965 },
        { frequency: 329.63, start: 0.48, duration: 0.22, type: "sine", frequencyMultiplier: 0.96 },
        { frequency: 261.63, start: 0.74, duration: 0.3, type: "sine", frequencyMultiplier: 0.955 }
      ],
      noteAttack: 0.02,
      notePeakGain: 0.75,
      noteStopPadding: 0.03
    },
    music: {
      bpm: 116,
      beatsPerBar: 8,
      lookaheadMs: 80,
      masterGain: 0.028,
      melodyGain: 0.75,
      bassGain: 0.5,
      melodyType: "triangle",
      bassType: "sine",
      sectionOrder: ["A", "B", "C"],
      sections: {
        A: {
          melody: [
            { beat: 0, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 0.5, frequency: 739.99, durationBeats: 0.5 },
            // F#5
            { beat: 1, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 1.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 2, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 2.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 3, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 3.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 4, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 4.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 5.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 6, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 6.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 7, frequency: 830.61, durationBeats: 0.5 },
            // G#5
            { beat: 7.5, frequency: 880, durationBeats: 0.5 }
            // A5
          ],
          bass: [
            { beat: 0, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 1, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 2, frequency: 130.81, durationBeats: 1 },
            // C3
            { beat: 3, frequency: 123.47, durationBeats: 1 },
            // B2
            { beat: 4, frequency: 110, durationBeats: 1 },
            // A2
            { beat: 5, frequency: 123.47, durationBeats: 1 },
            // B2
            { beat: 6, frequency: 130.81, durationBeats: 1 },
            // C3
            { beat: 7, frequency: 146.83, durationBeats: 1 }
            // D3
          ]
        },
        B: {
          melody: [
            { beat: 0, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 0.5, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 1, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 1.5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 2, frequency: 880, durationBeats: 1 },
            // A5
            { beat: 3, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 3.5, frequency: 739.99, durationBeats: 0.5 },
            // F#5
            { beat: 4, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 4.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 5.5, frequency: 1046.5, durationBeats: 0.5 },
            // C6
            { beat: 6, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 6.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 7, frequency: 830.61, durationBeats: 0.5 },
            // G#5
            { beat: 7.5, frequency: 880, durationBeats: 0.5 }
            // A5
          ],
          bass: [
            { beat: 0, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 1, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 2, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 3, frequency: 185, durationBeats: 1 },
            // F#3
            { beat: 4, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 5, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 6, frequency: 123.47, durationBeats: 1 },
            // B2
            { beat: 7, frequency: 110, durationBeats: 1 }
            // A2
          ]
        },
        C: {
          melody: [
            { beat: 0, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 0.5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 1, frequency: 1046.5, durationBeats: 0.5 },
            // C6
            { beat: 1.5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 2, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 2.5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 3, frequency: 698.46, durationBeats: 1 },
            // F5
            { beat: 4, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 4.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 5.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 6, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 6.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 7, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 7.5, frequency: 587.33, durationBeats: 0.5 }
            // D5
          ],
          bass: [
            { beat: 0, frequency: 220, durationBeats: 1 },
            // A3
            { beat: 1, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 2, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 3, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 4, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 5, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 6, frequency: 185, durationBeats: 1 },
            // F#3
            { beat: 7, frequency: 196, durationBeats: 1 }
            // G3
          ]
        }
      }
    },
    alternateMusic: {
      bpm: 116,
      beatsPerBar: 8,
      lookaheadMs: 80,
      masterGain: 0.028,
      melodyGain: 0.72,
      bassGain: 0.52,
      melodyType: "triangle",
      bassType: "sine",
      sectionOrder: ["A", "B", "C"],
      sections: {
        A: {
          melody: [
            { beat: 0, frequency: 523.25, durationBeats: 0.5 },
            // C5
            { beat: 0.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 1, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 1.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 2, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 2.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 3, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 3.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 4, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 4.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 5, frequency: 523.25, durationBeats: 0.5 },
            // C5
            { beat: 5.5, frequency: 493.88, durationBeats: 0.5 },
            // B4
            { beat: 6, frequency: 523.25, durationBeats: 0.5 },
            // C5
            { beat: 6.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 7, frequency: 493.88, durationBeats: 0.5 },
            // B4
            { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }
            // C5
          ],
          bass: [
            { beat: 0, frequency: 130.81, durationBeats: 1 },
            // C3
            { beat: 1, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 2, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 3, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 4, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 5, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 6, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 7, frequency: 130.81, durationBeats: 1 }
            // C3
          ]
        },
        B: {
          melody: [
            { beat: 0, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 0.5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 1, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 1.5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 2, frequency: 1046.5, durationBeats: 0.5 },
            // C6
            { beat: 2.5, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 3, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 3.5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 4, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 4.5, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 5.5, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 6, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 6.5, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 7, frequency: 493.88, durationBeats: 0.5 },
            // B4
            { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }
            // C5
          ],
          bass: [
            { beat: 0, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 1, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 2, frequency: 220, durationBeats: 1 },
            // A3
            { beat: 3, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 4, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 5, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 6, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 7, frequency: 130.81, durationBeats: 1 }
            // C3
          ]
        },
        C: {
          melody: [
            { beat: 0, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 0.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 1, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 1.5, frequency: 1046.5, durationBeats: 0.5 },
            // C6
            { beat: 2, frequency: 987.77, durationBeats: 0.5 },
            // B5
            { beat: 2.5, frequency: 880, durationBeats: 0.5 },
            // A5
            { beat: 3, frequency: 783.99, durationBeats: 0.5 },
            // G5
            { beat: 3.5, frequency: 698.46, durationBeats: 0.5 },
            // F5
            { beat: 4, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 4.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 5, frequency: 523.25, durationBeats: 0.5 },
            // C5
            { beat: 5.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 6, frequency: 659.25, durationBeats: 0.5 },
            // E5
            { beat: 6.5, frequency: 587.33, durationBeats: 0.5 },
            // D5
            { beat: 7, frequency: 493.88, durationBeats: 0.5 },
            // B4
            { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }
            // C5
          ],
          bass: [
            { beat: 0, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 1, frequency: 220, durationBeats: 1 },
            // A3
            { beat: 2, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 3, frequency: 174.61, durationBeats: 1 },
            // F3
            { beat: 4, frequency: 164.81, durationBeats: 1 },
            // E3
            { beat: 5, frequency: 146.83, durationBeats: 1 },
            // D3
            { beat: 6, frequency: 196, durationBeats: 1 },
            // G3
            { beat: 7, frequency: 130.81, durationBeats: 1 }
            // C3
          ]
        }
      }
    }
  };

  // audio/audio.ts
  var AUDIO2 = AUDIO;
  var AudioContextCtor = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext || null : null;
  var audioContext = null;
  var musicState = null;
  var musicMuted = true;
  var nextMusicTrackIndex = 0;
  function ensureAudioContext() {
    if (!AudioContextCtor) {
      return null;
    }
    if (!audioContext) {
      audioContext = new AudioContextCtor();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
      });
    }
    return audioContext;
  }
  function playPlaceSound() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    const config = AUDIO2.place;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, now + config.rampTime);
    filter.type = config.filter.type;
    filter.frequency.setValueAtTime(config.filter.frequency, now);
    filter.Q.value = config.filter.q;
    applyGainEnvelope(gainNode.gain, now, config.gain);
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + config.stopAfter);
  }
  function playMatchSound() {
    playFilteredEnvelopeSound(AUDIO2.match);
  }
  function playBonusMatchSound() {
    playFilteredEnvelopeSound(AUDIO2.bonusMatch);
  }
  function playCascadeMatchSound(pitchMultiplier = 1.22) {
    playFilteredEnvelopeSound(AUDIO2.match, pitchMultiplier);
  }
  function playFilteredEnvelopeSound(config, pitchMultiplier = 1) {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = config.type;
    applyFrequencyEnvelope(oscillator.frequency, now, config.frequencies, pitchMultiplier);
    filter.type = config.filter.type;
    filter.frequency.setValueAtTime(config.filter.frequency, now);
    filter.Q.value = config.filter.q;
    applyGainEnvelope(gainNode.gain, now, config.gain);
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + config.stopAfter);
  }
  function playRotateSound() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    const config = AUDIO2.rotate;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = config.type;
    applyFrequencyEnvelope(oscillator.frequency, now, config.frequencies);
    applyGainEnvelope(gainNode.gain, now, config.gain);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + config.stopAfter);
  }
  function playLevelUpSound() {
    playNoteSequence(AUDIO2.levelUp);
  }
  function playGameOverSound() {
    playNoteSequence(AUDIO2.gameOver);
  }
  function playNoteSequence(config) {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    const now = context.currentTime;
    const masterGain = context.createGain();
    applyGainEnvelope(masterGain.gain, now, config.masterGain);
    masterGain.connect(context.destination);
    config.notes.forEach(({ frequency, start, duration, type, frequencyMultiplier }) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const noteStart = now + start;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * frequencyMultiplier,
        noteStart + duration
      );
      noteGain.gain.setValueAtTime(1e-4, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(config.notePeakGain, noteStart + config.noteAttack);
      noteGain.gain.exponentialRampToValueAtTime(1e-4, noteStart + duration);
      oscillator.connect(noteGain);
      noteGain.connect(masterGain);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration + config.noteStopPadding);
    });
  }
  function startGameplayMusic() {
    const context = ensureAudioContext();
    if (!context) {
      return;
    }
    if (!musicState) {
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(1e-4, context.currentTime);
      gainNode.connect(context.destination);
      musicState = {
        gainNode,
        timeoutId: null,
        playing: false,
        sectionIndex: 0,
        track: null
      };
    }
    if (musicState.playing) {
      return;
    }
    musicState.playing = true;
    if (!musicState.track) {
      musicState.track = getNextMusicTrack();
    }
    musicState.sectionIndex = 0;
    const now = context.currentTime;
    musicState.gainNode.gain.cancelScheduledValues(now);
    musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 1e-4), now);
    musicState.gainNode.gain.exponentialRampToValueAtTime(getMusicTargetGain(), now + 0.12);
    scheduleMusicSection(now + 0.02);
  }
  function pauseGameplayMusic() {
    var _a4;
    if (!(musicState == null ? void 0 : musicState.playing) || !audioContext) {
      return;
    }
    musicState.playing = false;
    clearTimeout((_a4 = musicState.timeoutId) != null ? _a4 : void 0);
    musicState.timeoutId = null;
    const now = audioContext.currentTime;
    musicState.gainNode.gain.cancelScheduledValues(now);
    musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 1e-4), now);
    musicState.gainNode.gain.exponentialRampToValueAtTime(1e-4, now + 0.08);
  }
  function stopGameplayMusic() {
    pauseGameplayMusic();
    if (musicState) {
      musicState.track = null;
      musicState.sectionIndex = 0;
    }
  }
  function toggleMusicMuted() {
    const context = ensureAudioContext();
    musicMuted = !musicMuted;
    if (musicState && context) {
      const now = context.currentTime;
      musicState.gainNode.gain.cancelScheduledValues(now);
      musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 1e-4), now);
      musicState.gainNode.gain.exponentialRampToValueAtTime(getMusicTargetGain(), now + 0.08);
    }
    return musicMuted;
  }
  function isMusicMuted() {
    return musicMuted;
  }
  function scheduleMusicSection(startTime) {
    if (!(musicState == null ? void 0 : musicState.playing) || !audioContext || !musicState.track) {
      return;
    }
    const track = musicState.track;
    const sectionName = track.sectionOrder[musicState.sectionIndex];
    const section = track.sections[sectionName];
    const secondsPerBeat = 60 / track.bpm;
    scheduleTrackNotes(
      section.melody,
      track.melodyType,
      track.melodyGain,
      startTime,
      secondsPerBeat
    );
    scheduleTrackNotes(
      section.bass,
      track.bassType,
      track.bassGain,
      startTime,
      secondsPerBeat
    );
    const barDurationMs = secondsPerBeat * track.beatsPerBar * 1e3;
    musicState.sectionIndex = (musicState.sectionIndex + 1) % track.sectionOrder.length;
    musicState.timeoutId = setTimeout(() => {
      if (!audioContext) {
        return;
      }
      scheduleMusicSection(audioContext.currentTime + track.lookaheadMs / 1e3);
    }, Math.max(0, barDurationMs - track.lookaheadMs));
  }
  function getNextMusicTrack() {
    var _a4;
    const tracks = [AUDIO2.music, AUDIO2.alternateMusic];
    const track = (_a4 = tracks[nextMusicTrackIndex % tracks.length]) != null ? _a4 : AUDIO2.music;
    nextMusicTrackIndex = (nextMusicTrackIndex + 1) % tracks.length;
    return track;
  }
  function scheduleTrackNotes(notes, type, peakGain, startTime, secondsPerBeat) {
    if (!audioContext || !musicState) {
      return;
    }
    const context = audioContext;
    const activeMusicState = musicState;
    notes.forEach(({ beat, frequency, durationBeats }) => {
      const noteStart = startTime + beat * secondsPerBeat;
      const noteDuration = durationBeats * secondsPerBeat;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gainNode.gain.setValueAtTime(1e-4, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(1e-4, noteStart + noteDuration);
      oscillator.connect(gainNode);
      gainNode.connect(activeMusicState.gainNode);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteDuration + 0.02);
    });
  }
  function applyFrequencyEnvelope(audioParam, startTime, values, pitchMultiplier = 1) {
    values.forEach(([offset, value], index) => {
      if (index === 0) {
        audioParam.setValueAtTime(value * pitchMultiplier, startTime + offset);
      } else {
        audioParam.exponentialRampToValueAtTime(value * pitchMultiplier, startTime + offset);
      }
    });
  }
  function applyGainEnvelope(audioParam, startTime, values) {
    values.forEach(([offset, value], index) => {
      if (index === 0) {
        audioParam.setValueAtTime(value, startTime + offset);
      } else {
        audioParam.exponentialRampToValueAtTime(value, startTime + offset);
      }
    });
  }
  function getMusicTargetGain() {
    return musicMuted ? 1e-4 : AUDIO2.music.masterGain;
  }

  // columns-core.ts
  var columns_core_exports = {};
  __export(columns_core_exports, {
    DEFAULT_COLORS: () => DEFAULT_COLORS,
    DEFAULT_COLS: () => DEFAULT_COLS,
    DEFAULT_ROWS: () => DEFAULT_ROWS,
    MAGIC_COLOR: () => MAGIC_COLOR,
    MAGIC_WEIGHT: () => MAGIC_WEIGHT,
    clearMarkedMatches: () => clearMarkedMatches,
    clonePiece: () => clonePiece,
    collapseBoard: () => collapseBoard,
    createBoard: () => createBoard,
    createCell: () => createCell,
    createPiece: () => createPiece,
    findMatches: () => findMatches,
    isValidPosition: () => isValidPosition,
    lockPiece: () => lockPiece,
    markMatches: () => markMatches,
    randomColor: () => randomColor,
    rotateGems: () => rotateGems
  });
  var DEFAULT_COLS = BOARD.cols;
  var DEFAULT_ROWS = BOARD.rows;
  var DEFAULT_COLORS = [...BOARD.colors];
  var MAGIC_COLOR = BOARD.magicColor;
  var _a;
  var MAGIC_WEIGHT = (_a = BOARD.magicWeight) != null ? _a : 1;
  function createCell(color) {
    return { color, clearing: false };
  }
  function createBoard(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }
  function randomColor(colors = DEFAULT_COLORS, random = Math.random) {
    var _a4, _b;
    const weightedColors = colors.map((color) => ({
      color,
      weight: color === MAGIC_COLOR ? MAGIC_WEIGHT : 1
    }));
    const totalWeight = weightedColors.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * totalWeight;
    for (const entry of weightedColors) {
      target -= entry.weight;
      if (target <= 0) {
        return entry.color;
      }
    }
    return (_b = (_a4 = weightedColors[weightedColors.length - 1]) == null ? void 0 : _a4.color) != null ? _b : colors[0];
  }
  function createPiece(options = {}) {
    const {
      cols = DEFAULT_COLS,
      colors = DEFAULT_COLORS,
      random = Math.random,
      col = Math.floor(cols / 2),
      row = BOARD.spawnRow
    } = options;
    return {
      col,
      row,
      gems: [randomColor(colors, random), randomColor(colors, random), randomColor(colors, random)]
    };
  }
  function clonePiece(piece) {
    return {
      col: piece.col,
      row: piece.row,
      gems: [...piece.gems]
    };
  }
  function rotateGems(gems) {
    const [top, middle, bottom] = gems;
    return [middle, bottom, top];
  }
  function isValidPosition(board, col, row, gems) {
    var _a4, _b;
    const rows = board.length;
    const cols = (_b = (_a4 = board[0]) == null ? void 0 : _a4.length) != null ? _b : 0;
    for (let i = 0; i < gems.length; i += 1) {
      const boardRow = row + i;
      if (col < 0 || col >= cols || boardRow >= rows) {
        return false;
      }
      if (boardRow >= 0 && board[boardRow][col]) {
        return false;
      }
    }
    return true;
  }
  function lockPiece(board, piece) {
    piece.gems.forEach((color, index) => {
      const row = piece.row + index;
      if (row >= 0) {
        board[row][piece.col] = createCell(color);
      }
    });
    return board;
  }
  function findMatches(board) {
    var _a4, _b;
    const rows = board.length;
    const cols = (_b = (_a4 = board[0]) == null ? void 0 : _a4.length) != null ? _b : 0;
    const found = /* @__PURE__ */ new Set();
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ];
    const candidateColors = /* @__PURE__ */ new Set();
    board.forEach((boardRow) => {
      boardRow.forEach((cell) => {
        if (cell == null ? void 0 : cell.color) {
          candidateColors.add(cell.color);
        }
      });
    });
    candidateColors.forEach((candidateColor) => {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          directions.forEach(([dr, dc]) => {
            var _a5, _b2, _c;
            const previousRow = row - dr;
            const previousCol = col - dc;
            if (isCompatibleColor((_b2 = (_a5 = board[previousRow]) == null ? void 0 : _a5[previousCol]) == null ? void 0 : _b2.color, candidateColor)) {
              return;
            }
            const run = [];
            let nextRow = row;
            let nextCol = col;
            while (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols && isCompatibleColor((_c = board[nextRow][nextCol]) == null ? void 0 : _c.color, candidateColor)) {
              run.push([nextRow, nextCol]);
              nextRow += dr;
              nextCol += dc;
            }
            if (run.length >= 3) {
              run.forEach(([matchRow, matchCol]) => found.add(`${matchRow},${matchCol}`));
            }
          });
        }
      }
    });
    return [...found].map((key) => key.split(",").map(Number));
  }
  function isCompatibleColor(cellColor, candidateColor) {
    return Boolean(cellColor) && (cellColor === candidateColor || cellColor === MAGIC_COLOR);
  }
  function markMatches(board, matches) {
    matches.forEach(([row, col]) => {
      if (board[row][col]) {
        board[row][col].clearing = true;
      }
    });
    return board;
  }
  function collapseBoard(board) {
    var _a4, _b, _c;
    const rows = board.length;
    const cols = (_b = (_a4 = board[0]) == null ? void 0 : _a4.length) != null ? _b : 0;
    for (let col = 0; col < cols; col += 1) {
      const compacted = [];
      for (let row = rows - 1; row >= 0; row -= 1) {
        const cell = board[row][col];
        if (cell) {
          cell.clearing = false;
          compacted.push(cell);
        }
      }
      for (let row = rows - 1; row >= 0; row -= 1) {
        board[row][col] = (_c = compacted[rows - 1 - row]) != null ? _c : null;
      }
    }
    return board;
  }
  function clearMarkedMatches(board, matches) {
    let removed = 0;
    matches.forEach(([row, col]) => {
      if (board[row][col]) {
        board[row][col] = null;
        removed += 1;
      }
    });
    collapseBoard(board);
    return { board, removed };
  }

  // dom.ts
  function getGameElements(root = document) {
    return {
      canvas: getRequiredElement(root, "game"),
      scoreEl: getRequiredElement(root, "score"),
      levelEl: getRequiredElement(root, "level"),
      clearsEl: getRequiredElement(root, "clears"),
      nextPieceEl: getRequiredElement(root, "next-piece"),
      musicToggleEl: root.getElementById("music-toggle"),
      overlayEl: getRequiredElement(root, "overlay")
    };
  }
  function getRequiredElement(root, id) {
    const element = root.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element: #${id}`);
    }
    return element;
  }

  // graphics/gameboyGraphics.ts
  var PALETTE = {
    darkest: "#1f2f1f",
    dark: "#3f5f3f",
    midDark: "#56703d",
    light: "#7b8f3a",
    midLight: "#93aa4a",
    lightest: "#cfd79a"
  };
  var GEM_VARIANTS = [
    { fill: "#f4f7d6", highlight: "#fefff2", shadow: "#74883f" },
    { fill: "#c4d86a", highlight: "#eef7c2", shadow: "#607631" },
    { fill: "#99b44d", highlight: "#d9e79a", shadow: "#4d6228" },
    { fill: "#6a8434", highlight: "#9eb65b", shadow: "#27361a" },
    { fill: "#445b28", highlight: "#6d863e", shadow: "#172111" },
    { fill: "#24331a", highlight: "#47612d", shadow: "#091008" }
  ];
  var GEM_SHAPES = ["square", "diamond", "circle", "triangle", "hex", "pill"];
  var _a2;
  var BOARD_COLORS = (_a2 = BOARD.colors) != null ? _a2 : [];
  var _a3;
  var MAGIC_GEM_COLOR = (_a3 = BOARD.magicColor) != null ? _a3 : BOARD_COLORS[BOARD_COLORS.length - 1];
  var GEM_SHADE_MAP = new Map(
    BOARD_COLORS.map((color, index) => [color, GEM_VARIANTS[index % GEM_VARIANTS.length]])
  );
  var GEM_SHAPE_MAP = new Map(
    BOARD_COLORS.map((color, index) => [color, GEM_SHAPES[index % GEM_SHAPES.length]])
  );
  var CLEARING_SHADES = {
    fill: PALETTE.lightest,
    highlight: PALETTE.light,
    shadow: PALETTE.dark
  };
  function getGemShades(color, clearing) {
    var _a4;
    if (clearing) {
      return CLEARING_SHADES;
    }
    if (color === MAGIC_GEM_COLOR) {
      return {
        fill: PALETTE.lightest,
        highlight: "#f7ffcf",
        shadow: PALETTE.midDark
      };
    }
    return (_a4 = GEM_SHADE_MAP.get(color)) != null ? _a4 : GEM_VARIANTS[0];
  }
  function getGemShape(color) {
    var _a4;
    if (color === MAGIC_GEM_COLOR) {
      return "wildcard";
    }
    return (_a4 = GEM_SHAPE_MAP.get(color)) != null ? _a4 : GEM_SHAPES[0];
  }
  function drawGem(ctx, size, color, clearing = false) {
    const shades = getGemShades(color, clearing);
    const shape = getGemShape(color);
    ctx.save();
    drawGemShape(ctx, size, shape, shades);
    if (clearing) {
      drawClearPattern(ctx, size);
    }
    ctx.restore();
  }
  function drawClearPattern(ctx, size) {
    ctx.fillStyle = PALETTE.darkest;
    for (let offset = 10; offset < size - 10; offset += 8) {
      ctx.fillRect(offset, offset, 3, 3);
      ctx.fillRect(size - offset - 3, offset, 3, 3);
    }
  }
  function drawGemShape(ctx, size, shape, shades) {
    ctx.save();
    traceGemPath(ctx, size, shape);
    ctx.fillStyle = shades.fill;
    ctx.fill();
    ctx.clip();
    if (shape === "wildcard") {
      drawWildcardFacets(ctx, size, shades);
    } else {
      ctx.fillStyle = shades.highlight;
      drawShapeHighlight(ctx, size, shape);
      ctx.fillStyle = shades.shadow;
      drawShapeShadow(ctx, size, shape);
    }
    ctx.restore();
    ctx.save();
    traceGemPath(ctx, size, shape);
    ctx.strokeStyle = PALETTE.darkest;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  function drawWildcardFacets(ctx, size, shades) {
    const left = { x: size * 0.08, y: size * 0.42 };
    const topLeft = { x: size * 0.24, y: size * 0.12 };
    const topMid = { x: size / 2, y: size * 0.12 };
    const topRight = { x: size * 0.76, y: size * 0.12 };
    const right = { x: size * 0.92, y: size * 0.42 };
    const centerLeft = { x: size * 0.38, y: size * 0.42 };
    const centerRight = { x: size * 0.62, y: size * 0.42 };
    const bottom = { x: size / 2, y: size - 5 };
    ctx.fillStyle = shades.highlight;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.lineTo(centerLeft.x, centerLeft.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.lightest;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topMid.x, topMid.y);
    ctx.lineTo(centerLeft.x, centerLeft.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.light;
    ctx.beginPath();
    ctx.moveTo(topMid.x, topMid.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(centerRight.x, centerRight.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shades.fill;
    ctx.beginPath();
    ctx.moveTo(centerRight.x, centerRight.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.midLight;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(centerLeft.x, centerLeft.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shades.shadow;
    ctx.beginPath();
    ctx.moveTo(centerLeft.x, centerLeft.y);
    ctx.lineTo(centerRight.x, centerRight.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.light;
    ctx.beginPath();
    ctx.moveTo(centerRight.x, centerRight.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.closePath();
    ctx.fill();
  }
  function traceGemPath(ctx, size, shape) {
    ctx.beginPath();
    switch (shape) {
      case "wildcard":
        ctx.moveTo(size * 0.08, size * 0.42);
        ctx.lineTo(size * 0.24, size * 0.12);
        ctx.lineTo(size * 0.76, size * 0.12);
        ctx.lineTo(size * 0.92, size * 0.42);
        ctx.lineTo(size / 2, size - 5);
        ctx.closePath();
        break;
      case "diamond":
        ctx.moveTo(size / 2, 5);
        ctx.lineTo(size - 5, size / 2);
        ctx.lineTo(size / 2, size - 5);
        ctx.lineTo(5, size / 2);
        ctx.closePath();
        break;
      case "circle":
        ctx.arc(size / 2, size / 2, size / 2 - 7, 0, Math.PI * 2);
        break;
      case "triangle":
        ctx.moveTo(size / 2, 5);
        ctx.lineTo(size - 6, size - 7);
        ctx.lineTo(6, size - 7);
        ctx.closePath();
        break;
      case "hex":
        ctx.moveTo(size * 0.3, 5);
        ctx.lineTo(size * 0.7, 5);
        ctx.lineTo(size - 5, size / 2);
        ctx.lineTo(size * 0.7, size - 5);
        ctx.lineTo(size * 0.3, size - 5);
        ctx.lineTo(5, size / 2);
        ctx.closePath();
        break;
      case "pill":
        traceRoundedRect(ctx, 5, 10, size - 10, size - 20, 10);
        break;
      case "square":
      default:
        traceRoundedRect(ctx, 6, 6, size - 12, size - 12, 4);
        break;
    }
  }
  function traceRoundedRect(ctx, x, y, width, height, radius) {
    const right = x + width;
    const bottom = y + height;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(right - radius, y);
    ctx.quadraticCurveTo(right, y, right, y + radius);
    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    ctx.lineTo(x + radius, bottom);
    ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  function drawShapeHighlight(ctx, size, shape) {
    switch (shape) {
      case "wildcard":
        ctx.beginPath();
        ctx.moveTo(size * 0.26, size * 0.16);
        ctx.lineTo(size * 0.74, size * 0.16);
        ctx.lineTo(size * 0.62, size * 0.42);
        ctx.lineTo(size * 0.38, size * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.1, size * 0.42);
        ctx.lineTo(size * 0.24, size * 0.14);
        ctx.lineTo(size * 0.38, size * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.62, size * 0.42);
        ctx.lineTo(size * 0.76, size * 0.14);
        ctx.lineTo(size * 0.9, size * 0.42);
        ctx.closePath();
        ctx.fill();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(size / 2, 10);
        ctx.lineTo(size - 12, size / 2 - 2);
        ctx.lineTo(size / 2, size / 2 + 2);
        ctx.lineTo(12, size / 2 - 2);
        ctx.closePath();
        ctx.fill();
        break;
      case "circle":
        ctx.beginPath();
        ctx.ellipse(size * 0.43, size * 0.35, size * 0.18, size * 0.12, -0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(size / 2, 12);
        ctx.lineTo(size - 16, size - 18);
        ctx.lineTo(size / 2, size * 0.55);
        ctx.closePath();
        ctx.fill();
        break;
      case "hex":
        ctx.fillRect(12, 10, size - 24, 7);
        ctx.fillRect(10, 12, 7, size / 2 - 10);
        break;
      case "pill":
        ctx.fillRect(12, 14, size - 24, 8);
        ctx.fillRect(10, 18, 8, size - 36);
        break;
      case "square":
      default:
        ctx.fillRect(8, 8, size - 16, 6);
        ctx.fillRect(8, 8, 6, size - 16);
        break;
    }
  }
  function drawShapeShadow(ctx, size, shape) {
    switch (shape) {
      case "wildcard":
        ctx.beginPath();
        ctx.moveTo(size * 0.38, size * 0.44);
        ctx.lineTo(size * 0.62, size * 0.44);
        ctx.lineTo(size / 2, size - 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.1, size * 0.42);
        ctx.lineTo(size * 0.38, size * 0.44);
        ctx.lineTo(size / 2, size - 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.62, size * 0.44);
        ctx.lineTo(size * 0.9, size * 0.42);
        ctx.lineTo(size / 2, size - 8);
        ctx.closePath();
        ctx.fill();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2 + 4);
        ctx.lineTo(size - 12, size / 2 + 2);
        ctx.lineTo(size / 2, size - 10);
        ctx.lineTo(12, size / 2 + 2);
        ctx.closePath();
        ctx.fill();
        break;
      case "circle":
        ctx.beginPath();
        ctx.ellipse(size * 0.6, size * 0.66, size * 0.22, size * 0.16, -0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(size / 2, size * 0.58);
        ctx.lineTo(size - 12, size - 12);
        ctx.lineTo(12, size - 12);
        ctx.closePath();
        ctx.fill();
        break;
      case "hex":
        ctx.fillRect(size - 17, size / 2 - 4, 7, size / 2 - 8);
        ctx.fillRect(14, size - 17, size - 28, 7);
        break;
      case "pill":
        ctx.fillRect(size - 18, 18, 8, size - 36);
        ctx.fillRect(12, size - 22, size - 24, 8);
        break;
      case "square":
      default:
        ctx.fillRect(size - 14, 8, 6, size - 16);
        ctx.fillRect(8, size - 14, size - 16, 6);
        break;
    }
  }
  function createRenderer(canvas, options) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2D canvas context is required");
    }
    const context = ctx;
    const { cols, rows } = options;
    const cell = canvas.width / cols;
    const spriteCache = /* @__PURE__ */ new Map();
    const boardBackground = createBoardBackgroundBuffer(canvas.width, canvas.height);
    function render(board, activePiece) {
      if (boardBackground) {
        context.drawImage(boardBackground, 0, 0);
      } else {
        drawBoardBackground();
      }
      drawBoardCells(board);
      drawActivePiece(activePiece);
    }
    function drawBoardCells(board) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          drawCell(row, col, board[row][col]);
        }
      }
    }
    function drawBoardBackgroundContent(target) {
      target.fillStyle = PALETTE.lightest;
      target.fillRect(0, 0, canvas.width, canvas.height);
      drawDotMatrix(target);
      drawBorder(target);
      drawGrid(target);
    }
    function drawBoardBackground() {
      context.fillStyle = PALETTE.lightest;
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawDotMatrix(context);
      drawBorder(context);
      drawGrid(context);
    }
    function drawDotMatrix(target) {
      target.save();
      target.fillStyle = "rgba(63, 95, 63, 0.08)";
      for (let y = 4; y < canvas.height; y += 6) {
        for (let x = 4; x < canvas.width; x += 6) {
          target.fillRect(x, y, 1, 1);
        }
      }
      target.restore();
    }
    function drawBorder(target) {
      target.save();
      target.strokeStyle = PALETTE.darkest;
      target.lineWidth = 4;
      target.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      target.strokeStyle = PALETTE.dark;
      target.lineWidth = 2;
      target.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
      target.restore();
    }
    function drawGrid(target) {
      target.save();
      target.strokeStyle = "rgba(63, 95, 63, 0.2)";
      target.lineWidth = 1;
      target.beginPath();
      for (let col = 1; col < cols; col += 1) {
        target.moveTo(col * cell, 0);
        target.lineTo(col * cell, canvas.height);
      }
      for (let row = 1; row < rows; row += 1) {
        target.moveTo(0, row * cell);
        target.lineTo(canvas.width, row * cell);
      }
      target.stroke();
      target.restore();
    }
    function drawCell(row, col, cellData) {
      if (!cellData) {
        return;
      }
      const x = col * cell;
      const y = row * cell;
      const sprite = getGemSprite(cellData.color, cellData.clearing);
      if (sprite) {
        context.drawImage(sprite, x, y);
        return;
      }
      context.save();
      context.translate(x, y);
      drawGem(context, cell, cellData.color, cellData.clearing);
      context.restore();
    }
    function drawActivePiece(activePiece) {
      if (!activePiece) {
        return;
      }
      activePiece.gems.forEach((color, index) => {
        const row = activePiece.row + index;
        if (row < 0) {
          return;
        }
        drawCell(row, activePiece.col, { color, clearing: false });
      });
    }
    function getGemSprite(color, clearing) {
      const cacheKey = `${cell}:${color}:${clearing ? "1" : "0"}`;
      const cachedSprite = spriteCache.get(cacheKey);
      if (cachedSprite) {
        return cachedSprite;
      }
      const spriteCanvas = createCanvasBuffer(cell, cell);
      const spriteContext = spriteCanvas == null ? void 0 : spriteCanvas.getContext("2d");
      if (!spriteCanvas || !spriteContext) {
        return null;
      }
      drawGem(spriteContext, cell, color, clearing);
      spriteCache.set(cacheKey, spriteCanvas);
      return spriteCanvas;
    }
    function createBoardBackgroundBuffer(width, height) {
      const backgroundCanvas = createCanvasBuffer(width, height);
      const backgroundContext = backgroundCanvas == null ? void 0 : backgroundCanvas.getContext("2d");
      if (!backgroundCanvas || !backgroundContext) {
        return null;
      }
      drawBoardBackgroundContent(backgroundContext);
      return backgroundCanvas;
    }
    return { render };
  }
  function drawPreviewGem(canvas, color) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const size = canvas.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sprite = createGemPreviewSprite(size, color);
    if (sprite) {
      ctx.drawImage(sprite, 0, 0);
      return;
    }
    drawGem(ctx, size, color, false);
  }
  function createGemPreviewSprite(size, color) {
    const spriteCanvas = createCanvasBuffer(size, size);
    const spriteContext = spriteCanvas == null ? void 0 : spriteCanvas.getContext("2d");
    if (!spriteCanvas || !spriteContext) {
      return null;
    }
    drawGem(spriteContext, size, color, false);
    return spriteCanvas;
  }
  function createCanvasBuffer(width, height) {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }
    if (typeof document !== "undefined") {
      const buffer = document.createElement("canvas");
      buffer.width = width;
      buffer.height = height;
      return buffer;
    }
    return null;
  }

  // highScores/highScores.ts
  function createHighScoreService(config) {
    const { storageKey, maxEntries, text } = config;
    function save(entry) {
      const highScores2 = load();
      highScores2.push({
        name: normalizeName(entry.name),
        score: entry.score,
        level: entry.level,
        gems: entry.gems
      });
      highScores2.sort((a, b) => b.score - a.score || b.level - a.level || b.gems - a.gems);
      const nextHighScores = highScores2.slice(0, maxEntries);
      persist(nextHighScores);
      return fill(nextHighScores);
    }
    function load() {
      var _a4;
      try {
        const raw = (_a4 = window.localStorage) == null ? void 0 : _a4.getItem(storageKey);
        if (!raw) {
          return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed.map(normalizeStoredEntry).slice(0, maxEntries);
      } catch {
        return [];
      }
    }
    function persist(highScores2) {
      var _a4;
      try {
        (_a4 = window.localStorage) == null ? void 0 : _a4.setItem(storageKey, JSON.stringify(highScores2));
      } catch {
      }
    }
    function fill(highScores2) {
      const filled = highScores2.map((entry) => ({
        name: normalizeName(entry.name),
        score: entry.score,
        level: entry.level,
        gems: entry.gems
      }));
      while (filled.length < maxEntries) {
        filled.push({
          name: text.highScoreEmpty,
          score: text.highScoreEmpty,
          level: text.highScoreEmpty,
          gems: text.highScoreEmpty
        });
      }
      return filled;
    }
    function qualifies(entry, highScores2) {
      if (entry.score <= 0) {
        return false;
      }
      if (highScores2.length < maxEntries) {
        return true;
      }
      const lowestEntry = [...highScores2].sort(
        (a, b) => a.score - b.score || a.level - b.level || a.gems - b.gems
      )[0];
      if (!lowestEntry) {
        return true;
      }
      return entry.score > lowestEntry.score || entry.score === lowestEntry.score && entry.level > lowestEntry.level || entry.score === lowestEntry.score && entry.level === lowestEntry.level && entry.gems > lowestEntry.gems;
    }
    function normalizeName(name) {
      return (name || "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").trim().slice(0, 8) || text.highScoreName;
    }
    function normalizeStoredEntry(entry) {
      return {
        name: normalizeName(typeof entry.name === "string" ? entry.name : void 0),
        score: Number(entry.score) || 0,
        level: Number(entry.level) || 0,
        gems: Number(entry.gems) || 0
      };
    }
    return {
      fill,
      load,
      normalizeName,
      qualifies,
      save
    };
  }

  // hud/hud.ts
  var PREVIEW_GEM_SIZE = 40;
  function createHud(options) {
    const { scoreEl, levelEl, clearsEl, nextPieceEl, musicToggleEl, drawPreviewGem: drawPreviewGem2 } = options;
    function renderStats(state) {
      scoreEl.textContent = String(state.score);
      levelEl.textContent = String(state.level);
      clearsEl.textContent = String(state.clears);
    }
    function renderNextPiece(piece) {
      nextPieceEl.innerHTML = "";
      piece.gems.forEach((color) => {
        const gem = document.createElement("canvas");
        gem.className = "preview-gem d-block";
        gem.width = PREVIEW_GEM_SIZE;
        gem.height = PREVIEW_GEM_SIZE;
        drawPreviewGem2(gem, color);
        nextPieceEl.appendChild(gem);
      });
    }
    function updateMusicToggleLabel(isMuted) {
      if (!musicToggleEl) {
        return;
      }
      musicToggleEl.textContent = isMuted ? "Unmute Music" : "Mute Music";
    }
    return {
      renderNextPiece,
      renderStats,
      updateMusicToggleLabel
    };
  }

  // overlays/overlays.ts
  function createOverlayController(options) {
    const { overlayEl, text } = options;
    function resetOverlayClasses() {
      overlayEl.classList.remove("overlay-fullscreen", "overlay-illustrated", "overlay-start-screen");
    }
    function showText(message, overlayOptions = {}) {
      resetOverlayClasses();
      overlayEl.classList.toggle("overlay-fullscreen", Boolean(overlayOptions.fullscreen));
      overlayEl.innerHTML = `<div class="overlay-copy">${message.replace(/\n/g, "<br />")}</div>`;
      overlayEl.classList.remove("hidden");
    }
    function hide() {
      resetOverlayClasses();
      overlayEl.classList.add("hidden");
    }
    function showStartScreen() {
      resetOverlayClasses();
      overlayEl.classList.add("overlay-illustrated");
      overlayEl.classList.add("overlay-start-screen");
      overlayEl.innerHTML = `
      <div class="overlay-card d-grid">
        <img
          class="start-screen-logo"
          src="assets/start-screen-logo.png"
          alt="${text.startTitle}"
        />
        <div class="overlay-copy">${text.startBody}</div>
        <div class="overlay-copy">${text.startHint}</div>
      </div>
    `;
      overlayEl.classList.remove("hidden");
    }
    function showGameOverScreen(state, highScores2) {
      const rows = highScores2.map(
        (entry, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.level}</td>
            <td>${entry.gems}</td>
          </tr>
        `
      ).join("");
      resetOverlayClasses();
      overlayEl.classList.add("overlay-illustrated");
      overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.gameOverTitle}</div>
        <div class="overlay-copy">Score ${state.score} / Level ${state.level} / Gems ${state.clears}</div>
        <div class="high-scores">
          <div class="overlay-copy high-scores-title">${text.gameOverSubtitle}</div>
          <table class="high-scores-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Lvl</th>
                <th>Gms</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="overlay-copy">${text.gameOverHint}</div>
      </div>
    `;
      overlayEl.classList.remove("hidden");
    }
    function showNameEntryScreen(entry, callbacks) {
      const { defaultName, normalizeName, onSubmit } = callbacks;
      resetOverlayClasses();
      overlayEl.classList.add("overlay-illustrated");
      overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.nameEntryTitle}</div>
        <div class="overlay-copy">Score ${entry.score} / Level ${entry.level} / Gems ${entry.gems}</div>
        <div class="overlay-copy">${text.nameEntryBody}</div>
        <div class="high-score-entry d-grid">
          <input
            id="high-score-name"
            class="high-score-input"
            type="text"
            inputmode="text"
            maxlength="8"
            value="${defaultName}"
            aria-label="${text.nameEntryBody}"
          />
          <button id="save-high-score" class="overlay-button box-shadow" type="button">
            ${text.nameEntryButton}
          </button>
        </div>
      </div>
    `;
      overlayEl.classList.remove("hidden");
      const nameInput = document.getElementById("high-score-name");
      const saveButton = document.getElementById("save-high-score");
      const submit = () => {
        onSubmit(normalizeName(nameInput == null ? void 0 : nameInput.value));
      };
      nameInput == null ? void 0 : nameInput.focus();
      nameInput == null ? void 0 : nameInput.select();
      nameInput == null ? void 0 : nameInput.addEventListener("input", () => {
        nameInput.value = normalizeName(nameInput.value);
      });
      nameInput == null ? void 0 : nameInput.addEventListener("keydown", (event) => {
        if (event.code === "Enter") {
          event.preventDefault();
          submit();
        }
      });
      saveButton == null ? void 0 : saveButton.addEventListener("click", submit, { once: true });
    }
    function showSavingHighScoreScreen() {
      resetOverlayClasses();
      overlayEl.classList.add("overlay-illustrated");
      overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.savingHighScoreTitle}</div>
        <div class="overlay-copy">${text.savingHighScoreBody}</div>
      </div>
    `;
      overlayEl.classList.remove("hidden");
    }
    return {
      hide,
      showGameOverScreen,
      showNameEntryScreen,
      showSavingHighScoreScreen,
      showStartScreen,
      showText
    };
  }

  // game.ts
  var elements = getGameElements();
  var renderer = createRenderer(elements.canvas, {
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS
  });
  var highScores = createHighScoreService({
    storageKey: GAME.highScores.storageKey,
    maxEntries: GAME.highScores.maxEntries,
    text: GAME.text
  });
  var hud = createHud({
    scoreEl: elements.scoreEl,
    levelEl: elements.levelEl,
    clearsEl: elements.clearsEl,
    nextPieceEl: elements.nextPieceEl,
    musicToggleEl: elements.musicToggleEl,
    drawPreviewGem
  });
  var overlays = createOverlayController({
    overlayEl: elements.overlayEl,
    text: GAME.text
  });
  var session = createGameSession({
    boardConfig: BOARD,
    gameConfig: GAME,
    core: columns_core_exports,
    onGameOver: handleGameOver,
    onHudChange: syncHud,
    onLevelUp: handleLevelUp,
    onMatch: handleMatchFeedback,
    onPlace: handlePlace,
    onPreviewChange: handlePreviewChange
  });
  var gameOverFillAnimation = null;
  function syncHud(state) {
    hud.renderStats(state);
    hud.updateMusicToggleLabel(isMusicMuted());
  }
  function handleLevelUp() {
    playLevelUpSound();
  }
  function handleMatchFeedback(match) {
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
  function handlePlace() {
    playPlaceSound();
  }
  function handlePreviewChange(piece) {
    hud.renderNextPiece(piece);
  }
  function restartGame() {
    gameOverFillAnimation = null;
    session.start();
    overlays.hide();
    startGameplayMusic();
  }
  function initializeStartScreen() {
    gameOverFillAnimation = null;
    session.initialize();
    stopGameplayMusic();
    overlays.showStartScreen();
  }
  function startGame() {
    restartGame();
  }
  function handleGameOver(state) {
    stopGameplayMusic();
    playGameOverSound();
    const entry = {
      score: state.score,
      level: state.level,
      gems: state.clears
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
          }
        });
      });
      return;
    }
    queueGameOverFillAnimation(state, () => {
      overlays.showGameOverScreen(state, highScores.fill(currentHighScores));
    });
  }
  function togglePause() {
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
  function drawFrame() {
    const state = session.getState();
    if (gameOverFillAnimation) {
      renderer.render(gameOverFillAnimation.board, null);
      return;
    }
    renderer.render(state.board, state.active);
  }
  function update(timestamp) {
    updateGameOverFillAnimation(timestamp);
    session.tick(timestamp);
    drawFrame();
    requestAnimationFrame(update);
  }
  function handleMusicToggle() {
    toggleMusicMuted();
    hud.updateMusicToggleLabel(isMusicMuted());
  }
  function isTextEntryTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }
  function bindControls() {
    var _a4;
    bindGameInput({
      onHardDrop: handleHardDrop,
      onMoveLeft: handleMoveLeft,
      onMoveRight: handleMoveRight,
      onPause: handlePause,
      onRestart: handleRestart,
      onRotate: handleRotate,
      onSoftDrop: handleSoftDrop,
      onStart: handleStart,
      shouldIgnoreTarget: isTextEntryTarget
    });
    (_a4 = elements.musicToggleEl) == null ? void 0 : _a4.addEventListener("click", handleMusicToggle);
  }
  function handleHardDrop() {
    session.hardDrop();
  }
  function handleMoveLeft() {
    session.move(-1);
  }
  function handleMoveRight() {
    session.move(1);
  }
  function handlePause() {
    togglePause();
  }
  function handleRestart() {
    restartGame();
  }
  function handleRotate() {
    if (session.rotate()) {
      playRotateSound();
    }
  }
  function handleSoftDrop() {
    if (session.softDrop()) {
      session.awardSoftDrop();
    }
  }
  function handleStart() {
    if (!session.getState().started) {
      startGame();
      return true;
    }
    return false;
  }
  function queueGameOverFillAnimation(state, onComplete) {
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
      onComplete
    };
  }
  function updateGameOverFillAnimation(timestamp) {
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
      previousElapsedMs / GAME.timing.gameOverFillDurationMs * gameOverFillAnimation.totalEmpties
    );
    const nextFilledCount = Math.floor(
      nextElapsedMs / GAME.timing.gameOverFillDurationMs * gameOverFillAnimation.totalEmpties
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
  function cloneBoard(board) {
    return board.map(
      (row) => row.map((cell) => cell ? { color: cell.color, clearing: cell.clearing } : null)
    );
  }
  function getEmptyCells(board) {
    const empties = [];
    for (let row = board.length - 1; row >= 0; row -= 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        if (!board[row][col]) {
          empties.push([row, col]);
        }
      }
    }
    return empties;
  }
  function fillEmptyCells(board, empties, count) {
    for (let index = 0; index < count && empties.length > 0; index += 1) {
      const [row, col] = empties.shift();
      const colorIndex = (row * DEFAULT_COLS + col) % BOARD.colors.length;
      board[row][col] = createCell(BOARD.colors[colorIndex]);
    }
  }
  function bootstrapGame() {
    bindControls();
    initializeStartScreen();
    requestAnimationFrame(update);
  }
  bootstrapGame();
})();
//# sourceMappingURL=app.js.map
