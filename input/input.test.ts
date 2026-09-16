import { bindGameInput } from "./input";

describe("input bindings", () => {
  type KeydownHandler = (event: {
    code: string;
    target?: EventTarget | null;
    preventDefault: jest.Mock;
  }) => void;

  function createTarget() {
    let keydownHandler: KeydownHandler | null = null;

    return {
      addEventListener(type: string, handler: KeydownHandler) {
        if (type === "keydown") {
          keydownHandler = handler;
        }
      },
      removeEventListener(type: string, handler: KeydownHandler) {
        if (type === "keydown" && keydownHandler === handler) {
          keydownHandler = null;
        }
      },
      dispatch(event: { code: string; target?: EventTarget | null; preventDefault: jest.Mock }) {
        keydownHandler?.(event);
      },
    };
  }

  function createGamepad({
    buttons = [] as number[],
    axes = [0, 0, 0, 0],
  } = {}): Gamepad {
    return {
      axes,
      buttons: Array.from({ length: 16 }, (_, index) => ({
        pressed: buttons.includes(index),
        touched: false,
        value: buttons.includes(index) ? 1 : 0,
      })),
    } as Gamepad;
  }

  beforeEach(() => {
    let lastFrameId = 0;
    let frameHandler: FrameRequestCallback | null = null;

    global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      frameHandler = callback;
      lastFrameId += 1;
      return lastFrameId;
    });
    global.cancelAnimationFrame = jest.fn();
    global.navigator = {
      getGamepads: jest.fn(() => []),
    } as Navigator;
    global.document = {
      activeElement: null,
    } as Document;
    (global as typeof globalThis & { runFrame?: (timestamp: number) => void }).runFrame = (timestamp) => {
      frameHandler?.(timestamp);
    };
  });

  afterEach(() => {
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
    delete global.navigator;
    delete global.document;
    delete (global as typeof globalThis & { runFrame?: (timestamp: number) => void }).runFrame;
    jest.restoreAllMocks();
  });

  test("maps keyboard keys to the expected actions", () => {
    const target = createTarget();
    const onMoveLeft = jest.fn();
    const onStart = jest.fn().mockReturnValue(false);

    bindGameInput({
      target: target as never,
      onMoveLeft,
      onStart,
    });

    const preventDefault = jest.fn();
    target.dispatch({ code: "ArrowLeft", preventDefault });
    expect(onMoveLeft).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);

    target.dispatch({ code: "Enter", preventDefault: jest.fn() });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test("starts and drives the game through a connected gamepad", () => {
    const onStart = jest.fn().mockReturnValue(true);
    const onMoveLeft = jest.fn();
    const onSoftDrop = jest.fn();
    const onRotate = jest.fn();
    const onHardDrop = jest.fn();
    const onPause = jest.fn();
    const onRestart = jest.fn();

    bindGameInput({
      target: createTarget() as never,
      onStart,
      onMoveLeft,
      onSoftDrop,
      onRotate,
      onHardDrop,
      onPause,
      onRestart,
    });

    (global.navigator.getGamepads as jest.Mock).mockReturnValue([
      createGamepad({ buttons: [0, 14], axes: [0, 0, 0, 0] }),
    ]);

    global.runFrame?.(0);
    global.runFrame?.(16);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onRotate).toHaveBeenCalledTimes(1);
    expect(onMoveLeft).toHaveBeenCalledTimes(1);

    (global.navigator.getGamepads as jest.Mock).mockReturnValue([
      createGamepad({ buttons: [13, 1, 8, 9], axes: [0, 0.8, 0, 0] }),
    ]);

    global.runFrame?.(220);

    expect(onSoftDrop).toHaveBeenCalledTimes(1);
    expect(onHardDrop).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  test("repeats held directional gamepad inputs after a short delay", () => {
    const onMoveRight = jest.fn();
    const onSoftDrop = jest.fn();

    bindGameInput({
      target: createTarget() as never,
      onMoveRight,
      onSoftDrop,
    });

    (global.navigator.getGamepads as jest.Mock).mockReturnValue([
      createGamepad({ buttons: [15, 13], axes: [0.7, 0.8, 0, 0] }),
    ]);

    global.runFrame?.(0);
    global.runFrame?.(16);
    global.runFrame?.(100);
    global.runFrame?.(220);
    global.runFrame?.(320);

    expect(onMoveRight).toHaveBeenCalledTimes(3);
    expect(onSoftDrop).toHaveBeenCalledTimes(3);
  });
});
