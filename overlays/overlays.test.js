const { createOverlayController } = require("./overlays");

describe("overlays", () => {
  const text = {
    startTitle: "GEM COLUMNS",
    startBody: "Start body",
    startHint: "Press Enter",
    gameOverTitle: "GAME OVER",
    gameOverSubtitle: "Top Scores",
    gameOverHint: "Press R to play again",
    nameEntryTitle: "NEW HIGH SCORE",
    nameEntryBody: "Enter your name",
    nameEntryButton: "Save Score",
  };

  function createClassList(initial = []) {
    const classes = new Set(initial);

    return {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      toggle(name, force) {
        if (force === undefined) {
          if (classes.has(name)) {
            classes.delete(name);
            return false;
          }

          classes.add(name);
          return true;
        }

        if (force) {
          classes.add(name);
          return true;
        }

        classes.delete(name);
        return false;
      },
      contains(name) {
        return classes.has(name);
      },
    };
  }

  function createInputElement(value = "") {
    return {
      value,
      listeners: {},
      focused: false,
      selected: false,
      addEventListener(type, handler) {
        this.listeners[type] = handler;
      },
      focus() {
        this.focused = true;
      },
      select() {
        this.selected = true;
      },
    };
  }

  function createOverlayEl() {
    return {
      classList: createClassList(["hidden"]),
      innerHTML: "",
    };
  }

  beforeEach(() => {
    delete global.document;
  });

  test("shows text overlays and toggles fullscreen state", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl, text });

    overlays.showText("PAUSED\nNOW", { fullscreen: true });

    expect(overlayEl.classList.contains("overlay-fullscreen")).toBe(true);
    expect(overlayEl.classList.contains("hidden")).toBe(false);
    expect(overlayEl.innerHTML).toContain("PAUSED<br />NOW");
  });

  test("hides the overlay and removes fullscreen state", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl, text });

    overlays.showText("Test", { fullscreen: true });
    overlays.hide();

    expect(overlayEl.classList.contains("overlay-fullscreen")).toBe(false);
    expect(overlayEl.classList.contains("hidden")).toBe(true);
  });

  test("renders the start screen without a redundant start button", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl, text });

    overlays.showStartScreen();

    expect(overlayEl.innerHTML).toContain(text.startTitle);
    expect(overlayEl.innerHTML).toContain(text.startBody);
    expect(overlayEl.innerHTML).not.toContain("button");
  });

  test("renders the game over screen with a high score table", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl, text });

    overlays.showGameOverScreen(
      { score: 250, level: 5, clears: 30 },
      [
        { name: "AAA", score: 250, level: 5, gems: 30 },
        { name: "BBB", score: 100, level: 2, gems: 12 },
      ]
    );

    expect(overlayEl.innerHTML).toContain(text.gameOverTitle);
    expect(overlayEl.innerHTML).toContain("Score 250 / Level 5 / Gems 30");
    expect(overlayEl.innerHTML).toContain("<td>AAA</td>");
    expect(overlayEl.innerHTML).toContain("<td>BBB</td>");
  });

  test("renders the name entry screen and submits a normalized name", () => {
    const overlayEl = createOverlayEl();
    const input = createInputElement("abc");
    const saveButton = {
      listeners: {},
      addEventListener(type, handler) {
        this.listeners[type] = handler;
      },
      click() {
        this.listeners.click?.();
      },
    };
    const onSubmit = jest.fn();
    const normalizeName = jest.fn((value) => value.toUpperCase());
    global.document = {
      getElementById(id) {
        if (id === "high-score-name") {
          return input;
        }

        if (id === "save-high-score") {
          return saveButton;
        }

        return null;
      },
    };
    const overlays = createOverlayController({ overlayEl, text });

    overlays.showNameEntryScreen(
      { score: 999, level: 7, gems: 44 },
      {
        defaultName: "AAA",
        normalizeName,
        onSubmit,
      }
    );

    expect(overlayEl.innerHTML).toContain(text.nameEntryTitle);
    expect(input.focused).toBe(true);
    expect(input.selected).toBe(true);

    input.value = "ben";
    input.listeners.input?.();
    expect(input.value).toBe("BEN");

    const preventDefault = jest.fn();
    input.listeners.keydown?.({ code: "Enter", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("BEN");

    input.value = "sam";
    saveButton.click();
    expect(onSubmit).toHaveBeenLastCalledWith("SAM");
  });
});
