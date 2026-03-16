// ── YAMA-BRUH Notification Engine (YM2413 Extended) ───────────────────
// Drop-in FM synth ringtone player for any site.
// Full YM2413 OPLL: waveforms, tremolo, chip vibrato, KSR, KSL, mod level.
// No WASM, no dependencies, no UI — just sound.
//
// Usage:
//   <script src="yamabruh-notify.js"></script>
//   <script>
//     const yb = new YamaBruhNotify();
//     yb.play('user-abc123');
//     yb.play('order-456', { preset: 88, bpm: 160, volume: 0.5 });
//     yb.stop();
//   </script>

// [cr, mr, mi, atk, dec, sus, rel, fb, c_wave, m_wave, trem, chip_vib, ksr, ksl, mod_lvl, eg_type]
const YAMABRUH_PRESETS = [
  // 00-09: Piano / Keys
  [1.0,1.0,1.8,0.001,0.8,0.15,0.4,0.0, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,2.0,2.5,0.001,0.6,0.2,0.35,0.0, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,3.0,3.5,0.001,0.4,0.25,0.3,0.05, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,1.0,1.2,0.002,1.0,0.3,0.5,0.0, 0,0,0,0,0.2,1.0,1.0,0],
  [1.0,7.0,2.0,0.001,0.7,0.12,0.6,0.0, 0,0,0,0,0.2,1.0,1.0,0],
  [1.0,3.0,3.0,0.001,0.3,0.0,0.2,0.02, 1,0,0,0,0.4,1.5,1.0,1],
  [1.0,4.0,3.5,0.001,0.25,0.0,0.18,0.04, 1,0,0,0,0.4,1.5,1.0,1],
  [1.0,5.0,2.8,0.001,0.35,0.0,0.22,0.06, 1,0,0,0,0.4,1.5,1.0,1],
  [1.0,5.0,4.5,0.001,0.15,0.05,0.08,0.1, 1,1,0,0,0.5,1.5,1.0,1],
  [1.0,13.0,1.5,0.001,1.5,0.0,2.0,0.0, 0,0,0,0,0,0,0.8,1],
  // 10-19: Organ
  [1.0,1.0,0.6,0.01,0.05,0.85,0.1,0.05, 0,0,0.35,0,0,0,1.0,0],
  [1.0,1.0,0.4,0.015,0.08,0.75,0.15,0.03, 0,0,0.3,0,0,0,1.0,0],
  [1.0,2.0,0.8,0.012,0.06,0.8,0.12,0.06, 0,0,0.3,0,0,0,1.0,0],
  [1.0,2.0,2.5,0.003,0.02,0.95,0.04,0.2, 0,0,0.4,0,0,0,1.0,0],
  [1.0,4.0,2.2,0.003,0.02,0.88,0.04,0.1, 0,0,0.4,0,0,0,1.0,0],
  [1.0,1.0,1.5,0.005,0.02,0.9,0.05,0.12, 0,0,0.5,0,0,0,1.0,0],
  [1.0,3.0,1.2,0.008,0.05,0.8,0.08,0.25, 0,0,0.45,0.005,0,0,1.0,0],
  [1.0,4.0,2.0,0.001,2.5,0.05,3.0,0.0, 0,0,0.2,0,0,0,1.0,0],
  [1.0,4.0,4.0,0.001,0.6,0.0,0.5,0.02, 2,0,0,0,0.4,1.5,1.0,1],
  [1.0,3.0,3.5,0.001,0.5,0.0,0.4,0.03, 2,0,0,0,0.4,1.5,1.0,1],
  // 20-29: Brass
  [1.0,1.0,4.0,0.04,0.15,0.7,0.2,0.2, 0,1,0,0.005,0,0,1.0,0],
  [1.0,1.0,2.0,0.03,0.12,0.4,0.15,0.1, 0,0,0,0,0,0,0.7,0],
  [1.0,1.0,3.5,0.06,0.2,0.65,0.3,0.25, 0,1,0,0.005,0,0,1.0,0],
  [1.0,1.0,2.8,0.07,0.25,0.55,0.35,0.2, 0,0,0,0.003,0,0,0.8,0],
  [1.0,1.0,2.5,0.08,0.25,0.6,0.4,0.15, 0,0,0,0.005,0,0,1.0,0],
  [1.0,1.0,1.8,0.12,0.3,0.5,0.5,0.08, 0,0,0,0.007,0,0,1.0,0],
  [0.5,1.0,3.0,0.06,0.2,0.6,0.3,0.2, 0,1,0,0,0,0,1.0,0],
  [1.0,1.0,5.0,0.05,0.15,0.75,0.25,0.3, 1,1,0,0.004,0,0,1.0,0],
  [1.0,2.0,4.5,0.03,0.1,0.8,0.2,0.18, 1,0,0,0.004,0,0,1.0,0],
  [1.0,3.0,6.0,0.02,0.08,0.85,0.15,0.22, 1,0,0,0.004,0,0,1.0,0],
  // 30-39: Woodwind
  [2.0,1.0,1.0,0.02,0.05,0.7,0.1,0.05, 0,0,0,0.005,0,0,1.0,0],
  [2.0,1.0,0.5,0.03,0.06,0.6,0.12,0.02, 0,0,0,0.006,0,0,1.0,0],
  [2.0,1.0,1.8,0.01,0.04,0.75,0.08,0.08, 0,0,0,0.004,0,0,1.0,0],
  [1.0,3.0,3.0,0.015,0.06,0.65,0.08,0.2, 0,1,0,0.005,0,0,1.0,0],
  [0.5,3.0,2.5,0.02,0.08,0.6,0.1,0.18, 0,1,0,0.004,0,0,1.0,0],
  [1.0,2.0,4.0,0.02,0.08,0.6,0.1,0.15, 0,1,0,0.005,0,0,1.0,0],
  [0.5,1.0,3.5,0.03,0.1,0.55,0.12,0.2, 0,1,0,0.004,0,0,1.0,0],
  [1.0,2.0,3.5,0.025,0.07,0.65,0.1,0.22, 0,1,0,0.006,0,0,1.0,0],
  [1.0,3.0,2.0,0.02,0.04,0.8,0.08,0.35, 0,1,0.15,0.005,0,0,1.0,0],
  [1.0,2.0,2.5,0.02,0.06,0.7,0.1,0.12, 0,0,0,0.005,0,0,1.0,0],
  // 40-49: Strings / Bass / Plucked
  [1.0,2.0,1.0,0.15,0.5,0.7,0.8,0.02, 0,0,0.12,0.007,0,0,1.0,0],
  [1.0,2.0,1.5,0.12,0.4,0.65,0.7,0.04, 0,0,0.12,0.007,0,0,1.0,0],
  [0.5,2.0,1.2,0.1,0.5,0.6,0.8,0.03, 0,0,0.1,0.005,0,0,1.0,0],
  [1.0,2.0,0.8,0.2,0.6,0.7,1.0,0.02, 0,0,0.15,0.006,0,0,1.0,0],
  [1.0,1.0,2.0,0.001,0.3,0.2,0.12,0.05, 0,0,0,0,0,3.0,1.0,0],
  [1.0,1.0,5.0,0.001,0.08,0.05,0.06,0.2, 1,0,0,0,0.5,3.0,1.0,1],
  [1.0,1.0,0.8,0.005,0.4,0.35,0.2,0.0, 0,0,0,0,0,1.5,1.0,0],
  [0.5,1.0,4.0,0.001,0.2,0.25,0.1,0.15, 0,1,0,0,0,3.0,1.0,0],
  [1.0,3.0,3.5,0.001,0.15,0.0,0.08,0.1, 1,0,0,0,0.5,1.5,1.0,1],
  [1.0,4.0,2.5,0.001,0.2,0.0,0.1,0.06, 0,0,0,0,0.4,1.5,1.0,1],
  // 50-59: Guitar / Plucked / Folk
  [1.0,2.0,1.8,0.001,0.5,0.1,0.3,0.03, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,3.0,2.2,0.001,0.35,0.08,0.25,0.06, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,2.0,2.5,0.001,0.4,0.05,0.2,0.04, 0,0,0,0,0.3,1.5,1.0,0],
  [1.0,1.0,1.5,0.001,0.8,0.15,0.5,0.02, 0,0,0,0.006,0,1.0,1.0,0],
  [1.0,5.0,2.0,0.001,0.2,0.0,0.15,0.05, 0,0,0,0,0.4,1.5,1.0,1],
  [1.0,2.0,3.0,0.001,0.6,0.0,0.4,0.08, 1,0,0,0,0.3,1.5,1.0,1],
  [1.0,3.0,4.0,0.001,0.3,0.0,0.2,0.1, 1,0,0,0,0.4,1.5,1.0,1],
  [1.0,7.0,1.5,0.001,1.5,0.0,1.8,0.01, 0,0,0,0,0,0,0.8,1],
  [1.0,1.0,2.5,0.02,0.08,0.7,0.1,0.3, 0,0,0.25,0.006,0,0,1.0,0],
  [1.0,7.0,2.5,0.001,1.5,0.0,2.0,0.01, 0,0,0,0,0,0,0.7,1],
  // 60-69: Combo / Synth
  [1.0,4.0,4.5,0.03,0.4,0.5,0.3,0.15, 0,0,0.2,0,0,0,1.0,0],
  [2.0,3.0,2.0,0.01,0.3,0.4,0.25,0.05, 0,0,0,0,0,0,1.0,0],
  [1.0,4.0,3.0,0.02,0.5,0.3,0.4,0.1, 0,0,0.15,0,0,0,1.0,0],
  [1.0,7.0,2.0,0.02,0.6,0.35,0.5,0.08, 0,0,0,0,0,0,0.8,0],
  [1.0,1.41,5.0,0.1,0.5,0.5,0.6,0.06, 0,0,0.1,0.006,0,0,1.0,0],
  [1.0,1.0,3.0,0.05,0.3,0.7,0.4,0.4, 0,0,0,0.015,0,0,1.0,0],
  [1.0,2.0,4.5,0.02,0.06,0.85,0.12,0.18, 1,1,0,0,0,0,1.0,0],
  [1.0,7.0,6.0,0.01,0.08,0.7,0.15,0.3, 0,2,0,0,0,0,1.0,0],
  [1.0,1.0,0.0,0.01,0.02,0.9,0.1,0.0, 0,0,0,0,0,0,1.0,0],
  [1.0,1.0,2.5,0.001,0.01,0.8,0.8,0.1, 0,1,0,0,0,0,1.0,0],
  // 70-79: Human Voice / Nature
  [1.0,1.0,0.8,0.08,0.15,0.65,0.3,0.5, 0,0,0.15,0.008,0,0,1.0,0],
  [1.0,2.0,1.2,0.06,0.2,0.6,0.35,0.45, 0,1,0.15,0.007,0,0,1.0,0],
  [1.0,3.0,0.6,0.1,0.25,0.55,0.4,0.55, 0,0,0.2,0.007,0,0,1.0,0],
  [1.0,1.0,0.3,0.15,0.3,0.4,0.5,0.6, 0,0,0.1,0.005,0,0,0.6,0],
  [2.0,1.0,0.8,0.02,0.05,0.7,0.1,0.15, 0,0,0,0.008,0,0,1.0,0],
  [1.0,0.5,4.0,0.08,0.3,0.5,0.4,0.7, 0,0,0.3,0,0,0,1.0,0],
  [1.0,0.25,3.0,0.05,0.4,0.3,0.5,0.6, 0,0,0.25,0,0,0,1.0,0],
  [1.0,13.0,1.0,0.001,1.5,0.0,2.0,0.0, 0,0,0,0,0.5,1.5,0.8,1],
  [1.0,7.0,5.0,0.001,0.06,0.0,0.04,0.15, 3,0,0,0,0.5,0,1.0,1],
  [1.0,11.0,2.0,0.001,0.8,0.0,1.0,0.0, 0,0,0,0,0.3,0,0.8,1],
  // 80-89: SFX / Novelty
  [1.0,0.99,8.0,0.01,0.3,0.5,0.4,0.8, 0,1,0.3,0.01,0,0,1.0,0],
  [2.0,0.5,6.0,0.001,0.08,0.3,0.06,0.5, 1,0,0,0,0.5,0,1.0,1],
  [1.0,5.0,2.0,0.001,0.6,0.0,0.8,0.02, 0,0,0,0,0,0,0.7,1],
  [1.0,11.0,3.0,0.001,0.05,0.0,0.02,0.0, 2,0,0,0,0.6,0,1.0,1],
  [1.0,1.0,6.0,0.001,0.02,0.9,0.02,0.4, 1,1,0.5,0,0,0,1.0,0],
  [1.0,0.1,12.0,0.001,0.5,0.0,0.8,0.7, 0,0,0,0.02,0,0,1.0,1],
  [1.0,5.0,4.0,0.15,1.0,0.5,2.0,0.08, 0,0,0,0.01,0,0,1.0,0],
  [1.0,0.5,10.0,0.001,0.6,0.0,1.5,0.6, 1,1,0,0,0,0,1.0,1],
  [1.0,13.0,2.5,0.001,2.0,0.0,2.5,0.0, 0,0,0,0,0,0,0.8,1],
  [1.0,1.0,5.0,0.08,0.8,0.5,1.5,0.4, 0,1,0.3,0.03,0,0,1.0,0],
  // 90-99: Percussion / FX
  [1.0,3.5,5.0,0.001,2.0,0.0,2.5,0.0, 2,0,0,0,0.5,0,1.0,1],
  [1.0,5.4,3.0,0.001,1.5,0.0,2.0,0.0, 2,0,0,0,0.4,0,0.9,1],
  [1.0,3.5,4.0,0.001,1.8,0.0,2.2,0.01, 2,0,0,0,0.4,0,1.0,1],
  [1.0,1.41,7.0,0.001,1.2,0.0,1.5,0.05, 2,1,0,0,0.3,0,1.0,1],
  [1.0,0.7,3.0,0.001,0.4,0.0,0.3,0.02, 2,0,0,0,0.5,0,1.0,1],
  [1.0,1.5,8.0,0.001,0.3,0.0,0.2,0.3, 0,1,0,0,0.5,0,1.0,1],
  [0.5,1.5,6.0,0.001,0.4,0.0,0.25,0.25, 0,1,0,0,0.5,0,1.0,1],
  [1.0,2.3,10.0,0.001,0.12,0.0,0.08,0.15, 3,1,0,0,0.6,0,1.0,1],
  [1.0,0.1,15.0,0.001,0.04,0.0,0.03,0.8, 3,1,0,0,0.8,0,1.0,1],
  [1.0,7.0,3.0,0.3,2.0,0.3,3.0,0.1, 0,0,0.2,0.01,0,0,1.0,0],
];

