const {
  createBoard,
  createCell,
  createPiece,
  randomColor,
  rotateGems,
  isValidPosition,
  lockPiece,
  findMatches,
  markMatches,
  clearMarkedMatches,
} = require("./columns-core");

describe("columns core", () => {
  test("creates a board with the expected dimensions", () => {
    const board = createBoard();

    expect(board).toHaveLength(13);
    expect(board[0]).toHaveLength(6);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });

  test("creates deterministic pieces when a custom random function is provided", () => {
    const random = jest
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.34)
      .mockReturnValueOnce(0.99);

    const piece = createPiece({ random });

    expect(piece.col).toBe(3);
    expect(piece.row).toBe(-2);
    expect(piece.gems).toEqual(["#ff5d8f", "#ffd166", "#fff07a"]);
  });

  test("makes the magic gem rarer than normal gems during random selection", () => {
    expect(randomColor(undefined, () => 0.94)).toBe("#ff8c42");
    expect(randomColor(undefined, () => 0.95)).toBe("#fff07a");
  });

  test("rotates gems by cycling the stack order", () => {
    expect(rotateGems(["top", "middle", "bottom"])).toEqual(["middle", "bottom", "top"]);
  });

  test("rejects positions that collide with occupied cells or leave the board", () => {
    const board = createBoard();
    board[5][2] = createCell("#fff");

    expect(isValidPosition(board, 2, 3, ["a", "b", "c"])).toBe(false);
    expect(isValidPosition(board, -1, 0, ["a", "b", "c"])).toBe(false);
    expect(isValidPosition(board, 2, 11, ["a", "b", "c"])).toBe(false);
    expect(isValidPosition(board, 1, -2, ["a", "b", "c"])).toBe(true);
  });

  test("locks a piece into the board", () => {
    const board = createBoard();
    lockPiece(board, {
      col: 1,
      row: 2,
      gems: ["red", "green", "blue"],
    });

    expect(board[2][1]?.color).toBe("red");
    expect(board[3][1]?.color).toBe("green");
    expect(board[4][1]?.color).toBe("blue");
  });

  test("finds horizontal, vertical, and diagonal matches", () => {
    const board = createBoard();

    board[12][0] = createCell("ruby");
    board[12][1] = createCell("ruby");
    board[12][2] = createCell("ruby");

    board[8][4] = createCell("amber");
    board[9][4] = createCell("amber");
    board[10][4] = createCell("amber");

    board[3][0] = createCell("jade");
    board[4][1] = createCell("jade");
    board[5][2] = createCell("jade");

    const matches = findMatches(board).map(([row, col]) => `${row},${col}`).sort();

    expect(matches).toEqual([
      "10,4",
      "12,0",
      "12,1",
      "12,2",
      "3,0",
      "4,1",
      "5,2",
      "8,4",
      "9,4",
    ]);
  });

  test("treats the magic gem as a wildcard without bridging different gem colors", () => {
    const board = createBoard();
    const magic = "#fff07a";

    board[12][0] = createCell("ruby");
    board[12][1] = createCell(magic);
    board[12][2] = createCell("ruby");

    board[10][0] = createCell("jade");
    board[10][1] = createCell(magic);
    board[10][2] = createCell("amber");

    const matches = findMatches(board).map(([row, col]) => `${row},${col}`).sort();

    expect(matches).toEqual(["12,0", "12,1", "12,2"]);
  });

  test("marks then clears matches and collapses gems downward", () => {
    const board = createBoard();

    board[10][0] = createCell("blue");
    board[11][0] = createCell("blue");
    board[12][0] = createCell("blue");
    board[9][0] = createCell("gold");

    const matches = findMatches(board);
    markMatches(board, matches);

    expect(board[10][0].clearing).toBe(true);
    expect(board[11][0].clearing).toBe(true);
    expect(board[12][0].clearing).toBe(true);

    const { removed } = clearMarkedMatches(board, matches);

    expect(removed).toBe(3);
    expect(board[12][0]?.color).toBe("gold");
    expect(board[12][0]?.clearing).toBe(false);
    expect(board[11][0]).toBe(null);
  });
});
