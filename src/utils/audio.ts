// Premium Web Audio API Sound Engine & Sweet Acoustic Piano Synthesizer for 3 Patti Pearl Dragon Tiger
// Features:
// 1. "پیاری سی پیانو میوزک" - Sweet, soothing acoustic grand piano background music (lush romantic piano chords + melodic right-hand arpeggios + warm wooden body resonance)
// 2. "ٹائیگر اور ڈریگن روار ساؤنڈز" - Authentic, ferocious Tiger roar and mythical Dragon roar with chest vibrations and vocal rasp
// 3. Crisp ceramic chip clicks ("چھن")
// 4. Casino announcement chimes, card swooshes, and coin cascade fanfares

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmInterval: any = null;
  private bgmStep: number = 0;
  private bgmVolume: number = 0.11; // Warm, sweet, clear lounge music level

  private lastChipTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.initContext();
        if (this.isBgmPlaying && !this.isMuted) {
          this.startSynthesizedPianoBGM();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('click', unlock, { once: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
          this.bgmGain.connect(this.masterGain);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
          this.sfxGain.connect(this.masterGain);
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  public setBGMVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public getBGMVolume(): number {
    return this.bgmVolume;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      }
      this.stopBGM();
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
      this.startBGM();
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // =========================================================================
  // 1. SWEET ACOUSTIC PIANO BACKGROUND MUSIC ("پیاری سی پیانو میوزک")
  // Realistic physical piano modeling:
  // - Felt hammer attack transient (percussive impulse)
  // - Dual detuned acoustic string oscillators (fundamental + 2nd + 3rd harmonics)
  // - Soundboard warm wood resonance filter (warm logarithmic decay)
  // =========================================================================

  private playPianoNote(freq: number, startTime: number, duration: number, gainLevel: number = 0.035) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;

    // 1. String fundamental (warm triangle wave)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // 2. Second harmonic for piano string brilliance (sine wave slightly detuned for chorus richness)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0015, startTime);

    // 3. Hammer impulse transient (high percussive pop that mimics the felt hammer striking steel wire)
    const hammerOsc = this.ctx.createOscillator();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(freq * 4.5, startTime);
    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(gainLevel * 0.45, startTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.015);

    // Wood soundboard filter (warm low-pass filter)
    const pianoFilter = this.ctx.createBiquadFilter();
    pianoFilter.type = 'lowpass';
    pianoFilter.frequency.setValueAtTime(1600, startTime);
    pianoFilter.Q.setValueAtTime(1.1, startTime);

    // Dynamic piano envelope (rapid attack 4ms, natural exponential ring out)
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.006);
    noteGain.gain.exponentialRampToValueAtTime(gainLevel * 0.45, startTime + 0.22);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Routing
    osc1.connect(pianoFilter);
    osc2.connect(pianoFilter);
    hammerOsc.connect(hammerGain);
    hammerGain.connect(pianoFilter);

    pianoFilter.connect(noteGain);
    noteGain.connect(this.bgmGain);

    osc1.start(startTime);
    osc2.start(startTime);
    hammerOsc.start(startTime);

    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
    hammerOsc.stop(startTime + 0.02);
  }

  private playCelestaNote(freq: number, startTime: number, duration: number, gainLevel: number = 0.016) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(freq * 2, startTime);

    const celestaGain = this.ctx.createGain();
    celestaGain.gain.setValueAtTime(0.0001, startTime);
    celestaGain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.012);
    celestaGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(gainLevel * 0.25, startTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

    osc.connect(celestaGain);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(celestaGain);
    celestaGain.connect(this.bgmGain);

    osc.start(startTime);
    shimmer.start(startTime);
    osc.stop(startTime + duration + 0.04);
    shimmer.stop(startTime + 0.22);
  }

  private playWarmPadNote(freq: number, startTime: number, duration: number, gainLevel: number = 0.018) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, startTime);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, startTime);
    padGain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.45);
    padGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(padGain);
    padGain.connect(this.bgmGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  public startBGM() {
    if (this.isMuted) return;
    this.isBgmPlaying = true;
    this.initContext();
    this.startSynthesizedPianoBGM();
  }

  private startSynthesizedPianoBGM() {
    if (!this.ctx || this.bgmInterval) return;

    // A truly sweet, emotional, beautiful romantic piano piece ("پیاری سی پیانو دھن")
    // 8-measure progression in C Major / A Minor:
    // Bar 1: Cmaj9  (Peaceful, open, sparkling)
    // Bar 2: Am9    (Gentle, heartfelt, lyrical)
    // Bar 3: Fmaj7  (Warm, uplifting, flowing)
    // Bar 4: Gsus4  (Suspended, expectant)
    // Bar 5: Em7    (Melancholic, soothing)
    // Bar 6: Am7    (Poetic, resonant)
    // Bar 7: Dm9    (Soft jazz elegance)
    // Bar 8: G9->C  (Delicate, sweet resolution)
    const pianoBars = [
      {
        bass: 130.81, // C3
        chord: [196.00, 261.63, 329.63, 493.88], // G3, C4, E4, B4
        melody: [659.25, 587.33, 523.25, 493.88], // E5, D5, C5, B4
      },
      {
        bass: 110.00, // A2
        chord: [164.81, 220.00, 261.63, 329.63], // E3, A3, C4, E4
        melody: [523.25, 493.88, 440.00, 392.00], // C5, B4, A4, G4
      },
      {
        bass: 87.31,  // F2
        chord: [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
        melody: [440.00, 523.25, 659.25, 783.99], // A4, C5, E5, G5
      },
      {
        bass: 98.00,  // G2
        chord: [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
        melody: [698.46, 659.25, 587.33, 523.25], // F5, E5, D5, C5
      },
      {
        bass: 82.41,  // E2
        chord: [164.81, 196.00, 246.94, 293.66], // E3, G3, B3, D4
        melody: [392.00, 493.88, 587.33, 659.25], // G4, B4, D5, E5
      },
      {
        bass: 110.00, // A2
        chord: [164.81, 220.00, 261.63, 329.63], // E3, A3, C4, E4
        melody: [523.25, 659.25, 783.99, 880.00], // C5, E5, G5, A5
      },
      {
        bass: 146.83, // D3
        chord: [220.00, 261.63, 349.23, 440.00], // A3, C4, F4, A4
        melody: [698.46, 659.25, 587.33, 523.25], // F5, E5, D5, C5
      },
      {
        bass: 98.00,  // G2
        chord: [196.00, 261.63, 293.66, 392.00], // G3, C4, D4, G4
        melody: [493.88, 587.33, 440.00, 523.25], // B4, D5, A4, C5
      },
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.isMuted || !this.isBgmPlaying) return;
      const t = this.ctx.currentTime;
      const curBarIndex = Math.floor(this.bgmStep / 4) % pianoBars.length;
      const beat = this.bgmStep % 4;
      const currentBar = pianoBars[curBarIndex];

      // On beat 0: Left hand plays deep bass note + middle harmony chord + warm lush pad
      if (beat === 0) {
        // Deep acoustic piano bass
        this.playPianoNote(currentBar.bass, t, 2.4, 0.045);
        this.playWarmPadNote(currentBar.bass * 2, t, 2.3, 0.018);

        // Middle harmony chord (staggered slightly by 15ms for natural human touch)
        currentBar.chord.forEach((freq, idx) => {
          this.playPianoNote(freq, t + 0.015 * idx, 2.1, 0.024);
        });
      }

      // On beat 1 & 3: Sparkling celesta harp overtone
      if (beat === 1 || beat === 3) {
        const sparkFreq = (currentBar.chord[2] || currentBar.melody[beat]) * 2;
        this.playCelestaNote(sparkFreq, t + 0.08, 0.9, 0.014);
      }

      // On beat 2: Gentle broken arpeggio note from left hand
      if (beat === 2) {
        const midFreq = currentBar.chord[1] || currentBar.chord[0];
        this.playPianoNote(midFreq, t, 1.8, 0.022);
      }

      // On every beat: Right hand plays the sweet, delicate piano melody note
      const melodyFreq = currentBar.melody[beat];
      if (melodyFreq) {
        this.playPianoNote(melodyFreq, t, 1.4, 0.038);
      }

      this.bgmStep++;
    }, 540); // 540ms per beat = ~110 BPM lyrical, soothing piano ballad
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // =========================================================================
  // 2. REALISTIC TIGER ROAR ("ٹائیگر کا ساؤنڈ کارڈ کے اوپر")
  // Throaty guttural vocal fold modulation + low-frequency chest rumble + wild snarl
  // =========================================================================
  public playTigerRoar() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    // 1. Guttural throaty growl: Low sawtooth modulated by a fast vibrato (throat flutter)
    const throatOsc = ctx.createOscillator();
    throatOsc.type = 'sawtooth';
    throatOsc.frequency.setValueAtTime(160, t);
    throatOsc.frequency.linearRampToValueAtTime(260, t + 0.18);
    throatOsc.frequency.exponentialRampToValueAtTime(65, t + 1.1);

    // Throaty vibrato LFO (fast throat muscle rasp)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(32, t);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(35, t);
    lfo.connect(lfoGain);
    lfoGain.connect(throatOsc.frequency);

    // 2. Deep Chest Sub-Rumble
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(80, t);
    subOsc.frequency.exponentialRampToValueAtTime(38, t + 1.15);

    // 3. Formant filter simulating a wide open big cat jaws / muzzle
    const tigerFilter = ctx.createBiquadFilter();
    tigerFilter.type = 'bandpass';
    tigerFilter.frequency.setValueAtTime(380, t);
    tigerFilter.frequency.linearRampToValueAtTime(650, t + 0.2);
    tigerFilter.frequency.exponentialRampToValueAtTime(180, t + 1.1);
    tigerFilter.Q.setValueAtTime(2.8, t);

    // Breath / Snarl air turbulence (noise generator)
    const bufferSize = Math.floor(ctx.sampleRate * 0.9);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(250, t + 0.9);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, t);
    noiseGain.gain.linearRampToValueAtTime(0.22, t + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Master Roar Envelope
    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.001, t);
    roarGain.gain.linearRampToValueAtTime(0.55, t + 0.16); // Aggressive tiger strike
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    throatOsc.connect(tigerFilter);
    subOsc.connect(tigerFilter);
    tigerFilter.connect(roarGain);
    roarGain.connect(this.sfxGain);

    lfo.start(t);
    throatOsc.start(t);
    subOsc.start(t);
    noiseSource.start(t);

    lfo.stop(t + 1.25);
    throatOsc.stop(t + 1.25);
    subOsc.stop(t + 1.25);
    noiseSource.stop(t + 0.95);
  }

  // =========================================================================
  // 3. LEGENDARY DRAGON ROAR ("ڈریگن کا ساؤنڈ کارڈ کے اوپر")
  // Mythical sweeping fire dragon cry + massive subterranean sub-bass earthquake
  // =========================================================================
  public playDragonRoar() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    // 1. Mythical Dragon screech / bellow: High sweeping sawtooth dropping to a deep growl
    const dragonOsc = ctx.createOscillator();
    dragonOsc.type = 'sawtooth';
    dragonOsc.frequency.setValueAtTime(320, t);
    dragonOsc.frequency.linearRampToValueAtTime(480, t + 0.18);
    dragonOsc.frequency.exponentialRampToValueAtTime(75, t + 1.3);

    // 2. Secondary Harmonic / Fire overtone
    const dragonOsc2 = ctx.createOscillator();
    dragonOsc2.type = 'triangle';
    dragonOsc2.frequency.setValueAtTime(640, t);
    dragonOsc2.frequency.linearRampToValueAtTime(960, t + 0.18);
    dragonOsc2.frequency.exponentialRampToValueAtTime(110, t + 1.2);

    // 3. Sub-bass Earthquake rumble (40Hz)
    const earthOsc = ctx.createOscillator();
    earthOsc.type = 'sine';
    earthOsc.frequency.setValueAtTime(55, t);
    earthOsc.frequency.exponentialRampToValueAtTime(28, t + 1.35);

    // Resonant Dragon Cavern lowpass filter
    const dragonFilter = ctx.createBiquadFilter();
    dragonFilter.type = 'lowpass';
    dragonFilter.frequency.setValueAtTime(900, t);
    dragonFilter.frequency.exponentialRampToValueAtTime(280, t + 1.3);
    dragonFilter.Q.setValueAtTime(3.2, t);

    // Fiery breath whoosh (white noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 1.1);
    const fireBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const fireData = fireBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      fireData[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const fireSource = ctx.createBufferSource();
    fireSource.buffer = fireBuffer;

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.setValueAtTime(1100, t);
    fireFilter.frequency.exponentialRampToValueAtTime(350, t + 1.1);
    fireFilter.Q.setValueAtTime(1.8, t);

    const fireGain = ctx.createGain();
    fireGain.gain.setValueAtTime(0.001, t);
    fireGain.gain.linearRampToValueAtTime(0.25, t + 0.2);
    fireGain.gain.exponentialRampToValueAtTime(0.001, t + 1.15);

    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(this.sfxGain);

    // Master Dragon Envelope
    const masterDragonGain = ctx.createGain();
    masterDragonGain.gain.setValueAtTime(0.001, t);
    masterDragonGain.gain.linearRampToValueAtTime(0.52, t + 0.2);
    masterDragonGain.gain.exponentialRampToValueAtTime(0.001, t + 1.35);

    dragonOsc.connect(dragonFilter);
    dragonOsc2.connect(dragonFilter);
    earthOsc.connect(dragonFilter);
    dragonFilter.connect(masterDragonGain);
    masterDragonGain.connect(this.sfxGain);

    dragonOsc.start(t);
    dragonOsc2.start(t);
    earthOsc.start(t);
    fireSource.start(t);

    dragonOsc.stop(t + 1.4);
    dragonOsc2.stop(t + 1.4);
    earthOsc.stop(t + 1.4);
    fireSource.stop(t + 1.2);
  }

  // =========================================================================
  // 4. OTHER CASINO SOUNDS (Chips, Chimes, Fanfares)
  // =========================================================================

  // Start Betting Chime (Ascending triad)
  public playStartBetting() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!ctx || !this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.20, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.38);
    });
  }

  // Crisp Ceramic Chip Click ("چھن")
  public playChipSound() {
    if (this.isMuted) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastChipTime < 75) {
      return;
    }
    this.lastChipTime = now;

    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 2600 + Math.random() * 300;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.038);
  }

  // Countdown Beep (3, 2, 1)
  public playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    if (isFinal) {
      this.playStopBetting();
      return;
    }

    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);

    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.095);
  }

  // Stop Betting Gong
  public playStopBetting() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.30, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  }

  // Card Swoosh
  public playCardSwoosh() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const bufferSize = Math.floor(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, ctx.currentTime);
    filter.Q.setValueAtTime(2.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // Winning Coins Collection Fanfare
  public playWinFanfare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      if (!ctx || !this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.24, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  // =========================================================================
  // 5. LOADING PAGE SOUNDS ("لوڈنگ پیج ساؤنڈ") & SWEET UI CHIMES
  // =========================================================================

  private lastLoadingIntroAt: number = 0;

  // Short, pleasant initial loading chime (~1.1s ascending crystal bell arpeggio + warm pad)
  public async playLoadingIntroSafe(): Promise<boolean> {
    if (this.isMuted) return false;
    const nowMs = Date.now();
    if (nowMs - this.lastLoadingIntroAt < 1200) return true;

    try {
      const ctx = this.initContext();
      if (!ctx || !this.sfxGain) return false;

      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      if (ctx.state !== 'running') return false;

      this.lastLoadingIntroAt = Date.now();
      return this.playLoadingStart();
    } catch {
      return false;
    }
  }

  public playLoadingStart(): boolean {
    if (this.isMuted) return false;
    try {
      const ctx = this.initContext();
      if (!ctx || !this.sfxGain || ctx.state !== 'running') return false;

      // Soft warm C-major-9 crystalline chime (brief, lush, pleasant)
      const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
      const t = ctx.currentTime + 0.01;

      // Gentle warm velvet undertone pad
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(261.63, t);
      padGain.gain.setValueAtTime(0.0001, t);
      padGain.gain.linearRampToValueAtTime(0.08, t + 0.08);
      padGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      padOsc.connect(padGain);
      padGain.connect(this.sfxGain);
      padOsc.start(t);
      padOsc.stop(t + 1.1);

      notes.forEach((freq, idx) => {
        if (!this.sfxGain) return;
        const start = t + idx * 0.075;
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gain = ctx.createGain();
        const overGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, start);
        overGain.gain.setValueAtTime(0.035, start);
        overGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);

        osc.connect(gain);
        overtone.connect(overGain);
        overGain.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        overtone.start(start);
        osc.stop(start + 0.7);
        overtone.stop(start + 0.3);
      });

      return true;
    } catch {
      return false;
    }
  }

  // Soft rising crystal sparkle played gently as loading progress fills up
  public playLoadingShimmerStep(stepIndex: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx || !this.sfxGain || ctx.state !== 'running') return;

      const scale = [659.25, 783.99, 987.77, 1046.5];
      const freq = scale[stepIndex % scale.length];
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch {
      // ignore
    }
  }

  // Celebratory golden chord chime when loading completes (100%)
  public playLoadingComplete() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx || !this.sfxGain || ctx.state !== 'running') return;

      const chord = [523.25, 659.25, 783.99, 1046.5];
      const t = ctx.currentTime;
      chord.forEach((freq, idx) => {
        if (!this.sfxGain) return;
        const start = t + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {
      // ignore
    }
  }

  // Sweet gentle bell tap for UI buttons
  public playLovelyClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    [783.99, 1046.5].forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const start = t + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  public playCashSound() {
    this.playLovelyClick();
  }
}

export const soundManager = new SoundManager();
