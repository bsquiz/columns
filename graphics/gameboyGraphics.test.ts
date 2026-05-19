import { createRenderer, drawPreviewGem } from "./gameboyGraphics";

describe("gameboy graphics renderer", () => {
  function createMockContext() {
    return {
      fillStyle: null as string | null,
      strokeStyle: null as string | null,
      lineWidth: 0,
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      quadraticCurveTo: jest.fn(),
      strokeRect: jest.fn(),
      drawImage: jest.fn(),
    };
  }

  function createCanvas(context: ReturnType<typeof createMockContext>) {
    return {
      width: 120,
      height: 260,
      getContext: jest.fn(() => context),
    };
  }

  beforeEach(() => {
    delete global.OffscreenCanvas;

    global.document = {
      createElement(tagName: string) {
        if (tagName !== "canvas") {
          throw new Error(`Unexpected tag: ${tagName}`);
        }

        const context = createMockContext();
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => context),
        };
      },
    } as Document;
  });

  afterEach(() => {
    delete global.document;
    jest.restoreAllMocks();
  });

  test("creates a renderer with a required 2d context", () => {
    const canvas = { getContext: jest.fn(() => null) };

    expect(() => createRenderer(canvas as never, { cols: 6, rows: 13 })).toThrow(
      "2D canvas context is required"
    );
  });

  test("renders the cached board background and visible gem sprites", () => {
    const context = createMockContext();
    const canvas = createCanvas(context);
    const renderer = createRenderer(canvas as never, { cols: 6, rows: 13 });
    const board = Array.from({ length: 13 }, () => Array(6).fill(null));
    board[2][1] = { color: "#ff5d8f", clearing: false };
    board[5][4] = { color: "#55f7ff", clearing: true };

    renderer.render(board as never, null);

    expect(canvas.getContext).toHaveBeenCalledWith("2d");
    expect(context.drawImage).toHaveBeenCalledTimes(3);
    expect(context.drawImage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ width: 120, height: 260 }),
      0,
      0
    );
    expect(context.drawImage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ width: 20, height: 20 }),
      20,
      40
    );
    expect(context.drawImage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ width: 20, height: 20 }),
      80,
      100
    );
  });

  test("renders only the visible rows of the active piece", () => {
    const context = createMockContext();
    const canvas = createCanvas(context);
    const renderer = createRenderer(canvas as never, { cols: 6, rows: 13 });
    const board = Array.from({ length: 13 }, () => Array(6).fill(null));
    const activePiece = {
      col: 2,
      row: -1,
      gems: ["#ff5d8f", "#55f7ff", "#ffd166"],
    };

    renderer.render(board as never, activePiece as never);

    expect(context.drawImage).toHaveBeenCalledTimes(3);
    expect(context.drawImage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ width: 120, height: 260 }),
      0,
      0
    );
    expect(context.drawImage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ width: 20, height: 20 }),
      40,
      0
    );
    expect(context.drawImage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ width: 20, height: 20 }),
      40,
      20
    );
  });

  test("draws preview gems through the same sprite path as the board", () => {
    const context = createMockContext();
    const canvas = createCanvas(context);

    drawPreviewGem(canvas as never, "#fff07a");

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 120, 260);
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ width: 120, height: 120 }),
      0,
      0
    );
  });
});
