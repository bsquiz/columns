type BindGameInputOptions = {
  onHardDrop?: (event: KeyboardEvent) => void;
  onMoveLeft?: (event: KeyboardEvent) => void;
  onMoveRight?: (event: KeyboardEvent) => void;
  onPause?: (event: KeyboardEvent) => void;
  onRestart?: (event: KeyboardEvent) => void;
  onRotate?: (event: KeyboardEvent) => void;
  onSoftDrop?: (event: KeyboardEvent) => void;
  onStart?: (event: KeyboardEvent) => boolean;
  shouldIgnoreTarget?: (target: EventTarget | null) => boolean;
  target?: Document;
};

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

  function handleKeydown(event: KeyboardEvent): void {
    if (shouldIgnoreTarget?.(event.target)) {
      return;
    }

    if (onStart && (event.code === "Enter" || event.code === "Space")) {
      const handledStart = onStart(event);
      if (handledStart) {
        event.preventDefault();
        return;
      }
    }

    switch (event.code) {
      case "ArrowLeft":
        event.preventDefault();
        onMoveLeft?.(event);
        break;
      case "ArrowRight":
        event.preventDefault();
        onMoveRight?.(event);
        break;
      case "ArrowUp":
        event.preventDefault();
        onRotate?.(event);
        break;
      case "ArrowDown":
        event.preventDefault();
        onSoftDrop?.(event);
        break;
      case "Space":
        event.preventDefault();
        onHardDrop?.(event);
        break;
      case "KeyP":
        onPause?.(event);
        break;
      case "KeyR":
        onRestart?.(event);
        break;
      default:
        break;
    }
  }

  target.addEventListener("keydown", handleKeydown);

  return () => {
    target.removeEventListener("keydown", handleKeydown);
  };
}
