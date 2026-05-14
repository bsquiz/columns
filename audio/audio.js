const { AUDIO } =
  typeof require === "function" ? require("../constants") : globalThis.ColumnsConstants;
const AudioContextCtor =
  typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
let audioContext = null;
let musicState = null;
let musicMuted = true;
let nextMusicTrackIndex = 0;

function ensureAudioContext() {
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

function playPlaceSound() {
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

function playMatchSound() {
  playFilteredEnvelopeSound(AUDIO.match);
}

function playBonusMatchSound() {
  playFilteredEnvelopeSound(AUDIO.bonusMatch);
}

function playCascadeMatchSound(pitchMultiplier = 1.22) {
  playFilteredEnvelopeSound(AUDIO.match, pitchMultiplier);
}

function playFilteredEnvelopeSound(config, pitchMultiplier = 1) {
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

function playRotateSound() {
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

function playLevelUpSound() {
  playNoteSequence(AUDIO.levelUp);
}

function playGameOverSound() {
  playNoteSequence(AUDIO.gameOver);
}

function playNoteSequence(config) {
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

function startGameplayMusic() {
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

function pauseGameplayMusic() {
  if (!musicState?.playing || !audioContext) {
    return;
  }

  musicState.playing = false;
  clearTimeout(musicState.timeoutId);
  musicState.timeoutId = null;
  const now = audioContext.currentTime;
  musicState.gainNode.gain.cancelScheduledValues(now);
  musicState.gainNode.gain.setValueAtTime(Math.max(musicState.gainNode.gain.value, 0.0001), now);
  musicState.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
}

function stopGameplayMusic() {
  pauseGameplayMusic();
  if (musicState) {
    musicState.track = null;
    musicState.sectionIndex = 0;
  }
}

function toggleMusicMuted() {
  const context = ensureAudioContext();
  musicMuted = !musicMuted;

  if (musicState && context) {
    const now = context.currentTime;
    musicState.gainNode.gain.cancelScheduledValues(now);
    musicState.gainNode.gain.setValueAtTime(
      Math.max(musicState.gainNode.gain.value, 0.0001),
      now
    );
    musicState.gainNode.gain.exponentialRampToValueAtTime(getMusicTargetGain(), now + 0.08);
  }

  return musicMuted;
}

function isMusicMuted() {
  return musicMuted;
}

function scheduleMusicSection(startTime) {
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
    scheduleMusicSection(audioContext.currentTime + track.lookaheadMs / 1000);
  }, Math.max(0, barDurationMs - track.lookaheadMs));
}

function getNextMusicTrack() {
  const tracks = [AUDIO.music, AUDIO.alternateMusic];
  const track = tracks[nextMusicTrackIndex % tracks.length] || AUDIO.music;
  nextMusicTrackIndex = (nextMusicTrackIndex + 1) % tracks.length;
  return track;
}

function scheduleTrackNotes(notes, type, peakGain, startTime, secondsPerBeat) {
  notes.forEach(({ beat, frequency, durationBeats }) => {
    const noteStart = startTime + beat * secondsPerBeat;
    const noteDuration = durationBeats * secondsPerBeat;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, noteStart);

    gainNode.gain.setValueAtTime(0.0001, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

    oscillator.connect(gainNode);
    gainNode.connect(musicState.gainNode);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + noteDuration + 0.02);
  });
}

function applyFrequencyEnvelope(audioParam, startTime, values, pitchMultiplier = 1) {
  values.forEach(([offset, value], index) => {
    if (index === 0) {
      audioParam.setValueAtTime(value * pitchMultiplier, startTime + offset);
    } else {
      audioParam.exponentialRampToValueAtTime(value * pitchMultiplier, startTime + offset);
    }
  });
}

function applyGainEnvelope(audioParam, startTime, values) {
  values.forEach(([offset, value], index) => {
    if (index === 0) {
      audioParam.setValueAtTime(value, startTime + offset);
    } else {
      audioParam.exponentialRampToValueAtTime(value, startTime + offset);
    }
  });
}

function getMusicTargetGain() {
  return musicMuted ? 0.0001 : AUDIO.music.masterGain;
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    isMusicMuted,
    pauseGameplayMusic,
    playBonusMatchSound,
    playCascadeMatchSound,
    playGameOverSound,
    playLevelUpSound,
    playMatchSound,
    playPlaceSound,
    playRotateSound,
    startGameplayMusic,
    stopGameplayMusic,
    toggleMusicMuted,
  };
} else if (typeof globalThis !== "undefined") {
  globalThis.ColumnsAudio = {
    isMusicMuted,
    pauseGameplayMusic,
    playBonusMatchSound,
    playCascadeMatchSound,
    playGameOverSound,
    playLevelUpSound,
    playMatchSound,
    playPlaceSound,
    playRotateSound,
    startGameplayMusic,
    stopGameplayMusic,
    toggleMusicMuted,
  };
}
