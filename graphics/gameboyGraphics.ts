import { BOARD } from "../constants";
import type { Board, CellData, GameState, Piece } from "../runtime-types";

type Palette = {
  darkest: string;
  dark: string;
  midDark: string;
  light: string;
  midLight: string;
  lightest: string;
};

type GemShades = {
  fill: string;
  highlight: string;
  shadow: string;
};

type GemShape =
  | "square"
  | "diamond"
  | "circle"
  | "triangle"
  | "hex"
  | "pill"
  | "wildcard";

type Renderer = {
  render: (board: Board, activePiece: GameState["active"]) => void;
};

type RendererOptions = {
  cols: number;
  rows: number;
};

type CanvasBuffer = HTMLCanvasElement | OffscreenCanvas;
type BufferContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type SpriteCache = Map<string, CanvasBuffer>;

const PALETTE: Palette = {
  darkest: "#1f2f1f",
  dark: "#3f5f3f",
  midDark: "#56703d",
  light: "#7b8f3a",
  midLight: "#93aa4a",
  lightest: "#cfd79a",
};

const GEM_VARIANTS: GemShades[] = [
  { fill: "#f4f7d6", highlight: "#fefff2", shadow: "#74883f" },
  { fill: "#c4d86a", highlight: "#eef7c2", shadow: "#607631" },
  { fill: "#99b44d", highlight: "#d9e79a", shadow: "#4d6228" },
  { fill: "#6a8434", highlight: "#9eb65b", shadow: "#27361a" },
  { fill: "#445b28", highlight: "#6d863e", shadow: "#172111" },
  { fill: "#24331a", highlight: "#47612d", shadow: "#091008" },
];

const GEM_SHAPES: GemShape[] = ["square", "diamond", "circle", "triangle", "hex", "pill"];
const BOARD_COLORS = BOARD.colors ?? [];
const MAGIC_GEM_COLOR = BOARD.magicColor ?? BOARD_COLORS[BOARD_COLORS.length - 1];
const GEM_SHADE_MAP = new Map<string, GemShades>(
  BOARD_COLORS.map((color, index) => [color, GEM_VARIANTS[index % GEM_VARIANTS.length]])
);
const GEM_SHAPE_MAP = new Map<string, GemShape>(
  BOARD_COLORS.map((color, index) => [color, GEM_SHAPES[index % GEM_SHAPES.length]])
);
const CLEARING_SHADES: GemShades = {
  fill: PALETTE.lightest,
  highlight: PALETTE.light,
  shadow: PALETTE.dark,
};

function getGemShades(color: string, clearing: boolean): GemShades {
  if (clearing) {
    return CLEARING_SHADES;
  }

  if (color === MAGIC_GEM_COLOR) {
    return {
      fill: PALETTE.lightest,
      highlight: "#f7ffcf",
      shadow: PALETTE.midDark,
    };
  }

  return GEM_SHADE_MAP.get(color) ?? GEM_VARIANTS[0];
}

function getGemShape(color: string): GemShape {
  if (color === MAGIC_GEM_COLOR) {
    return "wildcard";
  }

  return GEM_SHAPE_MAP.get(color) ?? GEM_SHAPES[0];
}

function drawGem(
  ctx: BufferContext,
  size: number,
  color: string,
  clearing = false
): void {
  const shades = getGemShades(color, clearing);
  const shape = getGemShape(color);

  ctx.save();
  drawGemShape(ctx, size, shape, shades);

  if (clearing) {
    drawClearPattern(ctx, size);
  }

  ctx.restore();
}

function drawClearPattern(ctx: BufferContext, size: number): void {
  ctx.fillStyle = PALETTE.darkest;

  for (let offset = 10; offset < size - 10; offset += 8) {
    ctx.fillRect(offset, offset, 3, 3);
    ctx.fillRect(size - offset - 3, offset, 3, 3);
  }
}

