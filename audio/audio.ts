import { AUDIO as AUDIO_CONSTANTS } from "../constants";

type AudioEnvelope = Array<[number, number]>;

type FilterConfig = {
  type: BiquadFilterType;
  frequency: number;
  q: number;
};

type SweepSoundConfig = {
  type: OscillatorType;
  startFrequency: number;
  endFrequency: number;
  rampTime: number;
  stopAfter: number;
  filter: FilterConfig;
  gain: AudioEnvelope;
};

type EnvelopeSoundConfig = {
  type: OscillatorType;
  frequencies: AudioEnvelope;
  stopAfter: number;
  gain: AudioEnvelope;
};

type FilteredEnvelopeSoundConfig = EnvelopeSoundConfig & {
  filter: FilterConfig;
};

type LevelUpNote = {
  frequency: number;
  start: number;
  duration: number;
  type: OscillatorType;
  frequencyMultiplier: number;
};

type LevelUpConfig = {
  masterGain: AudioEnvelope;
  notes: LevelUpNote[];
  noteAttack: number;
  notePeakGain: number;
  noteStopPadding: number;
};

type MusicNote = {
  beat: number;
  frequency: number;
  durationBeats: number;
};

type MusicSectionName = "A" | "B" | "C";

type MusicSection = {
  melody: MusicNote[];
  bass: MusicNote[];
};

type MusicConfig = {
  bpm: number;
  beatsPerBar: number;
  lookaheadMs: number;
  masterGain: number;
  melodyGain: number;
  bassGain: number;
  melodyType: OscillatorType;
  bassType: OscillatorType;
  sectionOrder: MusicSectionName[];
  sections: Record<MusicSectionName, MusicSection>;
};

type AudioConfig = {
  place: SweepSoundConfig;
  match: FilteredEnvelopeSoundConfig;
  bonusMatch: FilteredEnvelopeSoundConfig;
  rotate: EnvelopeSoundConfig;
  levelUp: LevelUpConfig;
  gameOver: LevelUpConfig;
  music: MusicConfig;
  alternateMusic: MusicConfig;
};

type AudioContextConstructor = new () => AudioContext;

type MusicState = {
  gainNode: GainNode;
  timeoutId: ReturnType<typeof setTimeout> | null;
  playing: boolean;
  sectionIndex: number;
  track: MusicConfig | null;
};

export type AudioModule = {
  playCascadeMatchSound: (pitchMultiplier?: number) => void;
  isMusicMuted: () => boolean;
  pauseGameplayMusic: () => void;
  playBonusMatchSound: () => void;
  playGameOverSound: () => void;
  playLevelUpSound: () => void;
  playMatchSound: () => void;
  playPlaceSound: () => void;
  playRotateSound: () => void;
  startGameplayMusic: () => void;
  stopGameplayMusic: () => void;
  toggleMusicMuted: () => boolean;
};

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

const AUDIO: AudioConfig = AUDIO_CONSTANTS as AudioConfig;
const AudioContextCtor: AudioContextConstructor | null =
  typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext || null : null;

let audioContext: AudioContext | null = null;
let musicState: MusicState | null = null;
let musicMuted = true;
let nextMusicTrackIndex = 0;

function ensureAudioContext(): AudioContext | null {
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

export function playPlaceSound(): void {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const config = AUDIO.place;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, now + config.rampTime);

  filter.type = config.filter.type;
  filter.frequency.setValueAtTime(config.filter.frequency, now);
  filter.Q.value = config.filter.q;

  applyGainEnvelope(gainNode.gain, now, config.gain);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + config.stopAfter);
}

export function playMatchSound(): void {
  playFilteredEnvelopeSound(AUDIO.match);
}

export function playBonusMatchSound(): void {
  playFilteredEnvelopeSound(AUDIO.bonusMatch);
}

export function playCascadeMatchSound(pitchMultiplier = 1.22): void {
  playFilteredEnvelopeSound(AUDIO.match, pitchMultiplier);
}

function playFilteredEnvelopeSound(
  config: FilteredEnvelopeSoundConfig,
  pitchMultiplier = 1
): void {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = config.type;
  applyFrequencyEnvelope(oscillator.frequency, now, config.frequencies, pitchMultiplier);

  filter.type = config.filter.type;
  filter.frequency.setValueAtTime(config.filter.frequency, now);
  filter.Q.value = config.filter.q;

  applyGainEnvelope(gainNode.gain, now, config.gain);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + config.stopAfter);
}

export function playRotateSound(): void {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const config = AUDIO.rotate;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = config.type;
  applyFrequencyEnvelope(oscillator.frequency, now, config.frequencies);

  applyGainEnvelope(gainNode.gain, now, config.gain);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + config.stopAfter);
}

export function playLevelUpSound(): void {
  playNoteSequence(AUDIO.levelUp);
}

export function playGameOverSound(): void {
  playNoteSequence(AUDIO.gameOver);
}

