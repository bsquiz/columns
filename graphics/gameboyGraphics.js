const PALETTE = {
  darkest: "#1f2f1f",
  dark: "#3f5f3f",
  midDark: "#56703d",
  light: "#7b8f3a",
  midLight: "#93aa4a",
  lightest: "#cfd79a",
};
const GEM_VARIANTS = [
  { fill: "#f4f7d6", highlight: "#fefff2", shadow: "#74883f" },
  { fill: "#c4d86a", highlight: "#eef7c2", shadow: "#607631" },
  { fill: "#99b44d", highlight: "#d9e79a", shadow: "#4d6228" },
  { fill: "#6a8434", highlight: "#9eb65b", shadow: "#27361a" },
  { fill: "#445b28", highlight: "#6d863e", shadow: "#172111" },
  { fill: "#24331a", highlight: "#47612d", shadow: "#091008" },
];
const GEM_SHAPES = ["square", "diamond", "circle", "triangle", "hex", "pill"];
const BOARD_COLORS = globalThis.ColumnsConstants?.BOARD?.colors ?? [];
const GEM_SHADE_MAP = new Map(
  BOARD_COLORS.map((color, index) => [color, GEM_VARIANTS[index % GEM_VARIANTS.length]])
);
const GEM_SHAPE_MAP = new Map(
  BOARD_COLORS.map((color, index) => [color, GEM_SHAPES[index % GEM_SHAPES.length]])
);

function getGemShades(color, clearing) {
  if (clearing) {
    return {
      fill: PALETTE.lightest,
      highlight: PALETTE.light,
      shadow: PALETTE.dark,
    };
  }

  return GEM_SHADE_MAP.get(color) ?? GEM_VARIANTS[0];
}

function getGemShape(color) {
  return GEM_SHAPE_MAP.get(color) ?? GEM_SHAPES[0];
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
  ctx.fillStyle = shades.highlight;
  drawShapeHighlight(ctx, size, shape);
  ctx.fillStyle = shades.shadow;
  drawShapeShadow(ctx, size, shape);
  ctx.restore();

  ctx.save();
  traceGemPath(ctx, size, shape);
  ctx.strokeStyle = PALETTE.darkest;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function traceGemPath(ctx, size, shape) {
  ctx.beginPath();

  switch (shape) {
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

  const { cols, rows } = options;
  const cell = canvas.width / cols;

  function render(board, activePiece) {
    drawBoard(board);
    drawActivePiece(activePiece);
  }

  function drawBoard(board) {
    ctx.fillStyle = PALETTE.lightest;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawDotMatrix();
    drawBorder();

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        drawCell(row, col, board[row][col]);
      }
    }

    drawGrid();
  }

  function drawDotMatrix() {
    ctx.save();
    ctx.fillStyle = "rgba(63, 95, 63, 0.08)";

    for (let y = 4; y < canvas.height; y += 6) {
      for (let x = 4; x < canvas.width; x += 6) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.restore();
  }

  function drawBorder() {
    ctx.save();
    ctx.strokeStyle = PALETTE.darkest;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    ctx.strokeStyle = PALETTE.dark;
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
    ctx.restore();
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(63, 95, 63, 0.2)";
    ctx.lineWidth = 1;

    for (let col = 1; col < cols; col += 1) {
      ctx.beginPath();
      ctx.moveTo(col * cell, 0);
      ctx.lineTo(col * cell, canvas.height);
      ctx.stroke();
    }

    for (let row = 1; row < rows; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * cell);
      ctx.lineTo(canvas.width, row * cell);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCell(row, col, cellData) {
    if (!cellData) {
      return;
    }

    const x = col * cell;
    const y = row * cell;

    ctx.save();
    ctx.translate(x, y);
    drawGem(ctx, cell, cellData.color, cellData.clearing);
    ctx.restore();
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

  return { render };
}

function drawPreviewGem(canvas, color) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const size = canvas.width;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGem(ctx, size, color, false);
}

if (typeof module === "object" && module.exports) {
  module.exports = { createRenderer, drawPreviewGem };
} else if (typeof globalThis !== "undefined") {
  globalThis.ColumnsGameboyGraphics = { createRenderer, drawPreviewGem };
}
