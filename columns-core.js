(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.ColumnsCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { BOARD } =
    typeof require === "function" ? require("./constants") : globalThis.ColumnsConstants;
  const DEFAULT_COLS = BOARD.cols;
  const DEFAULT_ROWS = BOARD.rows;
  const DEFAULT_COLORS = BOARD.colors;
  const MAGIC_COLOR = BOARD.magicColor;
  const MAGIC_WEIGHT = BOARD.magicWeight ?? 1;

  function createCell(color) {
    return { color, clearing: false };
  }

  function createBoard(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  function randomColor(colors = DEFAULT_COLORS, random = Math.random) {
    const weightedColors = colors.map((color) => ({
      color,
      weight: color === MAGIC_COLOR ? MAGIC_WEIGHT : 1,
    }));
    const totalWeight = weightedColors.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * totalWeight;

    for (const entry of weightedColors) {
      target -= entry.weight;
      if (target <= 0) {
        return entry.color;
      }
    }

    return weightedColors[weightedColors.length - 1]?.color ?? colors[0];
  }

  function createPiece(options = {}) {
    const {
      cols = DEFAULT_COLS,
      colors = DEFAULT_COLORS,
      random = Math.random,
      col = Math.floor(cols / 2),
      row = BOARD.spawnRow,
    } = options;

    return {
      col,
      row,
      gems: [
        randomColor(colors, random),
        randomColor(colors, random),
        randomColor(colors, random),
      ],
    };
  }

  function clonePiece(piece) {
    return {
      col: piece.col,
      row: piece.row,
      gems: [...piece.gems],
    };
  }

  function rotateGems(gems) {
    const [top, middle, bottom] = gems;
    return [middle, bottom, top];
  }

  function isValidPosition(board, col, row, gems) {
    const rows = board.length;
    const cols = board[0]?.length ?? 0;

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
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    const found = new Set();
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    const candidateColors = new Set();

    board.forEach((boardRow) => {
      boardRow.forEach((cell) => {
        if (cell?.color) {
          candidateColors.add(cell.color);
        }
      });
    });

    candidateColors.forEach((candidateColor) => {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          directions.forEach(([dr, dc]) => {
            const previousRow = row - dr;
            const previousCol = col - dc;
            if (isCompatibleColor(board[previousRow]?.[previousCol]?.color, candidateColor)) {
              return;
            }

            const run = [];
            let nextRow = row;
            let nextCol = col;

            while (
              nextRow >= 0 &&
              nextRow < rows &&
              nextCol >= 0 &&
              nextCol < cols &&
              isCompatibleColor(board[nextRow][nextCol]?.color, candidateColor)
            ) {
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
    const rows = board.length;
    const cols = board[0]?.length ?? 0;

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
        board[row][col] = compacted[rows - 1 - row] ?? null;
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

  return {
    DEFAULT_COLS,
    DEFAULT_ROWS,
    DEFAULT_COLORS,
    MAGIC_COLOR,
    createCell,
    createBoard,
    randomColor,
    createPiece,
    clonePiece,
    rotateGems,
    isValidPosition,
    lockPiece,
    findMatches,
    markMatches,
    collapseBoard,
    clearMarkedMatches,
  };
});
