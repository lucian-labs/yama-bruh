// ── YAMA-BRUH AudioWorklet FM Synth (YM2413 Extended) ──────────────────
// Full YM2413 OPLL capabilities: waveform selection, tremolo, chip vibrato,
// KSR, KSL, mod level, EG type. Runs on audio thread — zero overhead.

class YamaBruhProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = [];
    this.preset = [1, 1, 2, 0.01, 0.3, 0.3, 0.2, 0, 0,0, 0,0, 0,0, 1,0];
    // YM2413 LFO phases (shared across voices like hardware)
    this.tremoloPhase = 0;  // 3.7Hz AM
    this.chipVibPhase = 0;  // 6.4Hz pitch
    // User vibrato LFO
    this.vibratoOn = false;
    this.vibratoRate = 5.5;
    this.vibratoDepth = 0.004;
    this.vibratoPhase = 0;
    // Portamento
    this.portaOn = false;
    this.portaTime = 0.08;
    this.lastFreq = 0;
    // Global sustain
    this.sustainOn = false;
    this.sustainMult = 3.0;
    // Pitch bend (±2 semitones default, stored as multiplier)
    this.pitchBend = 1.0;       // frequency multiplier (1.0 = no bend)
    this.pitchBendRange = 2;    // semitones
    // Mod wheel
    this.modWheel = 0;          // 0-1 normalized
    this.modTarget = 'vibrato'; // 'vibrato' | 'modIndex' | 'tremolo'
    // Crash diagnostics
    this._crashCount = 0;
    this._lastCrashReport = 0;
    this.port.onmessage = (e) => this._onMessage(e.data);
  }

  _reportCrash(reason, detail) {
    this._crashCount++;
    const now = currentTime;
    if (now - this._lastCrashReport > 1) {
      this._lastCrashReport = now;
      this.port.postMessage({ type: 'crash', reason, detail, count: this._crashCount });
    }
  }

  _onMessage(msg) {
    switch (msg.type) {
      case 'noteOn': {
        for (let i = this.voices.length - 1; i >= 0; i--) {
          if (this.voices[i].note === msg.note) this.voices.splice(i, 1);
        }
        if (this.voices.length >= 16) this.voices.shift();
        const startFreq = (this.portaOn && this.lastFreq > 0) ? this.lastFreq : msg.freq;
        this.lastFreq = msg.freq;
        this.voices.push({
          note: msg.note,
          freq: msg.freq,
          curFreq: startFreq,
          velocity: msg.velocity,
          cp: 0, mp: 0, pm: 0,
          es: 0, el: 0, et: 0, rl: 0,
          age: 0,
          p: msg.preset || this.preset,
        });
        break;
      }
      case 'noteOff': {
        for (const v of this.voices) {
          if (v.note === msg.note && v.es < 3) {
            v.es = 3;
            v.et = 0;
            v.rl = v.el;
          }
        }
        break;
      }
      case 'preset': {
        this.preset = msg.params;
        // Update all active voices so fader changes are heard immediately
        for (const v of this.voices) {
          v.p = msg.params;
        }
        break;
      }
      case 'vibrato': {
        this.vibratoOn = msg.on;
        if (msg.rate !== undefined) this.vibratoRate = msg.rate;
        if (msg.depth !== undefined) this.vibratoDepth = msg.depth;
        break;
      }
      case 'portamento': {
        this.portaOn = msg.on;
        if (msg.time !== undefined) this.portaTime = msg.time;
        break;
      }
      case 'sustain': {
        this.sustainOn = msg.on;
        if (msg.mult !== undefined) this.sustainMult = msg.mult;
        break;
      }
      case 'pitchBend': {
        // msg.value: 0-16383 (14-bit MIDI), 8192 = center
        const centered = (msg.value - 8192) / 8192; // -1 to +1
        this.pitchBend = Math.pow(2, centered * this.pitchBendRange / 12);
        break;
      }
      case 'modWheel': {
        this.modWheel = msg.value; // 0-1 normalized
        break;
      }
      case 'modTarget': {
        this.modTarget = msg.target || 'vibrato'; // 'vibrato' | 'modIndex' | 'tremolo'
        break;
      }
      case 'pitchBendRange': {
        this.pitchBendRange = msg.semitones || 2;
        break;
      }
      case 'healthCheck': {
        this.port.postMessage({
          type: 'health',
          voices: this.voices.length,
          limiter: 'soft-knee',
          engine: 'ym2413-extended',
          crashes: this._crashCount,
          pitchBend: this.pitchBend,
          modWheel: this.modWheel,
          modTarget: this.modTarget,
        });
        break;
      }
    }
  }

  process(inputs, outputs) {
    const out = outputs[0][0];
    if (!out) return true;

    const sr = sampleRate;
    const TAU = 6.283185307179586;
    const HALF_PI = 1.5707963;
    const len = out.length;
    const dt = 1 / sr;

    const vibOn = this.vibratoOn;
    const vibRate = this.vibratoRate;
    const vibDepth = this.vibratoDepth;
    const portaOn = this.portaOn;
    const portaCoeff = this.portaTime > 0.001 ? Math.exp(-dt / this.portaTime) : 0;
    const susOn = this.sustainOn;
    const susMult = this.sustainMult;
    const pbMult = this.pitchBend;
    const modW = this.modWheel;
    const modTgt = this.modTarget;

    for (let i = 0; i < len; i++) {
      let s = 0;

      // ── YM2413 shared LFOs (hardware-accurate: single LFO for all voices) ──
      // Tremolo at 3.7Hz
      const tremVal = Math.sin(this.tremoloPhase);
      this.tremoloPhase += TAU * 3.7 * dt;
      if (this.tremoloPhase > TAU) this.tremoloPhase -= TAU;

      // Chip vibrato at 6.4Hz
      const chipVibVal = Math.sin(this.chipVibPhase);
      this.chipVibPhase += TAU * 6.4 * dt;
      if (this.chipVibPhase > TAU) this.chipVibPhase -= TAU;

      // User vibrato
      let vibMod = 0;
      if (vibOn) {
        vibMod = Math.sin(this.vibratoPhase) * vibDepth;
        this.vibratoPhase += TAU * vibRate * dt;
        if (this.vibratoPhase > TAU) this.vibratoPhase -= TAU;
      }

      for (let vi = this.voices.length - 1; vi >= 0; vi--) {
        const v = this.voices[vi];
        const p = v.p;

        // Portamento
        if (portaOn && v.curFreq !== v.freq) {
          v.curFreq = v.freq + (v.curFreq - v.freq) * portaCoeff;
          if (Math.abs(v.curFreq - v.freq) < 0.1) v.curFreq = v.freq;
        } else {
          v.curFreq = v.freq;
        }

        // Apply pitch bend to base frequency
        const baseFreq = v.curFreq * pbMult;

        // ── YM2413 extended params ──
        const crf_ratio = p[0], mrf_ratio = p[1];
        // Mod wheel can boost mod index
        const mi = modTgt === 'modIndex' ? p[2] * (1 + modW * 3) : p[2];
        const atk = p[3], dec = p[4], sus = p[5];
        const rel = susOn ? p[6] * susMult : p[6];
        const fb = p[7];
        const cWave = (p[8] || 0) | 0;  // carrier waveform 0-3
        const mWave = (p[9] || 0) | 0;  // modulator waveform 0-3
        // Mod wheel can boost tremolo or vibrato depth
        const tremDepth = (p[10] || 0) + (modTgt === 'tremolo' ? modW * 0.8 : 0);
        const chipVib = (p[11] || 0) + (modTgt === 'vibrato' ? modW * 0.02 : 0);
        const ksr = p[12] || 0;          // key scale rate
        const ksl = p[13] || 0;          // key scale level (dB/oct)
        const modLevel = p[14] !== undefined ? p[14] : 1;  // mod output level
        const egType = p[15] || 0;       // 0=sustained, 1=percussive

        // Chip vibrato + user vibrato combined
        const freqMult = 1 + (chipVib > 0 ? chipVib * chipVibVal : 0) + vibMod;
        const freq = baseFreq * freqMult;

        const crf = freq * crf_ratio;
        const mrf = freq * mrf_ratio;

        // KSR: scale envelope times
        let atkScaled = atk, decScaled = dec, relScaled = rel;
        if (ksr > 0) {
          const octave = Math.log2(baseFreq / 440);
          const ksrFactor = Math.pow(2, -ksr * octave);
          atkScaled *= ksrFactor;
          decScaled *= ksrFactor;
          relScaled *= ksrFactor;
        }

        // KSL: volume attenuation above A4
        let kslAtten = 1;
        if (ksl > 0) {
          const octave = Math.log2(baseFreq / 440);
          if (octave > 0) kslAtten = Math.pow(10, -ksl * octave / 20);
        }

        // Tremolo AM
        const trem = tremDepth > 0 ? 1 - tremDepth * (1 + tremVal) * 0.5 : 1;

        // Age tracking
        v.age += dt;
        if (v.age > 30) { this.voices.splice(vi, 1); continue; }

        // ── Envelope (ADSR with KSR scaling) ──
        let env;
        v.et += dt;

        if (v.es === 0) {
          env = atkScaled > 0.0001 ? v.et / atkScaled : 1;
          if (env >= 1) { env = 1; v.es = 1; v.et = 0; }
          v.el = env;
        } else if (v.es === 1) {
          const t = decScaled > 0.0001 ? v.et / decScaled : 1;
          env = t >= 1 ? sus : 1 - (1 - sus) * t;
          if (t >= 1) { v.es = 2; v.et = 0; }
          v.el = env;
        } else if (v.es === 2) {
          // EG type: percussive continues decaying, sustained holds
          if (egType > 0.5) {
            const percDecay = sus * Math.pow(0.5, v.et / (dec * 2 + 0.01));
            env = percDecay > 0.001 ? percDecay : 0;
            if (env <= 0.001) { this.voices.splice(vi, 1); continue; }
          } else {
            env = sus;
          }
          v.el = env;
        } else {
          const t = relScaled > 0.0001 ? v.et / relScaled : 1;
          env = t >= 1 ? 0 : v.rl * (1 - t);
          if (t >= 1) { this.voices.splice(vi, 1); continue; }
        }

        // ── 2-op FM with YM2413 waveforms ──
        const ms = _waveform(v.mp + fb * v.pm, mWave) * modLevel;
        v.pm = ms;
        const voiceSample = _waveform(v.cp + mi * ms, cWave) * env * v.velocity * 0.35 * trem * kslAtten;

        // NaN guard
        if (voiceSample !== voiceSample || !isFinite(v.cp) || !isFinite(v.mp)) {
          this._reportCrash('nan_voice', { note: v.note, freq: v.freq, cp: v.cp, mp: v.mp });
          this.voices.splice(vi, 1);
          continue;
        }

        s += voiceSample;

        v.cp += TAU * crf / sr;
        v.mp += TAU * mrf / sr;
        if (v.cp > TAU) v.cp -= TAU;
        if (v.mp > TAU) v.mp -= TAU;
      }

      // NaN guard
      if (s !== s) {
        s = 0;
        this._reportCrash('nan_output', { voices: this.voices.length });
      }

      // ── YM2413 DAC noise (9-bit quantization + noise floor) ────
      // Simulate the chip's lo-fi DAC: bit-crush to ~9-bit resolution
      const dacLevels = 512; // 9-bit DAC
      s = Math.round(s * dacLevels) / dacLevels;
      // Analog noise floor — subtle hiss like real hardware
      s += (Math.random() - 0.5) * 0.0012;

      // ── Soft-knee limiter (no compressor) ──────────────────────
      const absS = s < 0 ? -s : s;
      if (absS > 0.5) {
        const over = absS - 0.5;
        const gain = 0.5 + over / (1.0 + over * 2.0);
        s = s < 0 ? -gain : gain;
      }
      if (s > 0.95) s = 0.95;
      else if (s < -0.95) s = -0.95;

      out[i] = s;
    }

    return true;
  }
}

// ── YM2413 Waveform Types ──────────────────────────────────────────────
// 0=sine, 1=half-sine (rectified +), 2=abs-sine, 3=quarter-sine
function _waveform(phase, type) {
  switch (type) {
    case 1: { const s = Math.sin(phase); return s > 0 ? s : 0; }
    case 2: return Math.abs(Math.sin(phase));
    case 3: {
      const TAU = 6.283185307179586;
      let p = phase % TAU;
      if (p < 0) p += TAU;
      return p < 1.5707963 ? Math.sin(p) : 0;
    }
    default: return Math.sin(phase);
  }
}

registerProcessor('yambruh-synth', YamaBruhProcessor);
