import type { HighScoreEntry, HighScoreRow } from "../runtime-types";

type HighScoreText = {
  highScoreEmpty: string;
  highScoreName: string;
};

type HighScoreServiceConfig = {
  storageKey: string;
  maxEntries: number;
  text: HighScoreText;
};

export type HighScoreService = {
  fill: (highScores: HighScoreEntry[]) => HighScoreRow[];
  load: () => HighScoreEntry[];
  normalizeName: (name?: string) => string;
  qualifies: (entry: HighScoreEntry, highScores: HighScoreEntry[]) => boolean;
  save: (entry: HighScoreEntry) => HighScoreRow[];
};

type StoredHighScoreEntry = Partial<Record<keyof HighScoreEntry, unknown>>;

export function createHighScoreService(config: HighScoreServiceConfig): HighScoreService {
  const { storageKey, maxEntries, text } = config;

  function save(entry: HighScoreEntry): HighScoreRow[] {
    const highScores = load();
    highScores.push({
      name: normalizeName(entry.name),
      score: entry.score,
      level: entry.level,
      gems: entry.gems,
    });
    highScores.sort((a, b) => b.score - a.score || b.level - a.level || b.gems - a.gems);
    const nextHighScores = highScores.slice(0, maxEntries);
    persist(nextHighScores);
    return fill(nextHighScores);
  }

  function load(): HighScoreEntry[] {
    try {
      const raw = window.localStorage?.getItem(storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalizeStoredEntry).slice(0, maxEntries);
    } catch {
      return [];
    }
  }

  function persist(highScores: HighScoreEntry[]): void {
    try {
      window.localStorage?.setItem(storageKey, JSON.stringify(highScores));
    } catch {
      // Ignore storage failures and keep the table session-local.
    }
  }

  function fill(highScores: HighScoreEntry[]): HighScoreRow[] {
    const filled: HighScoreRow[] = highScores.map((entry) => ({
      name: normalizeName(entry.name),
      score: entry.score,
      level: entry.level,
      gems: entry.gems,
    }));

    while (filled.length < maxEntries) {
      filled.push({
        name: text.highScoreEmpty,
        score: text.highScoreEmpty,
        level: text.highScoreEmpty,
        gems: text.highScoreEmpty,
      });
    }

    return filled;
  }

  function qualifies(entry: HighScoreEntry, highScores: HighScoreEntry[]): boolean {
    if (entry.score <= 0) {
      return false;
    }

    if (highScores.length < maxEntries) {
      return true;
    }

    const lowestEntry = [...highScores].sort(
      (a, b) => a.score - b.score || a.level - b.level || a.gems - b.gems
    )[0];

    if (!lowestEntry) {
      return true;
    }

    return (
      entry.score > lowestEntry.score ||
      (entry.score === lowestEntry.score && entry.level > lowestEntry.level) ||
      (entry.score === lowestEntry.score &&
        entry.level === lowestEntry.level &&
        entry.gems > lowestEntry.gems)
    );
  }

  function normalizeName(name?: string): string {
    return (
      (name || "")
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, "")
        .trim()
        .slice(0, 8) || text.highScoreName
    );
  }

  function normalizeStoredEntry(entry: StoredHighScoreEntry): HighScoreEntry {
    return {
      name: normalizeName(typeof entry.name === "string" ? entry.name : undefined),
      score: Number(entry.score) || 0,
      level: Number(entry.level) || 0,
      gems: Number(entry.gems) || 0,
    };
  }

  return {
    fill,
    load,
    normalizeName,
    qualifies,
    save,
  };
}
