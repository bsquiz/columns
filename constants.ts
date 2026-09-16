export const BOARD = {
  cols: 6,
  rows: 13,
  spawnRow: -2,
  spawnColRatio: 0.5,
  magicColor: "#fff07a",
  magicWeight: 0.35,
  colors: ["#ff5d8f", "#55f7ff", "#ffd166", "#7bff87", "#a883ff", "#ff8c42", "#fff07a"],
};

export const GAME = {
  scoring: {
    hardDropPerCell: 2,
    softDropPerCell: 1,
    clearedGemPoints: 25,
    bonusGemPoints: 15,
    cascadeBonusPoints: 20,
  },
  timing: {
    matchFlashMs: 260,
    minDropIntervalMs: 160,
    dropIntervalStartMs: 820,
    dropIntervalLevelStepMs: 65,
    gameOverFillDurationMs: 1000,
    highScoreSaveDelayMs: 300,
  },
  progression: {
    levelDurationMs: 60000,
  },
  highScores: {
    storageKey: "columns-gameboy-high-scores",
    maxEntries: 5,
  },
  text: {
    startTitle: "GEM COLUMNS",
    startBody:
      "Line up falling gems in rows, columns, and diagonals of three or more. Diamond wildcard gems match with any color.",
    startHint: "Press Enter or Space to begin",
    nameEntryTitle: "NEW HIGH SCORE",
    nameEntryBody: "Enter your name",
    nameEntryButton: "Save Score",
    savingHighScoreTitle: "SAVING SCORE",
    savingHighScoreBody: "Updating records...",
    gameOverTitle: "GAME OVER",
    gameOverSubtitle: "Top Scores",
    gameOverHint: "Press R to play again",
    highScoreName: "AAA",
    highScoreEmpty: "---",
    paused: "PAUSED\n\nPress P to resume",
  },
};

export const UI = {
  previewGemGradient:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), {{color}} 45%, rgba(0,0,0,0.28) 100%)",
};

export const GRAPHICS = {
  backgroundGradient: {
    start: "#0b1730",
    end: "#190c25",
  },
  boardFrame: {
    outerInset: 4,
    outerRadius: 20,
    outerWidth: 6,
    outerStroke: "rgba(248, 214, 108, 0.65)",
    innerInset: 12,
    innerRadius: 14,
    innerWidth: 2,
    innerStroke: "rgba(255, 255, 255, 0.18)",
    cornerInset: 18,
    cornerSize: 18,
    cornerControl: 6,
    cornerFill: "rgba(255, 214, 102, 0.7)",
  },
  grid: {
    stroke: "rgba(255, 255, 255, 0.08)",
    lineWidth: 1,
  },
  gem: {
    pulseBase: 0.35,
    pulseVariance: 0.15,
    pulseSpeedDivisor: 60,
    rectInset: 6,
    rectRadius: 14,
    gradient: {
      innerXRatio: 0.28,
      innerYRatio: 0.22,
      innerRadiusMultiplier: 4,
      outerXRatio: 0.5,
      outerYRatio: 0.5,
      outerRadiusRatio: 0.7,
      stops: [
        [0, "rgba(255,255,255,0.92)"],
        [0.26, "{{color}}"],
        [1, "rgba(0,0,0,0.26)"],
      ],
    },
    stroke: {
      color: "rgba(255,255,255,0.36)",
      width: 2.5,
    },
    facets: [
      {
        points: [
          [0.28, 0.18],
          [0.54, 0.34],
          [0.34, 0.56],
        ],
        fill: "rgba(255, 255, 255, 0.23)",
      },
      {
        points: [
          [0.68, 0.24],
          [0.8, 0.42],
          [0.63, 0.52],
        ],
        fill: "rgba(255, 250, 220, 0.18)",
      },
    ],
  },
};

