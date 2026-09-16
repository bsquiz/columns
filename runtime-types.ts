export interface Piece {
  col: number;
  row: number;
  gems: string[];
}

export interface CellData {
  color: string;
  clearing: boolean;
}

export type Board = Array<Array<CellData | null>>;

export interface GameState {
  board: Board;
  active: Piece | null;
  next: Piece;
  started: boolean;
  score: number;
  level: number;
  clears: number;
  elapsedGameplayMs: number;
  dropTimer: number;
  lastTime: number;
  paused: boolean;
  gameOver: boolean;
  resolving: boolean;
  matchFlash: number;
  flashMatches: Array<[number, number]>;
}

export interface HighScoreEntry {
  score: number;
  level: number;
  gems: number;
  name?: string;
}

export interface HighScoreRow {
  name: string;
  score: number | string;
  level: number | string;
  gems: number | string;
}

export interface ColumnsCoreModule {
  DEFAULT_COLS: number;
  DEFAULT_ROWS: number;
  createBoard: () => Board;
  createPiece: () => Piece;
  clonePiece: (piece: Piece) => Piece;
  rotateGems: (gems: string[]) => string[];
  isValidPosition: (board: Board, col: number, row: number, gems: string[]) => boolean;
  lockPiece: (board: Board, piece: Piece) => void;
  findMatches: (board: Board) => Array<[number, number]>;
  markMatches: (board: Board, matches: Array<[number, number]>) => void;
  clearMarkedMatches: (
    board: Board,
    matches: Array<[number, number]>
  ) => { removed: number };
}