// ── YM2413 Waveform Types ──────────────────────────────────────────────
function _ym2413Wave(phase, type) {
  switch (type) {
    case 1: { const s = Math.sin(phase); return s > 0 ? s : 0; }
    case 2: return Math.abs(Math.sin(phase));
    case 3: {
      const TAU = 6.28318530717959;
      let p = phase % TAU;
      if (p < 0) p += TAU;
      return p < 1.5707963 ? Math.sin(p) : 0;
    }
    default: return Math.sin(phase);
  }
}

class YamaBruhNotify {
  constructor(config = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.preset = config.preset ?? 88;
    this.bpm = config.bpm || 140;
    this.volume = config.volume ?? 0.8;
    this.seed = config.seed || null;
    this.ctx = null;
    this._source = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: this.sampleRate });
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  _rng(seed) {
    let s = seed || 1;
    return {
      next() {
        s ^= s << 13;
        s = (s >>> 17) | (s << 15);
        s ^= s << 5;
        s >>>= 0;
        if (s === 0) s = 1;
        return s;
      },
      range(n) { return this.next() % n; },
    };
  }

  _getPreset(index) {
    const i = Math.max(0, Math.min(99, index));
    return YAMABRUH_PRESETS[i] || YAMABRUH_PRESETS[0];
  }

  _midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  _renderNote(freq, duration, preset, buf, offset, velocity) {
    const sr = this.sampleRate;
    const TAU = 6.28318530717959;

    // Base params
    const cr = preset[0], mr = preset[1], mi = preset[2];
    const atkBase = preset[3], decBase = preset[4], sustain = preset[5];
    const relBase = preset[6], feedback = preset[7];
    // YM2413 extended
    const cWave = (preset[8] || 0) | 0;
    const mWave = (preset[9] || 0) | 0;
    const tremDepth = preset[10] || 0;
    const chipVib = preset[11] || 0;
    const ksr = preset[12] || 0;
    const ksl = preset[13] || 0;
    const modLevel = preset[14] !== undefined ? preset[14] : 1;
    const egType = preset[15] || 0;

    // KSR: scale envelope times with pitch
    let attack = atkBase, decay = decBase, release = relBase;
    if (ksr > 0) {
      const octave = Math.log2(freq / 440);
      const ksrFactor = Math.pow(2, -ksr * octave);
      attack *= ksrFactor;
      decay *= ksrFactor;
      release *= ksrFactor;
    }

    // KSL: volume attenuation above A4
    let kslAtten = 1;
    if (ksl > 0) {
      const octave = Math.log2(freq / 440);
      if (octave > 0) kslAtten = Math.pow(10, -ksl * octave / 20);
    }

    const carrierFreq = freq * cr;
    const modFreq = freq * mr;
    const totalSamples = Math.floor((duration + release) * sr);
    const noteSamples = Math.floor(duration * sr);
    const attackSamples = Math.floor(attack * sr);
    const decaySamples = Math.floor(decay * sr);

    let carrierPhase = 0, modPhase = 0, prevMod = 0;
    const available = buf.length - offset;
    const count = Math.min(totalSamples, available);

    for (let i = 0; i < count; i++) {
      const t = i / sr;

      // ADSR envelope
      let env;
      if (i < attackSamples) {
        env = i / (attackSamples || 1);
      } else if (i < attackSamples + decaySamples) {
        const dt = (i - attackSamples) / (decaySamples || 1);
        env = 1 - (1 - sustain) * dt;
      } else if (i < noteSamples) {
        if (egType > 0.5) {
          // Percussive: continue decaying through sustain
          const elapsed = (i - attackSamples - decaySamples) / sr;
          env = sustain * Math.pow(0.5, elapsed / (decBase * 2 + 0.01));
          if (env < 0.001) env = 0;
        } else {
          env = sustain;
        }
      } else {
        const relMax = Math.max(release * sr, 1);
        const dt = (i - noteSamples) / relMax;
        env = Math.max(sustain * (1 - dt), 0);
      }

      // YM2413 Tremolo at 3.7Hz
      const trem = tremDepth > 0 ? 1 - tremDepth * (1 + Math.sin(TAU * 3.7 * t)) * 0.5 : 1;

      // YM2413 Chip vibrato at 6.4Hz
      const vibMod = chipVib > 0 ? chipVib * Math.sin(TAU * 6.4 * t) : 0;
      const freqMult = 1 + vibMod;

      // 2-op FM with YM2413 waveforms
      const modSignal = _ym2413Wave(modPhase + feedback * prevMod, mWave) * modLevel;
      prevMod = modSignal;
      buf[offset + i] += _ym2413Wave(carrierPhase + mi * modSignal, cWave) * env * velocity * 0.45 * trem * kslAtten;

      carrierPhase += TAU * carrierFreq * freqMult / sr;
      modPhase += TAU * modFreq * freqMult / sr;
      if (carrierPhase > TAU) carrierPhase -= TAU;
      if (modPhase > TAU) modPhase -= TAU;
    }

    return count;
  }

  _generateSequence(seed) {
    const rng = this._rng(seed);
    const numNotes = 3 + (seed % 3);
    const movements = [0, 2, -2, 3, -3, 4, -4, 6, -6];
    const durations = [0.125, 0.25, 0.5, 1.0, 2.0];
    const octaveOffset = rng.range(3) * 12;
    let currentNote = 54 + octaveOffset;
    const notes = [];

    for (let i = 0; i < numNotes; i++) {
      currentNote += movements[rng.range(9)];
      if (currentNote < 42) currentNote += 12;
      if (currentNote > 84) currentNote -= 12;
      notes.push({ note: currentNote, dur: durations[rng.range(5)] });
    }
    return notes;
  }

  /**
   * Play a ringtone from a seed string.
   * @param {string} seedStr - Any string (user ID, event name, etc.)
   * @param {object} opts - Optional overrides: { preset, bpm, volume, onDone }
   * @returns {AudioBufferSourceNode} The playing source node
   */
  play(seedStr, opts = {}) {
    const ctx = this._ensureCtx();
    const preset = this._getPreset(opts.preset ?? this.preset);
    const bpm = opts.bpm || this.bpm;
    const volume = opts.volume ?? this.volume;
    const beatDuration = 60 / bpm;

    if (seedStr === undefined || seedStr === null || seedStr === '') {
      seedStr = 'auto-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    }

    const raw = this.seed ? this.seed + ':' + String(seedStr) : String(seedStr);
    const seed = this._hash(raw);
    const sequence = this._generateSequence(seed);

    let totalBeats = 0;
    for (const n of sequence) totalBeats += n.dur;
    const maxRelease = preset[6];
    const totalSamples = Math.ceil((totalBeats * beatDuration + maxRelease) * this.sampleRate);

    const buf = new Float32Array(totalSamples);
    let offset = 0;
    for (const n of sequence) {
      const freq = this._midiToFreq(n.note);
      const durSecs = n.dur * beatDuration;
      this._renderNote(freq, durSecs, preset, buf, offset, volume);
      offset += Math.floor(durSecs * this.sampleRate);
    }

    const audioBuffer = ctx.createBuffer(1, buf.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(buf);

    this.stop();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
    this._source = source;

    source.onended = () => {
      if (this._source === source) this._source = null;
      if (opts.onDone) opts.onDone();
    };

    return source;
  }

  /** Stop current ringtone */
  stop() {
    if (this._source) {
      try { this._source.stop(); } catch (_) {}
      this._source = null;
    }
  }

  /** Update default config */
  configure(config) {
    if (config.preset !== undefined) this.preset = config.preset;
    if (config.bpm !== undefined) this.bpm = config.bpm;
    if (config.volume !== undefined) this.volume = config.volume;
    if (config.sampleRate !== undefined) this.sampleRate = config.sampleRate;
  }

  /** List available preset names */
  static get PRESET_NAMES() {
    return [
      'Piano 1','Piano 2','Honky-Tonk Piano','Electric Piano 1','Electric Piano 2',
      'Harpsichord 1','Harpsichord 2','Harpsichord 3','Honky-Tonk Clavi','Glass Celesta',
      'Reed Organ','Pipe Organ 1','Pipe Organ 2','Electronic Organ 1','Electronic Organ 2',
      'Jazz Organ','Accordion','Vibraphone','Marimba 1','Marimba 2',
      'Trumpet','Mute Trumpet','Trombone','Soft Trombone','Horn',
      'Alpenhorn','Tuba','Brass Ensemble 1','Brass Ensemble 2','Brass Ensemble 3',
      'Flute','Panflute','Piccolo','Clarinet','Bass Clarinet',
      'Oboe','Bassoon','Saxophone','Bagpipe','Woodwinds',
      'Violin 1','Violin 2','Cello','Strings','Electric Bass',
      'Slap Bass','Wood Bass','Synth Bass','Banjo','Mandolin',
      'Classic Guitar','Jazz Guitar','Folk Guitar','Hawaiian Guitar','Ukulele',
      'Koto','Shamisen','Harp','Harmonica','Music Box',
      'Brass & Marimba','Flute & Harpsichord','Oboe & Vibraphone','Clarinet & Harp','Violin & Steel Drum',
      'Handsaw','Synth Brass','Metallic Synth','Sine Wave','Reverse',
      'Human Voice 1','Human Voice 2','Human Voice 3','Whisper','Whistle',
      'Gurgle','Bubble','Raindrop','Popcorn','Drip',
      'Dog Pianist','Duck','Babydoll','Telephone Bell','Emergency Alarm',
      'Leaf Spring','Comet','Fireworks','Crystal','Ghost',
      'Hand Bell','Chimes','Bell','Steel Drum','Cowbell',
      'Synth Tom 1','Synth Tom 2','Snare Drum','Machine Gun','Wave',
    ];
  }
}

// Auto-expose globally
if (typeof window !== 'undefined') window.YamaBruhNotify = YamaBruhNotify;