export const AUDIO = {
  place: {
    type: "triangle",
    startFrequency: 520,
    endFrequency: 240,
    rampTime: 0.08,
    stopAfter: 0.13,
    filter: { type: "lowpass", frequency: 1400, q: 2 },
    gain: [
      [0, 0.0001],
      [0.01, 0.08],
      [0.12, 0.0001],
    ],
  },
  match: {
    type: "sine",
    frequencies: [
      [0, 680],
      [0.06, 980],
      [0.14, 1320],
    ],
    stopAfter: 0.17,
    filter: { type: "bandpass", frequency: 1200, q: 3 },
    gain: [
      [0, 0.0001],
      [0.01, 0.06],
      [0.09, 0.02],
      [0.16, 0.0001],
    ],
  },
  bonusMatch: {
    type: "triangle",
    frequencies: [
      [0, 763.29],
      [0.05, 1099.99],
      [0.11, 1481.98],
    ],
    stopAfter: 0.2,
    filter: { type: "bandpass", frequency: 1500, q: 4 },
    gain: [
      [0, 0.0001],
      [0.01, 0.075],
      [0.08, 0.04],
      [0.19, 0.0001],
    ],
  },
  rotate: {
    type: "square",
    frequencies: [
      [0, 760],
      [0.035, 1040],
    ],
    stopAfter: 0.07,
    gain: [
      [0, 0.0001],
      [0.008, 0.035],
      [0.06, 0.0001],
    ],
  },
  levelUp: {
    masterGain: [
      [0, 0.0001],
      [0.02, 0.07],
      [0.42, 0.0001],
    ],
    notes: [
      { frequency: 660, start: 0, duration: 0.1, type: "triangle", frequencyMultiplier: 1.06 },
      { frequency: 880, start: 0.08, duration: 0.1, type: "triangle", frequencyMultiplier: 1.06 },
      { frequency: 1320, start: 0.16, duration: 0.18, type: "sine", frequencyMultiplier: 1.06 },
    ],
    noteAttack: 0.015,
    notePeakGain: 0.9,
    noteStopPadding: 0.02,
  },
  gameOver: {
    masterGain: [
      [0, 0.0001],
      [0.03, 0.055],
      [1.08, 0.055],
      [1.18, 0.0001],
    ],
    notes: [
      { frequency: 523.25, start: 0, duration: 0.24, type: "triangle", frequencyMultiplier: 0.97 },
      { frequency: 392.0, start: 0.22, duration: 0.24, type: "triangle", frequencyMultiplier: 0.965 },
      { frequency: 329.63, start: 0.48, duration: 0.22, type: "sine", frequencyMultiplier: 0.96 },
      { frequency: 261.63, start: 0.74, duration: 0.3, type: "sine", frequencyMultiplier: 0.955 },
    ],
    noteAttack: 0.02,
    notePeakGain: 0.75,
    noteStopPadding: 0.03,
  },
  music: {
    bpm: 116,
    beatsPerBar: 8,
    lookaheadMs: 80,
    masterGain: 0.028,
    melodyGain: 0.75,
    bassGain: 0.5,
    melodyType: "triangle",
    bassType: "sine",
    sectionOrder: ["A", "B", "C"],

sections: {
  A: {
    melody: [
      { beat: 0, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 0.5, frequency: 739.99, durationBeats: 0.5 }, // F#5
      { beat: 1, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 1.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 2, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 2.5, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 3, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 3.5, frequency: 587.33, durationBeats: 0.5 }, // D5

      { beat: 4, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 4.5, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 5, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 5.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 6, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 6.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 7, frequency: 830.61, durationBeats: 0.5 }, // G#5
      { beat: 7.5, frequency: 880.0, durationBeats: 0.5 }, // A5
    ],
    bass: [
      { beat: 0, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 1, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 2, frequency: 130.81, durationBeats: 1 }, // C3
      { beat: 3, frequency: 123.47, durationBeats: 1 }, // B2
      { beat: 4, frequency: 110.0, durationBeats: 1 }, // A2
      { beat: 5, frequency: 123.47, durationBeats: 1 }, // B2
      { beat: 6, frequency: 130.81, durationBeats: 1 }, // C3
      { beat: 7, frequency: 146.83, durationBeats: 1 }, // D3
    ],
  },

  B: {
    melody: [
      { beat: 0, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 0.5, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 1, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 1.5, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 2, frequency: 880.0, durationBeats: 1 }, // A5
      { beat: 3, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 3.5, frequency: 739.99, durationBeats: 0.5 }, // F#5

      { beat: 4, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 4.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 5.5, frequency: 1046.5, durationBeats: 0.5 }, // C6
      { beat: 6, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 6.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 7, frequency: 830.61, durationBeats: 0.5 }, // G#5
      { beat: 7.5, frequency: 880.0, durationBeats: 0.5 }, // A5
    ],
    bass: [
      { beat: 0, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 1, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 2, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 3, frequency: 185.0, durationBeats: 1 }, // F#3
      { beat: 4, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 5, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 6, frequency: 123.47, durationBeats: 1 }, // B2
      { beat: 7, frequency: 110.0, durationBeats: 1 }, // A2
    ],
  },

  C: {
    melody: [
      { beat: 0, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 0.5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 1, frequency: 1046.5, durationBeats: 0.5 }, // C6
      { beat: 1.5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 2, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 2.5, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 3, frequency: 698.46, durationBeats: 1 }, // F5

      { beat: 4, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 4.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 5.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 6, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 6.5, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 7, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 7.5, frequency: 587.33, durationBeats: 0.5 }, // D5
    ],
    bass: [
      { beat: 0, frequency: 220.0, durationBeats: 1 }, // A3
      { beat: 1, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 2, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 3, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 4, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 5, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 6, frequency: 185.0, durationBeats: 1 }, // F#3
      { beat: 7, frequency: 196.0, durationBeats: 1 }, // G3
    ],
  },
},

  },
  alternateMusic: {
    bpm: 116,
    beatsPerBar: 8,
    lookaheadMs: 80,
    masterGain: 0.028,
    melodyGain: 0.72,
    bassGain: 0.52,
    melodyType: "triangle",
    bassType: "sine",
    sectionOrder: ["A", "B", "C"],

sections: {
  A: {
    melody: [
      { beat: 0, frequency: 523.25, durationBeats: 0.5 }, // C5
      { beat: 0.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 1, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 1.5, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 2, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 2.5, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 3, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 3.5, frequency: 587.33, durationBeats: 0.5 }, // D5

      { beat: 4, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 4.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 5, frequency: 523.25, durationBeats: 0.5 }, // C5
      { beat: 5.5, frequency: 493.88, durationBeats: 0.5 }, // B4
      { beat: 6, frequency: 523.25, durationBeats: 0.5 }, // C5
      { beat: 6.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 7, frequency: 493.88, durationBeats: 0.5 }, // B4
      { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }, // C5
    ],
    bass: [
      { beat: 0, frequency: 130.81, durationBeats: 1 }, // C3
      { beat: 1, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 2, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 3, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 4, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 5, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 6, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 7, frequency: 130.81, durationBeats: 1 }, // C3
    ],
  },

  B: {
    melody: [
      { beat: 0, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 0.5, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 1, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 1.5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 2, frequency: 1046.5, durationBeats: 0.5 }, // C6
      { beat: 2.5, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 3, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 3.5, frequency: 783.99, durationBeats: 0.5 }, // G5

      { beat: 4, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 4.5, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 5.5, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 6, frequency: 698.46, durationBeats: 0.5 }, // F5
      { beat: 6.5, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 7, frequency: 493.88, durationBeats: 0.5 }, // B4
      { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }, // C5
    ],
    bass: [
      { beat: 0, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 1, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 2, frequency: 220.0, durationBeats: 1 }, // A3
      { beat: 3, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 4, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 5, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 6, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 7, frequency: 130.81, durationBeats: 1 }, // C3
    ],
  },

  C: {
    melody: [
      { beat: 0, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 0.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 1, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 1.5, frequency: 1046.5, durationBeats: 0.5 }, // C6
      { beat: 2, frequency: 987.77, durationBeats: 0.5 }, // B5
      { beat: 2.5, frequency: 880.0, durationBeats: 0.5 }, // A5
      { beat: 3, frequency: 783.99, durationBeats: 0.5 }, // G5
      { beat: 3.5, frequency: 698.46, durationBeats: 0.5 }, // F5

      { beat: 4, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 4.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 5, frequency: 523.25, durationBeats: 0.5 }, // C5
      { beat: 5.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 6, frequency: 659.25, durationBeats: 0.5 }, // E5
      { beat: 6.5, frequency: 587.33, durationBeats: 0.5 }, // D5
      { beat: 7, frequency: 493.88, durationBeats: 0.5 }, // B4
      { beat: 7.5, frequency: 523.25, durationBeats: 0.5 }, // C5
    ],
    bass: [
      { beat: 0, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 1, frequency: 220.0, durationBeats: 1 }, // A3
      { beat: 2, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 3, frequency: 174.61, durationBeats: 1 }, // F3
      { beat: 4, frequency: 164.81, durationBeats: 1 }, // E3
      { beat: 5, frequency: 146.83, durationBeats: 1 }, // D3
      { beat: 6, frequency: 196.0, durationBeats: 1 }, // G3
      { beat: 7, frequency: 130.81, durationBeats: 1 }, // C3
    ],
  },
},
  },
};
