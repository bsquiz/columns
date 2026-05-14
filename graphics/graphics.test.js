const { createRenderer } = require("./graphics");

describe("graphics renderer", () => {
  function createGradient() {
    return {
      addColorStop: jest.fn(),
    };
  }

  function createContext() {
    return {
      fillStyle: null,
      strokeStyle: null,
      lineWidth: 0,
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      arcTo: jest.fn(),
      createLinearGradient: jest.fn(() => createGradient()),
      createRadialGradient: jest.fn(() => createGradient()),
    };
  }

  function createCanvas(context) {
    return {
      width: 120,
      height: 260,
      getContext: jest.fn(() => context),
    };
  }

  beforeEach(() => {
    jest.spyOn(global.performance, "now").mockReturnValue(120);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates the background gradient when the renderer is created", () => {
    const context = createContext();
    const canvas = createCanvas(context);

    createRenderer(canvas, { cols: 6, rows: 13 });

    expect(canvas.getContext).toHaveBeenCalledWith("2d");
    expect(context.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 260);
    const backgroundGradient = context.createLinearGradient.mock.results[0].value;
    expect(backgroundGradient.addColorStop).toHaveBeenNthCalledWith(1, 0, "#0b1730");
    expect(backgroundGradient.addColorStop).toHaveBeenNthCalledWith(2, 1, "#190c25");
  });

  test("renders the board background, occupied cells, and grid lines", () => {
    const context = createContext();
    const canvas = createCanvas(context);
    const renderer = createRenderer(canvas, { cols: 6, rows: 13 });
    const board = Array.from({ length: 13 }, () => Array(6).fill(null));
    board[2][1] = { color: "#ff5d8f", clearing: false };
    board[5][4] = { color: "#55f7ff", clearing: true };

    renderer.render(board, null);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 120, 260);
    expect(context.createRadialGradient).toHaveBeenCalledTimes(2);
    expect(context.translate).toHaveBeenNthCalledWith(1, 20, 40);
    expect(context.translate).toHaveBeenNthCalledWith(2, 80, 100);
    expect(context.stroke).toHaveBeenCalledTimes(2 + (6 - 1) + (13 - 1));
  });

  test("renders active piece gems and skips rows above the visible board", () => {
    const context = createContext();
    const canvas = createCanvas(context);
    const renderer = createRenderer(canvas, { cols: 6, rows: 13 });
    const board = Array.from({ length: 13 }, () => Array(6).fill(null));
    const activePiece = {
      col: 2,
      row: -1,
      gems: ["#ff5d8f", "#55f7ff", "#ffd166"],
    };

    renderer.render(board, activePiece);

    expect(context.createRadialGradient).toHaveBeenCalledTimes(2);
    expect(context.translate).toHaveBeenNthCalledWith(1, 40, 0);
    expect(context.translate).toHaveBeenNthCalledWith(2, 40, 20);
  });

  test("uses the clearing pulse to build gem gradients for clearing cells", () => {
    const context = createContext();
    const canvas = createCanvas(context);
    const renderer = createRenderer(canvas, { cols: 6, rows: 13 });
    const board = Array.from({ length: 13 }, () => Array(6).fill(null));
    board[0][0] = { color: "#ff5d8f", clearing: true };

    renderer.render(board, null);

    const radialArgs = context.createRadialGradient.mock.calls[0];
    expect(radialArgs[2]).toBeGreaterThan(0);
    const gemGradient = context.createRadialGradient.mock.results[0].value;
    expect(gemGradient.addColorStop).toHaveBeenCalledWith(0.26, "#ff5d8f");
  });
});
