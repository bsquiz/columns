const { createHud } = require("./hud");

describe("hud", () => {
  function createTextElement() {
    return { textContent: "" };
  }

  function createNextPieceContainer() {
    return {
      innerHTML: "stale",
      children: [],
      appendChild(child) {
        this.children.push(child);
      },
    };
  }

  beforeEach(() => {
    global.document = {
      createElement(tagName) {
        return {
          tagName,
          className: "",
          width: 0,
          height: 0,
        };
      },
    };
  });

  afterEach(() => {
    delete global.document;
  });

  test("renders stats into their display elements", () => {
    const scoreEl = createTextElement();
    const levelEl = createTextElement();
    const clearsEl = createTextElement();
    const boundHud = createHud({
      scoreEl,
      levelEl,
      clearsEl,
      nextPieceEl: createNextPieceContainer(),
      musicToggleEl: createTextElement(),
      drawPreviewGem: jest.fn(),
    });

    boundHud.renderStats({ score: 123, level: 4, clears: 18 });

    expect(scoreEl.textContent).toBe("123");
    expect(levelEl.textContent).toBe("4");
    expect(clearsEl.textContent).toBe("18");
  });

  test("renders the next piece preview canvases and draws each gem", () => {
    const nextPieceEl = createNextPieceContainer();
    const drawPreviewGem = jest.fn();
    const hud = createHud({
      scoreEl: createTextElement(),
      levelEl: createTextElement(),
      clearsEl: createTextElement(),
      nextPieceEl,
      musicToggleEl: createTextElement(),
      drawPreviewGem,
    });

    hud.renderNextPiece({ gems: ["ruby", "jade", "gold"] });

    expect(nextPieceEl.innerHTML).toBe("");
    expect(nextPieceEl.children).toHaveLength(3);
    expect(nextPieceEl.children.map((child) => child.className)).toEqual([
      "preview-gem d-block",
      "preview-gem d-block",
      "preview-gem d-block",
    ]);
    expect(nextPieceEl.children.map((child) => [child.width, child.height])).toEqual([
      [40, 40],
      [40, 40],
      [40, 40],
    ]);
    expect(drawPreviewGem).toHaveBeenCalledTimes(3);
    expect(drawPreviewGem.mock.calls.map(([, color]) => color)).toEqual(["ruby", "jade", "gold"]);
  });

  test("updates the music toggle label based on mute state", () => {
    const musicToggleEl = createTextElement();
    const hud = createHud({
      scoreEl: createTextElement(),
      levelEl: createTextElement(),
      clearsEl: createTextElement(),
      nextPieceEl: createNextPieceContainer(),
      musicToggleEl,
      drawPreviewGem: jest.fn(),
    });

    hud.updateMusicToggleLabel(true);
    expect(musicToggleEl.textContent).toBe("Unmute Music");

    hud.updateMusicToggleLabel(false);
    expect(musicToggleEl.textContent).toBe("Mute Music");
  });

  test("skips the music label update when no toggle element exists", () => {
    const hud = createHud({
      scoreEl: createTextElement(),
      levelEl: createTextElement(),
      clearsEl: createTextElement(),
      nextPieceEl: createNextPieceContainer(),
      musicToggleEl: null,
      drawPreviewGem: jest.fn(),
    });

    expect(() => hud.updateMusicToggleLabel(true)).not.toThrow();
  });
});
