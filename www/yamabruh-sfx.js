// ── YAMA-BRUH SFX Engine (YM2413 Extended) ────────────────────────────
// Single-note FM synth for game sound effects and sound design.
// Full YM2413 OPLL: waveforms, tremolo, chip vibrato, KSR, KSL, mod level.
// Polyphonic — multiple sounds can overlap. No WASM, no dependencies beyond
// yamabruh-notify.js (shared preset bank + waveform functions).
//
// Usage:
//   <script src="yamabruh-notify.js"></script>
//   <script src="yamabruh-sfx.js"></script>
//   <script>
//     const sfx = new YamaBruhSFX({ preset: 88 });
//     sfx.playNote(60);                          // middle C
//     sfx.playNote(72, { preset: 60, duration: 0.1 }); // C5, short hit
//     sfx.playNote({ root: 36, range: 24 });      // random note in range
//     sfx.stopAll();
//   </script>

class YamaBruhSFX {
  constructor(config = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.preset = config.preset ?? 0;
    this.volume = config.volume ?? 0.8;
    this.duration = config.duration ?? 0.5;
    this.ctx = null;
    this._sources = new Set();
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: this.sampleRate });
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
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

    const cr = preset[0], mr = preset[1], mi = preset[2];
    const atkBase = preset[3], decBase = preset[4], sustain = preset[5];
    const relBase = preset[6], feedback = preset[7];
    const cWave = (preset[8] || 0) | 0;
    const mWave = (preset[9] || 0) | 0;
    const tremDepth = preset[10] || 0;
    const chipVib = preset[11] || 0;
    const ksr = preset[12] || 0;
    const ksl = preset[13] || 0;
    const modLevel = preset[14] !== undefined ? preset[14] : 1;
    const egType = preset[15] || 0;
    const mAtkBase = preset[16] !== undefined ? preset[16] : atkBase;
    const mDecBase = preset[17] !== undefined ? preset[17] : decBase;
    const mSustain = preset[18] !== undefined ? preset[18] : sustain;
    const mRelBase = preset[19] !== undefined ? preset[19] : relBase;
    const mEgType = preset[20] !== undefined ? preset[20] : egType;

    let attack = atkBase, decay = decBase, release = relBase;
    let mAttack = mAtkBase, mDecay = mDecBase, mRelease = mRelBase;
    if (ksr > 0) {
      const octave = Math.log2(freq / 440);
      const ksrFactor = Math.pow(2, -ksr * octave);
      attack *= ksrFactor; decay *= ksrFactor; release *= ksrFactor;
      mAttack *= ksrFactor; mDecay *= ksrFactor; mRelease *= ksrFactor;
    }

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
    const mAttackSamples = Math.floor(mAttack * sr);
    const mDecaySamples = Math.floor(mDecay * sr);

    let carrierPhase = 0, modPhase = 0, prevMod = 0;
    const available = buf.length - offset;
    const count = Math.min(totalSamples, available);

    for (let i = 0; i < count; i++) {
      const t = i / sr;

      let mEnv;
      if (i < mAttackSamples) {
        mEnv = i / (mAttackSamples || 1);
      } else if (i < mAttackSamples + mDecaySamples) {
        mEnv = 1 - (1 - mSustain) * ((i - mAttackSamples) / (mDecaySamples || 1));
      } else if (i < noteSamples) {
        if (mEgType > 0.5) {
          const elapsed = (i - mAttackSamples - mDecaySamples) / sr;
          mEnv = mSustain * Math.pow(0.5, elapsed / (mDecBase * 2 + 0.01));
          if (mEnv < 0.001) mEnv = 0;
        } else { mEnv = mSustain; }
      } else {
        const relMax = Math.max(mRelease * sr, 1);
        mEnv = Math.max(mSustain * (1 - (i - noteSamples) / relMax), 0);
      }

      let env;
      if (i < attackSamples) {
        env = i / (attackSamples || 1);
      } else if (i < attackSamples + decaySamples) {
        env = 1 - (1 - sustain) * ((i - attackSamples) / (decaySamples || 1));
      } else if (i < noteSamples) {
        if (egType > 0.5) {
          const elapsed = (i - attackSamples - decaySamples) / sr;
          env = sustain * Math.pow(0.5, elapsed / (decBase * 2 + 0.01));
          if (env < 0.001) env = 0;
        } else { env = sustain; }
      } else {
        const relMax = Math.max(release * sr, 1);
        env = Math.max(sustain * (1 - (i - noteSamples) / relMax), 0);
      }

      const trem = tremDepth > 0 ? 1 - tremDepth * (1 + Math.sin(TAU * 3.7 * t)) * 0.5 : 1;
      const vibMod = chipVib > 0 ? chipVib * Math.sin(TAU * 6.4 * t) : 0;
      const freqMult = 1 + vibMod;

      const modRaw = _ym2413Wave(modPhase + feedback * prevMod, mWave);
      prevMod = modRaw;
      const modSignal = modRaw * modLevel * mEnv;
      buf[offset + i] += _ym2413Wave(carrierPhase + mi * modSignal, cWave) * env * velocity * 0.45 * trem * kslAtten;

      carrierPhase += TAU * carrierFreq * freqMult / sr;
      modPhase += TAU * modFreq * freqMult / sr;
      if (carrierPhase > TAU) carrierPhase -= TAU;
      if (modPhase > TAU) modPhase -= TAU;
    }

    return count;
  }

  /**
   * Play a single FM note.
   * @param {number|object} noteOrOpts - MIDI note (0-127), or { root, range } for randomized
   * @param {object} opts - { preset, duration, volume, onDone }
   * @returns {AudioBufferSourceNode}
   */
  playNote(noteOrOpts, opts = {}) {
    const ctx = this._ensureCtx();
    const volume = opts.volume ?? this.volume;
    const duration = opts.duration ?? this.duration;
    const presetIdx = opts.preset ?? this.preset;
    const preset = this._getPreset(presetIdx);

    let midi;
    if (typeof noteOrOpts === 'object' && noteOrOpts !== null) {
      const root = noteOrOpts.root ?? 60;
      const range = noteOrOpts.range ?? 12;
      midi = root + Math.floor(Math.random() * (range + 1));
    } else {
      midi = noteOrOpts ?? 60;
    }

    const freq = this._midiToFreq(midi);
    const totalSamples = Math.ceil((duration + (preset[6] || 0.2)) * this.sampleRate);
    const buf = new Float32Array(totalSamples);
    this._renderNote(freq, duration, preset, buf, 0, volume);

    const audioBuffer = ctx.createBuffer(1, buf.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(buf);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
    this._sources.add(source);

    source.onended = () => {
      this._sources.delete(source);
      if (opts.onDone) opts.onDone();
    };
    return source;
  }

  /** Stop all playing sounds */
  stopAll() {
    for (const s of this._sources) {
      try { s.stop(); } catch (_) {}
    }
    this._sources.clear();
  }

  /** Update default config */
  configure(config) {
    if (config.preset !== undefined) this.preset = config.preset;
    if (config.volume !== undefined) this.volume = config.volume;
    if (config.duration !== undefined) this.duration = config.duration;
    if (config.sampleRate !== undefined) this.sampleRate = config.sampleRate;
  }

  /** Preset names (delegates to shared bank) */
  static get PRESET_NAMES() { return YamaBruhNotify.PRESET_NAMES; }

  /**
   * Convert 8 raw YM2413 register bytes (R#00-R#07) to a 21-element preset array.
   * Matches the Swift OPLLPreset.fromRegisters() implementation.
   * @param {number[]} r - 8 register bytes (0-255)
   * @returns {number[]} 21-element preset array
   */
  static fromRegisters(r) {
    if (!r || r.length < 8) throw new Error('Need 8 register bytes (R#00-R#07)');

    const AR_TABLE = [99, 5, 3, 1.8, 1.0, 0.6, 0.35, 0.2, 0.12, 0.07, 0.04, 0.02, 0.01, 0.005, 0.003, 0.001];
    const DR_TABLE = [99, 30, 18, 10, 6, 3.5, 2.0, 1.0, 0.5, 0.3, 0.15, 0.08, 0.04, 0.02, 0.01, 0.005];
    const FB_TABLE = [0, Math.PI/16, Math.PI/8, Math.PI/4, Math.PI/2, Math.PI, Math.PI*2, Math.PI*4];
    const multVal = m => m === 0 ? 0.5 : m;
    const slLevel = sl => Math.pow(10, -3 * sl / 20);

    const modAM   = !!(r[0] & 0x80);
    const modVIB  = !!(r[0] & 0x40);
    const modEG   = !!(r[0] & 0x20);
    const modKSR  = !!(r[0] & 0x10);
    const modMULT = r[0] & 0x0F;

    const carAM   = !!(r[1] & 0x80);
    const carVIB  = !!(r[1] & 0x40);
    const carEG   = !!(r[1] & 0x20);
    const carKSR  = !!(r[1] & 0x10);
    const carMULT = r[1] & 0x0F;

    const modTL   = r[2] & 0x3F;
    const carWF   = (r[3] & 0x20) ? 1 : 0;
    const modWF   = (r[3] & 0x10) ? 1 : 0;
    const fbRaw   = (r[3] >> 1) & 0x07;

    const modAR = (r[4] >> 4) & 0x0F; const modDR = r[4] & 0x0F;
    const carAR = (r[5] >> 4) & 0x0F; const carDR = r[5] & 0x0F;
    const modSL = (r[6] >> 4) & 0x0F; const modRR = r[6] & 0x0F;
    const carSL = (r[7] >> 4) & 0x0F; const carRR = r[7] & 0x0F;

    const tlLinear = Math.pow(10, -0.75 * modTL / 20);
    const mi = tlLinear * 4 * Math.PI;
    const fb = FB_TABLE[fbRaw];

    // [cr, mr, mi, atk, dec, sus, rel, fb, c_wave, m_wave,
    //  trem, vib, ksr, ksl, mod_lvl, eg_type,
    //  m_atk, m_dec, m_sus, m_rel, m_eg_type]
    return [
      multVal(carMULT),           // cr
      multVal(modMULT),           // mr
      mi,                         // mi
      AR_TABLE[Math.min(carAR, 15)], // atk
      DR_TABLE[Math.min(carDR, 15)], // dec
      slLevel(carSL),             // sus
      DR_TABLE[Math.min(carRR, 15)], // rel
      fb,                         // fb
      carWF,                      // c_wave
      modWF,                      // m_wave
      carAM ? 0.5 : 0,           // trem
      carVIB ? 0.5 : 0,          // vib
      carKSR ? 0.3 : 0,          // ksr
      1,                          // ksl
      1,                          // mod_lvl
      carEG ? 0 : 1,             // eg_type (EG=sustained→0, percussive→1)
      AR_TABLE[Math.min(modAR, 15)], // m_atk
      DR_TABLE[Math.min(modDR, 15)], // m_dec
      slLevel(modSL),             // m_sus
      DR_TABLE[Math.min(modRR, 15)], // m_rel
      modEG ? 0 : 1,             // m_eg_type
    ];
  }
}

if (typeof window !== 'undefined') window.YamaBruhSFX = YamaBruhSFX;
