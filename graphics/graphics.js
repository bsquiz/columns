(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.ColumnsGraphics = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { GRAPHICS } =
    typeof require === "function" ? require("../constants") : globalThis.ColumnsConstants;

  function createRenderer(canvas, options) {
    const ctx = canvas.getContext("2d");
    const { cols, rows } = options;
    const cell = canvas.width / cols;
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    backgroundGradient.addColorStop(0, GRAPHICS.backgroundGradient.start);
    backgroundGradient.addColorStop(1, GRAPHICS.backgroundGradient.end);

    function render(board, activePiece) {
      drawBoard(board);
      drawActivePiece(activePiece);
    }

    function drawBoard(board) {
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          drawCell(row, col, board[row][col]);
        }
      }

      drawGrid();
    }

    function drawGrid() {
      ctx.save();
      ctx.strokeStyle = GRAPHICS.grid.stroke;
      ctx.lineWidth = GRAPHICS.grid.lineWidth;

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
      const pulse = cellData.clearing
        ? GRAPHICS.gem.pulseBase +
          Math.sin(performance.now() / GRAPHICS.gem.pulseSpeedDivisor) *
            GRAPHICS.gem.pulseVariance
        : 0;

      ctx.save();
      ctx.translate(x, y);

      const gradient = ctx.createRadialGradient(
        cell * GRAPHICS.gem.gradient.innerXRatio,
        cell * GRAPHICS.gem.gradient.innerYRatio,
        cell * GRAPHICS.gem.gradient.innerRadiusMultiplier * pulse,
        cell * GRAPHICS.gem.gradient.outerXRatio,
        cell * GRAPHICS.gem.gradient.outerYRatio,
        cell * GRAPHICS.gem.gradient.outerRadiusRatio
      );

      GRAPHICS.gem.gradient.stops.forEach(([offset, color]) => {
        gradient.addColorStop(offset, color.replace("{{color}}", cellData.color));
      });

      ctx.fillStyle = gradient;
      roundRect(
        GRAPHICS.gem.rectInset,
        GRAPHICS.gem.rectInset,
        cell - GRAPHICS.gem.rectInset * 2,
        cell - GRAPHICS.gem.rectInset * 2,
        GRAPHICS.gem.rectRadius
      );
      ctx.fill();

      ctx.strokeStyle = GRAPHICS.gem.stroke.color;
      ctx.lineWidth = GRAPHICS.gem.stroke.width;
      ctx.stroke();

      GRAPHICS.gem.facets.forEach(({ points, fill }) => {
        ctx.beginPath();
        points.forEach(([xRatio, yRatio], index) => {
          const pointX = cell * xRatio;
          const pointY = cell * yRatio;
          if (index === 0) {
            ctx.moveTo(pointX, pointY);
          } else {
            ctx.lineTo(pointX, pointY);
          }
        });
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      });

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

    function roundRect(x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
    }

    return { render };
  }

  return { createRenderer };
});