function drawGemShape(
  ctx: BufferContext,
  size: number,
  shape: GemShape,
  shades: GemShades
): void {
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

function drawWildcardFacets(ctx: BufferContext, size: number, shades: GemShades): void {
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

function traceGemPath(ctx: BufferContext, size: number, shape: GemShape): void {
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

function traceRoundedRect(
  ctx: BufferContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
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

function drawShapeHighlight(ctx: BufferContext, size: number, shape: GemShape): void {
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

function drawShapeShadow(ctx: BufferContext, size: number, shape: GemShape): void {
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

export function createRenderer(canvas: HTMLCanvasElement, options: RendererOptions): Renderer {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context is required");
  }
  const context = ctx;

  const { cols, rows } = options;
  const cell = canvas.width / cols;
  const spriteCache: SpriteCache = new Map();
  const boardBackground = createBoardBackgroundBuffer(canvas.width, canvas.height);

  function render(board: Board, activePiece: Piece | null): void {
    if (boardBackground) {
      context.drawImage(boardBackground, 0, 0);
    } else {
      drawBoardBackground();
    }

    drawBoardCells(board);
    drawActivePiece(activePiece);
  }

  function drawBoardCells(board: Board): void {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        drawCell(row, col, board[row][col]);
      }
    }
  }

  function drawBoardBackgroundContent(target: BufferContext): void {
    target.fillStyle = PALETTE.lightest;
    target.fillRect(0, 0, canvas.width, canvas.height);
    drawDotMatrix(target);
    drawBorder(target);
    drawGrid(target);
  }

  function drawBoardBackground(): void {
    context.fillStyle = PALETTE.lightest;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawDotMatrix(context);
    drawBorder(context);
    drawGrid(context);
  }

  function drawDotMatrix(target: BufferContext): void {
    target.save();
    target.fillStyle = "rgba(63, 95, 63, 0.08)";

    for (let y = 4; y < canvas.height; y += 6) {
      for (let x = 4; x < canvas.width; x += 6) {
        target.fillRect(x, y, 1, 1);
      }
    }

    target.restore();
  }

  function drawBorder(target: BufferContext): void {
    target.save();
    target.strokeStyle = PALETTE.darkest;
    target.lineWidth = 4;
    target.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    target.strokeStyle = PALETTE.dark;
    target.lineWidth = 2;
    target.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
    target.restore();
  }

  function drawGrid(target: BufferContext): void {
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

  function drawCell(row: number, col: number, cellData: CellData | null): void {
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

  function drawActivePiece(activePiece: Piece | null): void {
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

  function getGemSprite(color: string, clearing: boolean): CanvasBuffer | null {
    const cacheKey = `${cell}:${color}:${clearing ? "1" : "0"}`;
    const cachedSprite = spriteCache.get(cacheKey);
    if (cachedSprite) {
      return cachedSprite;
    }

    const spriteCanvas = createCanvasBuffer(cell, cell);
    const spriteContext = spriteCanvas?.getContext("2d");
    if (!spriteCanvas || !spriteContext) {
      return null;
    }

    drawGem(spriteContext, cell, color, clearing);
    spriteCache.set(cacheKey, spriteCanvas);
    return spriteCanvas;
  }

  function createBoardBackgroundBuffer(
    width: number,
    height: number
  ): CanvasBuffer | null {
    const backgroundCanvas = createCanvasBuffer(width, height);
    const backgroundContext = backgroundCanvas?.getContext("2d");
    if (!backgroundCanvas || !backgroundContext) {
      return null;
    }

    drawBoardBackgroundContent(backgroundContext);
    return backgroundCanvas;
  }

  return { render };
}

export function drawPreviewGem(canvas: HTMLCanvasElement, color: string): void {
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

function createGemPreviewSprite(size: number, color: string): CanvasBuffer | null {
  const spriteCanvas = createCanvasBuffer(size, size);
  const spriteContext = spriteCanvas?.getContext("2d");
  if (!spriteCanvas || !spriteContext) {
    return null;
  }

  drawGem(spriteContext, size, color, false);
  return spriteCanvas;
}

function createCanvasBuffer(width: number, height: number): CanvasBuffer | null {
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
