import { createOverlayController } from "./overlays";

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
    savingHighScoreTitle: "SAVING SCORE",
    savingHighScoreBody: "Updating records...",
  };

  function createClassList(initial: string[] = []) {
    const classes = new Set(initial);

    return {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      },
      toggle(name: string, force?: boolean) {
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
      contains(name: string) {
        return classes.has(name);
      },
    };
  }

  function createInputElement(value = "") {
    return {
      value,
      listeners: {} as Record<string, (event?: { code?: string; preventDefault?: () => void }) => void>,
      focused: false,
      selected: false,
      addEventListener(type: string, handler: (event?: { code?: string; preventDefault?: () => void }) => void) {
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
    const overlays = createOverlayController({ overlayEl: overlayEl as never, text });

    overlays.showText("PAUSED\nNOW", { fullscreen: true });

    expect(overlayEl.classList.contains("overlay-fullscreen")).toBe(true);
    expect(overlayEl.classList.contains("hidden")).toBe(false);
    expect(overlayEl.innerHTML).toContain("PAUSED<br />NOW");
  });

  test("hides the overlay and removes fullscreen state", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl: overlayEl as never, text });

    overlays.showText("Test", { fullscreen: true });
    overlays.hide();

    expect(overlayEl.classList.contains("overlay-fullscreen")).toBe(false);
    expect(overlayEl.classList.contains("hidden")).toBe(true);
  });

  test("renders the start screen without a redundant start button", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl: overlayEl as never, text });

    overlays.showStartScreen();

    expect(overlayEl.innerHTML).toContain(text.startTitle);
    expect(overlayEl.innerHTML).toContain(text.startBody);
    expect(overlayEl.innerHTML).not.toContain("button");
  });

  test("renders the game over screen with a high score table", () => {
    const overlayEl = createOverlayEl();
    const overlays = createOverlayController({ overlayEl: overlayEl as never, text });

    overlays.showGameOverScreen(
      { score: 250, level: 5, clears: 30 } as never,
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
      listeners: {} as Record<string, () => void>,
      addEventListener(type: string, handler: () => void) {
        this.listeners[type] = handler;
      },
      click() {
        this.listeners.click?.();
      },
    };
    const onSubmit = jest.fn();
    const normalizeName = jest.fn((value) => value.toUpperCase());
    global.document = {
      getElementById(id: string) {
        if (id === "high-score-name") {
          return input;
        }

        if (id === "save-high-score") {
          return saveButton;
        }

        return null;
      },
    } as Document;
    const overlays = createOverlayController({ overlayEl: overlayEl as never, text });

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
