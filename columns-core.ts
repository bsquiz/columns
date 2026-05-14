import { BOARD } from "./constants";
import type { Board, CellData, Piece } from "./runtime-types";

export const DEFAULT_COLS = BOARD.cols;
export const DEFAULT_ROWS = BOARD.rows;
export const DEFAULT_COLORS = [...BOARD.colors];
export const MAGIC_COLOR = BOARD.magicColor;
export const MAGIC_WEIGHT = BOARD.magicWeight ?? 1;

export function createCell(color: string): CellData {
  return { color, clearing: false };
}

export function createBoard(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): Board {
  return Array.from({ length: rows }, () => Array<CellData | null>(cols).fill(null));
}

export function randomColor(colors = DEFAULT_COLORS, random = Math.random): string {
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

type CreatePieceOptions = {
  cols?: number;
  colors?: string[];
  random?: () => number;
  col?: number;
  row?: number;
};

export function createPiece(options: CreatePieceOptions = {}): Piece {
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
    gems: [randomColor(colors, random), randomColor(colors, random), randomColor(colors, random)],
  };
}

export function clonePiece(piece: Piece): Piece {
  return {
    col: piece.col,
    row: piece.row,
    gems: [...piece.gems],
  };
}

export function rotateGems(gems: string[]): string[] {
  const [top, middle, bottom] = gems;
  return [middle, bottom, top];
}

export function isValidPosition(board: Board, col: number, row: number, gems: string[]): boolean {
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

export function lockPiece(board: Board, piece: Piece): Board {
  piece.gems.forEach((color, index) => {
    const row = piece.row + index;
    if (row >= 0) {
      board[row][piece.col] = createCell(color);
    }
  });

  return board;
}

export function findMatches(board: Board): Array<[number, number]> {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const found = new Set<string>();
  const directions: Array<[number, number]> = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  const candidateColors = new Set<string>();

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

          const run: Array<[number, number]> = [];
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

  return [...found].map((key) => key.split(",").map(Number) as [number, number]);
}

function isCompatibleColor(cellColor: string | undefined, candidateColor: string): boolean {
  return Boolean(cellColor) && (cellColor === candidateColor || cellColor === MAGIC_COLOR);
}

export function markMatches(board: Board, matches: Array<[number, number]>): Board {
  matches.forEach(([row, col]) => {
    if (board[row][col]) {
      board[row][col].clearing = true;
    }
  });
  return board;
}

export function collapseBoard(board: Board): Board {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let col = 0; col < cols; col += 1) {
    const compacted: CellData[] = [];

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

export function clearMarkedMatches(board: Board, matches: Array<[number, number]>): { board: Board; removed: number } {
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
