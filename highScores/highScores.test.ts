import { createHighScoreService } from "./highScores";

describe("high score service", () => {
  const text = {
    highScoreEmpty: "---",
    highScoreName: "AAA",
  };

  function createStorage() {
    const store = new Map();

    return {
      getItem(key: string) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      clear() {
        store.clear();
      },
    };
  }

  function createService() {
    return createHighScoreService({
      storageKey: "test-high-scores",
      maxEntries: 3,
      text,
    });
  }

  beforeEach(() => {
    global.window = { localStorage: createStorage() } as Window & typeof globalThis;
  });

  afterEach(() => {
    delete global.window;
  });

  test("normalizes names to uppercase alphanumeric text with a fallback", () => {
    const service = createService();

    expect(service.normalizeName(" ben!ja-min ")).toBe("BENJAMIN");
    expect(service.normalizeName("")).toBe("AAA");
  });

  test("saves, sorts, and truncates high scores", () => {
    const service = createService();

    service.save({ name: "ccc", score: 50, level: 2, gems: 10 });
    service.save({ name: "aaa", score: 200, level: 4, gems: 20 });
    service.save({ name: "bbb", score: 120, level: 3, gems: 12 });
    const filled = service.save({ name: "ddd", score: 75, level: 2, gems: 8 });

    expect(service.load()).toEqual([
      { name: "AAA", score: 200, level: 4, gems: 20 },
      { name: "BBB", score: 120, level: 3, gems: 12 },
      { name: "DDD", score: 75, level: 2, gems: 8 },
    ]);
    expect(filled).toHaveLength(3);
  });

  test("fills empty high score slots with placeholder rows", () => {
    const service = createService();

    const filled = service.fill([{ name: "AAA", score: 100, level: 2, gems: 9 }]);

    expect(filled).toEqual([
      { name: "AAA", score: 100, level: 2, gems: 9 },
      { name: "---", score: "---", level: "---", gems: "---" },
      { name: "---", score: "---", level: "---", gems: "---" },
    ]);
  });

  test("qualifies entries when the table has space or beats the lowest score", () => {
    const service = createService();
    const table = [
      { name: "AAA", score: 300, level: 5, gems: 30 },
      { name: "BBB", score: 200, level: 4, gems: 20 },
      { name: "CCC", score: 100, level: 3, gems: 10 },
    ];

    expect(service.qualifies({ score: 0, level: 1, gems: 1 }, table)).toBe(false);
    expect(service.qualifies({ score: 150, level: 2, gems: 6 }, table)).toBe(true);
    expect(service.qualifies({ score: 100, level: 4, gems: 10 }, table)).toBe(true);
    expect(service.qualifies({ score: 100, level: 3, gems: 9 }, table)).toBe(false);
    expect(service.qualifies({ score: 50, level: 1, gems: 1 }, table.slice(0, 2))).toBe(true);
  });

  test("loads gracefully when stored data is invalid", () => {
    const service = createService();
    global.window.localStorage.setItem("test-high-scores", "{bad json");

    expect(service.load()).toEqual([]);
  });
});
