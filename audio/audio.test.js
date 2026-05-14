describe("audio", () => {
  function createMockParam(initialValue = 0.0001) {
    return {
      value: initialValue,
      setValueAtTime: jest.fn(function setValueAtTime(value) {
        this.value = value;
      }),
      exponentialRampToValueAtTime: jest.fn(function exponentialRampToValueAtTime(value) {
        this.value = value;
      }),
      cancelScheduledValues: jest.fn(),
    };
  }

  function createMockAudioContext({ state = "running" } = {}) {
    const context = {
      currentTime: 10,
      state,
      destination: {},
      oscillators: [],
      gains: [],
      filters: [],
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => {
        const oscillator = {
          type: "sine",
          frequency: createMockParam(),
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        };
        context.oscillators.push(oscillator);
        return oscillator;
      }),
      createGain: jest.fn(() => {
        const gainNode = {
          gain: createMockParam(),
          connect: jest.fn(),
        };
        context.gains.push(gainNode);
        return gainNode;
      }),
      createBiquadFilter: jest.fn(() => {
        const filter = {
          type: "lowpass",
          frequency: createMockParam(),
          Q: { value: 0 },
          connect: jest.fn(),
        };
        context.filters.push(filter);
        return filter;
      }),
    };

    return context;
  }

  function loadAudioModule(windowValue) {
    jest.resetModules();
    if (windowValue) {
      global.window = windowValue;
    } else {
      delete global.window;
    }

    return require("./audio");
  }

  afterEach(() => {
    delete global.window;
    jest.restoreAllMocks();
  });

  test("starts with music muted and toggles without an audio context", () => {
    const audio = loadAudioModule(null);

    expect(audio.isMusicMuted()).toBe(true);
    expect(audio.toggleMusicMuted()).toBe(false);
    expect(audio.isMusicMuted()).toBe(false);
    expect(audio.toggleMusicMuted()).toBe(true);
  });

  test("starts gameplay music with a mocked audio context and updates mute gain", () => {
    const mockContext = createMockAudioContext({ state: "suspended" });
    const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockReturnValue(123);
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.startGameplayMusic();

    expect(global.window.AudioContext).toHaveBeenCalledTimes(1);
    expect(mockContext.resume).toHaveBeenCalledTimes(1);
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

    const masterGain = mockContext.gains[0];
    expect(masterGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.12);

    audio.toggleMusicMuted();
    expect(audio.isMusicMuted()).toBe(false);
    expect(masterGain.gain.exponentialRampToValueAtTime).toHaveBeenLastCalledWith(0.028, 10.08);
  });

  test("pause and stop gameplay music are safe after starting music", () => {
    const mockContext = createMockAudioContext();
    jest.spyOn(global, "setTimeout").mockReturnValue(321);
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.startGameplayMusic();
    audio.pauseGameplayMusic();
    audio.stopGameplayMusic();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(321);
    expect(mockContext.gains[0].gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.0001,
      10.08
    );
  });

  test("gameplay music alternates between the base and alternate songs", () => {
    const mockContext = createMockAudioContext();
    jest.spyOn(global, "setTimeout").mockReturnValue(456);
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.startGameplayMusic();
    audio.stopGameplayMusic();
    audio.startGameplayMusic();

    expect(mockContext.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 10.02);
    expect(mockContext.oscillators[12].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 10.02);
  });

  test("playPlaceSound creates oscillator, filter, and gain envelope", () => {
    const mockContext = createMockAudioContext();
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.playPlaceSound();

    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockContext.createGain).toHaveBeenCalledTimes(1);
    expect(mockContext.createBiquadFilter).toHaveBeenCalledTimes(1);

    const oscillator = mockContext.oscillators[0];
    const filter = mockContext.filters[0];
    const gainNode = mockContext.gains[0];

    expect(oscillator.start).toHaveBeenCalledWith(10);
    expect(oscillator.stop).toHaveBeenCalledWith(10.13);
    expect(filter.type).toBe("lowpass");
    expect(filter.Q.value).toBe(2);
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalled();
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
  });

  test("playBonusMatchSound uses the alternate match envelope", () => {
    const mockContext = createMockAudioContext();
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.playBonusMatchSound();

    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockContext.createGain).toHaveBeenCalledTimes(1);
    expect(mockContext.createBiquadFilter).toHaveBeenCalledTimes(1);

    const oscillator = mockContext.oscillators[0];
    const filter = mockContext.filters[0];

    expect(oscillator.stop).toHaveBeenCalledWith(10.2);
    expect(filter.type).toBe("bandpass");
    expect(filter.Q.value).toBe(4);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(763.29, 10);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenNthCalledWith(1, 1099.99, 10.05);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenNthCalledWith(2, 1481.98, 10.11);
  });

  test("playCascadeMatchSound raises the match frequencies", () => {
    const mockContext = createMockAudioContext();
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.playCascadeMatchSound(1.3);

    const oscillator = mockContext.oscillators[0];
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(884, 10);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenNthCalledWith(1, 1274, 10.06);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenNthCalledWith(2, 1716, 10.14);
  });

  test("playGameOverSound plays a short descending melody", () => {
    const mockContext = createMockAudioContext();
    const audio = loadAudioModule({ AudioContext: jest.fn(() => mockContext) });

    audio.playGameOverSound();

    expect(mockContext.createOscillator).toHaveBeenCalledTimes(4);
    expect(mockContext.createGain).toHaveBeenCalledTimes(5);

    const [first, second, third, fourth] = mockContext.oscillators;
    expect(first.frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 10);
    expect(first.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(507.5525, 10.24);
    expect(second.frequency.setValueAtTime).toHaveBeenCalledWith(392, 10.22);
    expect(second.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(378.28, 10.46);
    expect(third.frequency.setValueAtTime).toHaveBeenCalledWith(329.63, 10.48);
    expect(third.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(316.4448, 10.700000000000001);
    expect(fourth.frequency.setValueAtTime).toHaveBeenCalledWith(261.63, 10.74);
    expect(fourth.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(249.85664999999997, 11.040000000000001);
    expect(fourth.stop).toHaveBeenCalledWith(11.07);
  });
});