function playNoteSequence(config: LevelUpConfig): void {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const masterGain = context.createGain();

  applyGainEnvelope(masterGain.gain, now, config.masterGain);
  masterGain.connect(context.destination);

  config.notes.forEach(({ frequency, start, duration, type, frequencyMultiplier }) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    const noteStart = now + start;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * frequencyMultiplier,
      noteStart + duration
    );

    noteGain.gain.setValueAtTime(0.0001, noteStart);
    noteGain.gain.exponentialRampToValueAtTime(config.notePeakGain, noteStart + config.noteAttack);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

    oscillator.connect(noteGain);
    noteGain.connect(masterGain);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + duration + config.noteStopPadding);
  });
}

export function startGameplayMusic(): void {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  if (!musicState) {
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.connect(context.destination);
    musicState = {
      gainNode,
      timeoutId: null,
      playing: false,
      sectionIndex: 0,
      track: null,
    };
  }

  if (musicState.playing) {
    return;
  }

  musicState.playing = true;
  if (!musicState.track) {
    musicState.track = getNextMusicTrack();
  }
  musicState.sectionIndex = 0;
  const now = context.currentTime;
  musicState.gainNode.gain.cancelScheduledValues(now);
  musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 0.0001), now);
  musicState.gainNode.gain.exponentialRampToValueAtTime(getMusicTargetGain(), now + 0.12);
  scheduleMusicSection(now + 0.02);
}

export function pauseGameplayMusic(): void {
  if (!musicState?.playing || !audioContext) {
    return;
  }

  musicState.playing = false;
  clearTimeout(musicState.timeoutId ?? undefined);
  musicState.timeoutId = null;
  const now = audioContext.currentTime;
  musicState.gainNode.gain.cancelScheduledValues(now);
  musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 0.0001), now);
  musicState.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
}

export function stopGameplayMusic(): void {
  pauseGameplayMusic();
  if (musicState) {
    musicState.track = null;
    musicState.sectionIndex = 0;
  }
}

export function toggleMusicMuted(): boolean {
  const context = ensureAudioContext();
  musicMuted = !musicMuted;

  if (musicState && context) {
    const now = context.currentTime;
    musicState.gainNode.gain.cancelScheduledValues(now);
    musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 0.0001), now);
    musicState.gainNode.gain.exponentialRampToValueAtTime(getMusicTargetGain(), now + 0.08);
  }

  return musicMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}

function scheduleMusicSection(startTime: number): void {
  if (!musicState?.playing || !audioContext || !musicState.track) {
    return;
  }

  const track = musicState.track;
  const sectionName = track.sectionOrder[musicState.sectionIndex];
  const section = track.sections[sectionName];
  const secondsPerBeat = 60 / track.bpm;
  scheduleTrackNotes(
    section.melody,
    track.melodyType,
    track.melodyGain,
    startTime,
    secondsPerBeat
  );
  scheduleTrackNotes(
    section.bass,
    track.bassType,
    track.bassGain,
    startTime,
    secondsPerBeat
  );

  const barDurationMs = secondsPerBeat * track.beatsPerBar * 1000;
  musicState.sectionIndex = (musicState.sectionIndex + 1) % track.sectionOrder.length;
  musicState.timeoutId = setTimeout(() => {
    if (!audioContext) {
      return;
    }

    scheduleMusicSection(audioContext.currentTime + track.lookaheadMs / 1000);
  }, Math.max(0, barDurationMs - track.lookaheadMs));
}

function getNextMusicTrack(): MusicConfig {
  const tracks = [AUDIO.music, AUDIO.alternateMusic];
  const track = tracks[nextMusicTrackIndex % tracks.length] ?? AUDIO.music;
  nextMusicTrackIndex = (nextMusicTrackIndex + 1) % tracks.length;
  return track;
}

function scheduleTrackNotes(
  notes: MusicNote[],
  type: OscillatorType,
  peakGain: number,
  startTime: number,
  secondsPerBeat: number
): void {
  if (!audioContext || !musicState) {
    return;
  }

  const context = audioContext;
  const activeMusicState = musicState;

  notes.forEach(({ beat, frequency, durationBeats }) => {
    const noteStart = startTime + beat * secondsPerBeat;
    const noteDuration = durationBeats * secondsPerBeat;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, noteStart);

    gainNode.gain.setValueAtTime(0.0001, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

    oscillator.connect(gainNode);
    gainNode.connect(activeMusicState.gainNode);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + noteDuration + 0.02);
  });
}

function applyFrequencyEnvelope(
  audioParam: AudioParam,
  startTime: number,
  values: AudioEnvelope,
  pitchMultiplier = 1
): void {
  values.forEach(([offset, value], index) => {
    if (index === 0) {
      audioParam.setValueAtTime(value * pitchMultiplier, startTime + offset);
    } else {
      audioParam.exponentialRampToValueAtTime(value * pitchMultiplier, startTime + offset);
    }
  });
}

function applyGainEnvelope(audioParam: AudioParam, startTime: number, values: AudioEnvelope): void {
  values.forEach(([offset, value], index) => {
    if (index === 0) {
      audioParam.setValueAtTime(value, startTime + offset);
    } else {
      audioParam.exponentialRampToValueAtTime(value, startTime + offset);
    }
  });
}

function getMusicTargetGain(): number {
  return musicMuted ? 0.0001 : AUDIO.music.masterGain;
}
