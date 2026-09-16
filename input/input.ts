type InputAction = () => void;

type StartAction = () => boolean;

type BindGameInputOptions = {
  onHardDrop?: InputAction;
  onMoveLeft?: InputAction;
  onMoveRight?: InputAction;
  onPause?: InputAction;
  onRestart?: InputAction;
  onRotate?: InputAction;
  onSoftDrop?: InputAction;
  onStart?: StartAction;
  shouldIgnoreTarget?: (target: EventTarget | null) => boolean;
  target?: Document;
};

type RepeatState = {
  active: boolean;
  nextTriggerAt: number;
};

const GAMEPAD_REPEAT_START_MS = 180;
const GAMEPAD_REPEAT_INTERVAL_MS = 90;
const GAMEPAD_AXIS_THRESHOLD = 0.55;

export function bindGameInput(options: BindGameInputOptions): () => void {
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
    target = document,
  } = options;
  const repeatStates = {
    moveLeft: { active: false, nextTriggerAt: 0 },
    moveRight: { active: false, nextTriggerAt: 0 },
    softDrop: { active: false, nextTriggerAt: 0 },
  };
  const previousButtons = {
    hardDrop: false,
    pause: false,
    restart: false,
    rotate: false,
    start: false,
  };
  let animationFrameId = 0;

  function handleKeydown(event: KeyboardEvent): void {
    if (shouldIgnoreTarget?.(event.target)) {
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
        onMoveLeft?.();
        break;
      case "ArrowRight":
        event.preventDefault();
        onMoveRight?.();
        break;
      case "ArrowUp":
        event.preventDefault();
        onRotate?.();
        break;
      case "ArrowDown":
        event.preventDefault();
        onSoftDrop?.();
        break;
      case "Space":
        event.preventDefault();
        onHardDrop?.();
        break;
      case "KeyP":
        onPause?.();
        break;
      case "KeyR":
        onRestart?.();
        break;
      default:
        break;
    }
  }

  target.addEventListener("keydown", handleKeydown);

  function updateRepeatState(
    now: number,
    pressed: boolean,
    state: RepeatState,
    action?: InputAction
  ): void {
    if (!pressed) {
      state.active = false;
      state.nextTriggerAt = 0;
      return;
    }

    if (!state.active) {
      state.active = true;
      state.nextTriggerAt = now + GAMEPAD_REPEAT_START_MS;
      action?.();
      return;
    }

    if (now < state.nextTriggerAt) {
      return;
    }

    state.nextTriggerAt = now + GAMEPAD_REPEAT_INTERVAL_MS;
    action?.();
  }

  function fireOnRisingEdge(
    pressed: boolean,
    previous: boolean,
    action?: InputAction | StartAction
  ): boolean {
    if (pressed && !previous) {
      return Boolean(action?.());
    }

    return false;
  }

  function isGamepadButtonPressed(gamepad: Gamepad, buttonIndex: number): boolean {
    return Boolean(gamepad.buttons[buttonIndex]?.pressed);
  }

  function getActiveGamepad(): Gamepad | null {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      return null;
    }

    return [...navigator.getGamepads()].find((gamepad): gamepad is Gamepad => Boolean(gamepad)) ?? null;
  }

  function pollGamepad(timestamp: number): void {
    const activeTarget = typeof document !== "undefined" ? document.activeElement : null;
    if (shouldIgnoreTarget?.(activeTarget)) {
      animationFrameId = requestAnimationFrame(pollGamepad);
      return;
    }

    const gamepad = getActiveGamepad();
    if (gamepad) {
      const leftPressed =
        isGamepadButtonPressed(gamepad, 14) || (gamepad.axes[0] ?? 0) <= -GAMEPAD_AXIS_THRESHOLD;
      const rightPressed =
        isGamepadButtonPressed(gamepad, 15) || (gamepad.axes[0] ?? 0) >= GAMEPAD_AXIS_THRESHOLD;
      const downPressed =
        isGamepadButtonPressed(gamepad, 13) || (gamepad.axes[1] ?? 0) >= GAMEPAD_AXIS_THRESHOLD;
      const rotatePressed =
        isGamepadButtonPressed(gamepad, 0) ||
        isGamepadButtonPressed(gamepad, 12) ||
        (gamepad.axes[1] ?? 0) <= -GAMEPAD_AXIS_THRESHOLD;
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
